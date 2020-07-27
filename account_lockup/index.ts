/* eslint-disable no-await-in-loop */
import { AzureFunction, Context } from '@azure/functions'
import { Connection } from 'typeorm'
import { TimerBatchBase } from '../common/base'
import { getTargetRecordsSeparatedByBlockNumber } from '../common/utils'
import { DbConnection, Transaction } from '../common/db/common'
import { getMaxBlockNumber, getEventRecord } from '../common/db/event'
import { LockupLockedup } from '../entities/lockup-lockedup'
import { DevPropertyTransfer } from '../entities/dev-property-transfer'
import { AccounLockup } from '../entities/account_lockup'

class AccountLockupCreator extends TimerBatchBase {
	getBatchName(): string {
		return 'account-lockup'
	}

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

	private async getOldRecord(
		con: Connection,
		accountAddress: string,
		propertyAddress: string
	): Promise<AccounLockup> {
		const repository = con.getRepository(AccounLockup)

		const findRecords = await repository.findOne({
			account_address: accountAddress,
			property_address: propertyAddress,
		})
		if (typeof findRecords === 'undefined') {
			return undefined
		}

		return findRecords
	}

	private async getAddressFromDevPropertyTransfer(
		record: DevPropertyTransfer
	): Promise<string[]> {
		if (record.is_from_address_property) {
			return [record.to_address, record.from_address]
		}

		return [record.from_address, record.to_address]
	}

	private async createCurrentLockupRecord(con: Connection): Promise<void> {
		const blockNumber = await getMaxBlockNumber(con, AccounLockup)
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
			for (let record of targetRecords) {
				const [
					accountAddress,
					propertyAddress,
				] = await this.getAddressFromDevPropertyTransfer(record)
				const oldCurrentLockup = await this.getOldRecord(
					con,
					accountAddress,
					propertyAddress
				)
				if (record.is_from_address_property) {
					if (typeof oldCurrentLockup === 'undefined') {
						continue
					}

					if (oldCurrentLockup.value !== record.value) {
						throw new Error('the values of lockup and withdraw are different.')
					}

					await transaction.remove(oldCurrentLockup)
				} else {
					const lockedup = await this.getLockupedRecord(con, record)
					const lockedupEventId = lockedup.event_id
					const oldValue =
						typeof oldCurrentLockup === 'undefined' ? 0 : oldCurrentLockup.value
					const insertRecord = new AccounLockup()
					insertRecord.account_address = accountAddress
					insertRecord.property_address = propertyAddress
					insertRecord.value = record.value + oldValue
					insertRecord.block_number = record.block_number
					insertRecord.locked_up_event_id = lockedupEventId
					await transaction.save(insertRecord)
				}

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
	const dataCreator = new AccountLockupCreator(context, myTimer)
	await dataCreator.execute()
}

export default timerTrigger
