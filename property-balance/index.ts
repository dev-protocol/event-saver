/* eslint-disable no-await-in-loop */
import { AzureFunction, Context } from '@azure/functions'
import { Connection } from 'typeorm'
import { TimerBatchBase } from '../common/base'
import { getTargetRecordsSeparatedByBlockNumber } from '../common/utils'
import { DbConnection, Transaction } from '../common/db/common'
import {
	getProcessedBlockNumber,
	setProcessedBlockNumber,
	getEventRecord,
	getRecordByBlockNumber,
	PropertyBalanceAccessor,
} from '../common/db/dao'
import { PropertyData } from '../common/property'
import { WithdrawPropertyTransfer } from '../entities/withdraw-property_transfer'
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
			const transaction = new Transaction(db.connection)
			try {
				await transaction.start()
				this.logging.infolog('property transfer')
				await this.createByPropertyTransfer(db.connection, transaction)
				this.logging.infolog('withdraw property transfer')
				await this.createByWithdrawPropertyTransfer(db.connection, transaction)
				await transaction.commit()
			} catch (e) {
				await transaction.rollback()
				throw e
			} finally {
				await transaction.finish()
			}
		} catch (e) {
			throw e
		} finally {
			await db.quit()
		}
	}

	private async createByPropertyTransfer(
		con: Connection,
		transaction: Transaction
	): Promise<void> {
		const key = this.getBatchName() + '-by-transfer'
		const blockNumber = await getProcessedBlockNumber(con, key)
		if (blockNumber === 0) {
			throw new Error(`not set ${key} at processed_block_number`)
		}

		const records = await getRecordByBlockNumber(
			con,
			PropertyMeta,
			blockNumber + 1
		)
		if (records.length === 0) {
			this.logging.infolog('no target record')
			return
		}

		const targetRecords = getTargetRecordsSeparatedByBlockNumber(records, 100)
		this.logging.infolog(`record count：${targetRecords.length}`)
		for (let record of targetRecords) {
			await this.createPropertyBalance(
				con,
				record.property,
				record.block_number,
				transaction
			)
		}

		await setProcessedBlockNumber(
			transaction,
			this.getBatchName(),
			this.getMaxBlockNumber(targetRecords)
		)
		this.logging.infolog(`all records were inserted：${targetRecords.length}`)
	}

	private getMaxBlockNumber(records: any[]): number {
		const tmp = records.map((record) => {
			return record.block_number
		})
		const maxBlockNumber = Math.max(...tmp)
		return maxBlockNumber
	}

	private async createPropertyBalance(
		con: Connection,
		propertyAddress: string,
		endBlockNumber: number,
		transaction: Transaction
	): Promise<void> {
		const propertyBalanceAccessor = new PropertyBalanceAccessor(transaction)
		const web3 = new Web3(
			new Web3.providers.HttpProvider(process.env.WEB3_URL!)
		)
		const property = new PropertyData(web3, con, propertyAddress)
		await property.load()

		const hasAllToken = await property.hasAllTokenByAuthor()
		if (hasAllToken) {
			await propertyBalanceAccessor.deleteRecord(propertyAddress)
			return
		}

		const events = await property.getTransferEvent(endBlockNumber + 1)
		await propertyBalanceAccessor.insertRecord(
			events,
			propertyAddress,
			property.author
		)
	}

	private async createByWithdrawPropertyTransfer(
		con: Connection,
		transaction: Transaction
	): Promise<void> {
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
		this.logging.infolog(`record count：${targetRecords.length}`)
		for (let record of targetRecords) {
			await this.createPropertyBalance(
				con,
				record.property_address,
				record.block_number,
				transaction
			)
		}

		await setProcessedBlockNumber(
			transaction,
			this.getBatchName(),
			this.getMaxBlockNumber(targetRecords)
		)
		this.logging.infolog(`all records were inserted：${targetRecords.length}`)
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
