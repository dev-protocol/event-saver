/* eslint-disable no-await-in-loop */
import { AzureFunction, Context } from '@azure/functions'
import { Connection } from 'typeorm'
import BigNumber from 'bignumber.js'
import { TimerBatchBase } from '../common/base'
import { getTargetRecordsSeparatedByBlockNumber } from '../common/utils'
import { getPolicyInstance } from '../common/block-chain/utils'
import { DbConnection, Transaction } from '../common/db/common'
import { getMaxBlockNumber, getEventRecord } from '../common/db/event'
import { RewardCalculationResult } from '../entities/reward-calculation-result'
import { AllocatorAllocationResult } from '../entities/allocator-allocation-result'
/* eslint-disable @typescript-eslint/no-var-requires */
const Web3 = require('web3')

class RewardCalculationer extends TimerBatchBase {
	getBatchName(): string {
		return 'property-authentication'
	}

	async innerExecute(): Promise<void> {
		const db = new DbConnection(this.getBatchName())
		await db.connect()

		try {
			await this.calculateReward(db.connection)
			// eslint-disable-next-line no-useless-catch
		} catch (e) {
			throw e
		} finally {
			await db.quit()
		}
	}

	private async calculateReward(con: Connection): Promise<void> {
		const blockNumber = await getMaxBlockNumber(con, RewardCalculationResult)
		const records = await getEventRecord(
			con,
			AllocatorAllocationResult,
			blockNumber + 1
		)
		if (records.length === 0) {
			this.logging.infolog('no target record')
			return
		}

		const targetRecords = getTargetRecordsSeparatedByBlockNumber(records, 100)

		const web3 = new Web3(
			new Web3.providers.HttpProvider(process.env.WEB3_URL!)
		)

		const policyInstance = await getPolicyInstance(con, web3)

		const transaction = new Transaction(con)

		try {
			await transaction.start()
			this.logging.infolog(`record count：${targetRecords.length}`)
			let count = 0

			for (let record of targetRecords) {
				const insertRecord = new RewardCalculationResult()
				insertRecord.event_id = record.event_id
				insertRecord.block_number = record.block_number
				insertRecord.metrics = record.metrics
				insertRecord.lockup = record.lockup_value
				insertRecord.allocate_result = record.result
				const tmp = await policyInstance.methods
					.holdersShare(record.result, record.lockup_value)
					.call()
				const holderReward = new BigNumber(tmp)
				const stakingReward = new BigNumber(record.result).minus(holderReward)
				insertRecord.holder_reward = holderReward.toString()
				insertRecord.staking_reward = stakingReward.toString()
				insertRecord.policy = policyInstance.options.address
				await transaction.save(insertRecord)
				count++
				if (count % 10 === 0) {
					this.logging.infolog(`records were inserted：${count}`)
				}
			}

			await transaction.commit()
			this.logging.infolog(`all records were inserted：${targetRecords.length}`)
		} catch (e) {
			await transaction.rollback()
			throw e
		} finally {
			await transaction.finish()
		}
	}
}

const timerTrigger: AzureFunction = async function (
	context: Context,
	myTimer: any
): Promise<void> {
	const dataCreator = new RewardCalculationer(context, myTimer)
	await dataCreator.execute()
}

export default timerTrigger
