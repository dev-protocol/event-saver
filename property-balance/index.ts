/* eslint-disable no-await-in-loop */
import { AzureFunction, Context } from '@azure/functions'
import { Connection } from 'typeorm'
import { TimerBatchBase } from '../common/base'
import { getTargetRecordsSeparatedByBlockNumber } from '../common/utils'
import { ZERO_ADDRESS } from '../common/block-chain/utils'
import { DbConnection, Transaction } from '../common/db/common'
import {
	getProcessedBlockNumber,
	setProcessedBlockNumber,
	getEventRecord,
} from '../common/db/event'
import { getPropertyInstance } from '../common/block-chain/utils'
import { WithdrawPropertyTransfer } from '../entities/withdraw-property_transfer'
import { PropertyBalance } from '../entities/property-balance'
import { PropertyMeta } from '../entities/property-meta'
/* eslint-disable @typescript-eslint/no-var-requires */
const Web3 = require('web3')

class PropertyBalanceCreator extends TimerBatchBase {
	getBatchName(): string {
		return 'property-balance'
	}

	async innerExecute(): Promise<void> {
		const db = new DbConnection(this.getBatchName())
		await db.connect()

		try {
			await this.createPropertyMetaRecord(db.connection)
			// eslint-disable-next-line no-useless-catch
		} catch (e) {
			throw e
		} finally {
			await db.quit()
		}
	}

	private async createRecord(
		propertyAddress: string,
		events: Array<Map<string, any>>,
		author: string,
		totalSupply: number
	): Promise<PropertyBalance[]> {
		const balance = new Map<string, number>()
		balance.set(author, totalSupply)
		const blockNumber = new Map<string, number>()
		for (let event of events) {
			const eventMap = new Map(Object.entries(event))
			const values = eventMap.get('returnValues')
			if (values.from === ZERO_ADDRESS) {
				continue
			}

			const fromBalance = balance.get(values.from)
			const toBalance =
				typeof balance.get(values.to) === 'undefined'
					? 0
					: balance.get(values.to)
			balance.set(values.from, fromBalance - Number(values.value))
			balance.set(values.to, toBalance + Number(values.value))
			blockNumber.set(values.from, eventMap.get('blockNumber'))
			blockNumber.set(values.to, eventMap.get('blockNumber'))
		}

		const result = []
		balance.forEach(function (balance, account) {
			const record = new PropertyBalance()
			record.property_address = propertyAddress
			record.account_address = account
			record.balance = balance.toString()
			record.is_author = account === author
			record.block_number = blockNumber.get(account)
			result.push(record)
		})
		return result
	}

	private async deleteRecord(
		transaction: Transaction,
		propertyAddresson: string
	): Promise<void> {
		const records = await transaction.manager.find(PropertyBalance, {
			property_address: propertyAddresson,
		})
		for (let record of records) {
			await transaction.remove(record)
		}
	}

	private async insertRecord(
		transaction: Transaction,
		propertyBalanceRecords: PropertyBalance[]
	): Promise<void> {
		for (let record of propertyBalanceRecords) {
			await transaction.save(record)
		}
	}

	private async getPropertyCreatedBlockNumber(
		con: Connection,
		propertyAddress: string
	): Promise<number> {
		const repository = con.getRepository(PropertyMeta)
		const record = await repository.findOneOrFail({
			property: propertyAddress,
		})
		return record.block_number
	}

	private async createPropertyMetaRecord(con: Connection): Promise<void> {
		const blockNumber = await getProcessedBlockNumber(con, this.getBatchName())
		const records = await getEventRecord(
			con,
			WithdrawPropertyTransfer,
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
		const transaction = new Transaction(con)
		try {
			await transaction.start()
			this.logging.infolog(`record count：${targetRecords.length}`)
			let maxBlockNumber = 0
			for (let record of targetRecords) {
				const propertyInstance = await getPropertyInstance(
					con,
					web3,
					record.property_address
				)
				maxBlockNumber = Math.max(maxBlockNumber, record.block_number)
				const author = await propertyInstance.methods.author().call()
				const authorBalance = await propertyInstance.methods
					.balanceOf(author)
					.call()
				const totalSupply = await propertyInstance.methods.totalSupply().call()
				if (Number(totalSupply) === Number(authorBalance)) {
					await this.deleteRecord(transaction, record.property_address)
					continue
				}

				const createdBlockNumber = await this.getPropertyCreatedBlockNumber(
					con,
					record.property_address
				)
				const events = await propertyInstance.getPastEvents('Transfer', {
					fromBlock: createdBlockNumber - 1,
					toBlock: record.block_number + 1,
				})
				const propertyBalanceRecords = await this.createRecord(
					record.property_address,
					events,
					author,
					totalSupply
				)
				await this.deleteRecord(transaction, record.property_address)
				await this.insertRecord(transaction, propertyBalanceRecords)
			}

			await setProcessedBlockNumber(
				transaction,
				this.getBatchName(),
				maxBlockNumber
			)
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
	const dataCreator = new PropertyBalanceCreator(context, myTimer)
	await dataCreator.execute()
}

export default timerTrigger
