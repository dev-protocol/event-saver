import { AzureFunction, Context } from '@azure/functions'
import { Connection } from 'typeorm'
import { TimerBatchBase } from '../common/base'
import {
	setProcessedBlockNumber,
	getProcessedBlockNumber,
	getEventRecordThenGreaterBlockNumber,
} from '../common/db/dao'
import {
	getTargetRecordsSeparatedByBlockNumber,
	getMaxBlockNumber,
} from '../common/utils'
import { DbConnection, Transaction } from '../common/db/common'
import { createPropertyBalance } from '../common/property-balance'
import { PropertyFactoryChangeAuthor } from '../entities/property-factory-change-author'
import { PropertyMeta } from '../entities/property-meta'

/* eslint-disable @typescript-eslint/no-var-requires */
const Web3 = require('web3')

class PropertyAuthorUpdate extends TimerBatchBase {
	getBatchName(): string {
		return 'property-author-update'
	}

	async innerExecute(): Promise<void> {
		const db = new DbConnection(this.getBatchName())
		await db.connect()

		try {
			await this.movePropertyAuthenticationRecord(db.connection)
		} catch (e) {
			throw e
		} finally {
			await db.quit()
		}
	}

	private async movePropertyAuthenticationRecord(
		con: Connection
	): Promise<void> {
		const records = await this.getEvents(con)
		if (records.length === 0) {
			this.logging.infolog('no target record')
			return
		}

		const targetRecords = getTargetRecordsSeparatedByBlockNumber(records, 100)
		const transaction = new Transaction(con)
		try {
			await transaction.start()
			this.logging.infolog(`record count：${targetRecords.length}`)
			for (const data of targetRecords) {
				if (data.before_author === data.after_author) {
					continue
				}

				// eslint-disable-next-line no-await-in-loop
				await transaction.manager.update(
					PropertyMeta,
					{ property: data.property },
					{ author: data.after_author }
				)
				// eslint-disable-next-line no-await-in-loop
				await createPropertyBalance(
					con,
					data.property,
					data.block_number,
					transaction
				)
			}

			await setProcessedBlockNumber(
				transaction,
				this.getBatchName(),
				getMaxBlockNumber(targetRecords)
			)
			await transaction.commit()
		} catch (e) {
			await transaction.rollback()
			throw e
		} finally {
			await transaction.finish()
		}
	}

	private async getEvents(
		con: Connection
	): Promise<PropertyFactoryChangeAuthor[]> {
		const blockNumber = await getProcessedBlockNumber(con, this.getBatchName())
		this.logging.infolog(`processed block number:${blockNumber}`)
		const records = await getEventRecordThenGreaterBlockNumber(
			con,
			PropertyFactoryChangeAuthor,
			blockNumber + 1
		)
		return records
	}
}

const timerTrigger: AzureFunction = async function (
	context: Context,
	myTimer: any
): Promise<void> {
	const dataCreator = new PropertyAuthorUpdate(context, myTimer)
	await dataCreator.execute()
}

export default timerTrigger
