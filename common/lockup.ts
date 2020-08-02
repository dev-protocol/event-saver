/* eslint-disable no-await-in-loop */
import { Connection, EntityManager } from 'typeorm'
import { TimerBatchBase } from '../common/base'
import { getTargetRecordsSeparatedByBlockNumber } from '../common/utils'
import { DbConnection, Transaction } from '../common/db/common'
import {
	getEventRecord,
	getProcessedBlockNumber,
	setProcessedBlockNumber,
} from '../common/db/event'
import { LockupLockedup } from '../entities/lockup-lockedup'
import { DevPropertyTransfer } from '../entities/dev-property-transfer'

export abstract class LockupInfoCreator extends TimerBatchBase {
	async innerExecute(): Promise<void> {
		const db = new DbConnection(this.getBatchName())
		await db.connect()

		try {
			await this.createCurrentLockupRecord(db.connection)
			// eslint-disable-next-line no-useless-catch
		} catch (e) {
			throw e
		} finally {
			await db.quit()
		}
	}

	private async getLockupedRecord(
		con: Connection,
		record: DevPropertyTransfer
	): Promise<LockupLockedup> {
		const repository = con.getRepository(LockupLockedup)
		const [
			walletAddress,
			propertyAddress,
		] = await this.getAddressFromDevPropertyTransfer(record)

		const findRecords = await repository.find({
			block_number: record.block_number,
			transaction_index: record.transaction_index,
			from_address: walletAddress,
			property: propertyAddress,
			token_value: record.value,
		})
		if (findRecords.length === 1) {
			return findRecords[0]
		}

		if (findRecords.length === 0) {
			throw new Error('not found lockup_lockuped record.')
		}

		throw new Error('get many lockup_lockuped record.')
	}

	private async getAddressFromDevPropertyTransfer(
		record: DevPropertyTransfer
	): Promise<string[]> {
		if (record.is_lockup) {
			return [record.from_address, record.to_address]
		}

		return [record.to_address, record.from_address]
	}

	private async createCurrentLockupRecord(con: Connection): Promise<void> {
		const blockNumber = await getProcessedBlockNumber(con, this.getBatchName())
		const records = await getEventRecord(
			con,
			DevPropertyTransfer,
			blockNumber + 1
		)
		if (records.length === 0) {
			this.logging.infolog('no target record')
			return
		}

		const targetRecords = getTargetRecordsSeparatedByBlockNumber(records, 100)

		const transaction = new Transaction(con)
		try {
			await transaction.start()
			this.logging.infolog(`record count：${targetRecords.length}`)
			let count = 0
			let maxBlockNumber = 0
			for (let record of targetRecords) {
				const [
					accountAddress,
					propertyAddress,
				] = await this.getAddressFromDevPropertyTransfer(record)
				const oldCurrentLockup = await this.getOldRecord(
					transaction.manager,
					accountAddress,
					propertyAddress
				)
				maxBlockNumber = Math.max(maxBlockNumber, record.block_number)
				if (record.is_lockup) {
					const lockedup = await this.getLockupedRecord(con, record)
					const lockedupEventId = lockedup.event_id
					const oldValue =
						typeof oldCurrentLockup === 'undefined'
							? 0
							: Number(oldCurrentLockup.value)
					const insertRecord = this.getModel()
					insertRecord.account_address = accountAddress
					insertRecord.property_address = propertyAddress
					insertRecord.value = Number(record.value) + Number(oldValue)
					insertRecord.locked_up_event_id = lockedupEventId
					await transaction.save(insertRecord)
				} else {
					if (typeof oldCurrentLockup === 'undefined') {
						continue
					}

					if (oldCurrentLockup.value !== record.value) {
						throw new Error('the values of lockup and withdraw are different.')
					}

					await transaction.remove(oldCurrentLockup)
				}

				count++
				if (count % 10 === 0) {
					this.logging.infolog(`records were processed：${count}`)
				}
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

	abstract getModel(): any
	abstract async getOldRecord(
		manager: EntityManager,
		accountAddress: string,
		propertyAddress: string
	): Promise<any>
}
