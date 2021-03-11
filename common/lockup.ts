/* eslint-disable no-await-in-loop */
import { Connection, EntityManager } from 'typeorm'
import BigNumber from 'bignumber.js'
import { TimerBatchBase } from '../common/base'
import { getTargetRecordsSeparatedByBlockNumber } from '../common/utils'
import { DbConnection, Transaction } from '../common/db/common'
import {
	getEventRecordThenGreaterBlockNumber,
	getProcessedBlockNumber,
	setProcessedBlockNumber,
	insertIgnoreDevPropertyTransfer,
	LockedupEventId,
} from './db/dao'
import { DevPropertyTransfer } from '../entities/dev-property-transfer'
import { AccountLockup } from '../entities/account-lockup'
import { PropertyLockup } from '../entities/property-lockup'
import { getWalletAddressAndPropertyAddress } from './utils'

export abstract class LockupInfoCreator extends TimerBatchBase {
	async innerExecute(): Promise<void> {
		const db = new DbConnection(this.getBatchName())
		await db.connect()

		try {
			await this.createCurrentLockupRecord(db.connection)
		} catch (e) {
			throw e
		} finally {
			await db.quit()
		}
	}

	private async createCurrentLockupRecord(con: Connection): Promise<void> {
		const eventId = new LockedupEventId(con)
		await eventId.prepare()
		const blockNumber = await getProcessedBlockNumber(con, this.getBatchName())
		this.logging.infolog(`start block number：${blockNumber + 1}`)
		const records = await getEventRecordThenGreaterBlockNumber(
			con,
			DevPropertyTransfer,
			blockNumber + 1
		)
		if (records.length === 0) {
			this.logging.infolog('no target record')
			return
		}

		const targetRecords = getTargetRecordsSeparatedByBlockNumber(records, 300)

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
				] = getWalletAddressAndPropertyAddress(record)
				const oldCurrentLockup = await this.getOldRecord(
					transaction.manager,
					accountAddress,
					propertyAddress
				)
				maxBlockNumber = Math.max(maxBlockNumber, record.block_number)
				if (record.is_lockup) {
					const [
						isContinue,
						lockedupEventId,
					] = await eventId.getLockedupEventId(record)
					if (isContinue) {
						await insertIgnoreDevPropertyTransfer(transaction, record)
						continue
					}

					const oldValue =
						typeof oldCurrentLockup === 'undefined'
							? 0
							: new BigNumber(oldCurrentLockup.value)
					const insertRecord = this.getModel()
					insertRecord.account_address = accountAddress
					insertRecord.property_address = propertyAddress
					const tmp = new BigNumber(record.value).plus(oldValue)
					insertRecord.value = tmp.toString()
					insertRecord.locked_up_event_id = lockedupEventId
					insertRecord.block_number = record.block_number
					await transaction.save(insertRecord)
				} else {
					if (typeof oldCurrentLockup === 'undefined') {
						continue
					}

					if (oldCurrentLockup.value === record.value.toString()) {
						await transaction.remove(oldCurrentLockup)
					} else {
						const tmp = new BigNumber(oldCurrentLockup.value).minus(
							new BigNumber(record.value)
						)
						oldCurrentLockup.value = tmp.toString()
						await transaction.save(oldCurrentLockup)
					}
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

	abstract getModel(): AccountLockup | PropertyLockup
	abstract getOldRecord(
		manager: EntityManager,
		accountAddress: string,
		propertyAddress: string
	): Promise<AccountLockup | PropertyLockup>
}
