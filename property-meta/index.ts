/* eslint-disable no-await-in-loop */
import { AzureFunction, Context } from '@azure/functions'
import { Connection } from 'typeorm'
import { TimerBatchBase } from '../common/base'
import { getTargetRecordsSeparatedByBlockNumber } from '../common/utils'
import { DbConnection, Transaction } from '../common/db/common'
import { getMaxBlockNumber, getEventRecord } from '../common/db/event'
import { getPropertyInstance } from '../common/block-chain/utils'
import { PropertyMeta } from '../entities/property-meta'
import { PropertyFactoryCreate } from '../entities/property-factory-create'
/* eslint-disable @typescript-eslint/no-var-requires */
const Web3 = require('web3')

class PropertyMetaCreator extends TimerBatchBase {
	getBatchName(): string {
		return 'property-meta'
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

	private async hasRecord(
		con: Connection,
		authorAddress: string,
		prpertyAddress: string
	): Promise<boolean> {
		const repository = con.getRepository(PropertyMeta)
		const record = await repository.findOne({
			author: authorAddress,
			property: prpertyAddress,
		})
		return typeof record !== 'undefined'
	}

	private async createPropertyMetaRecord(con: Connection): Promise<void> {
		const blockNumber = await getMaxBlockNumber(con, PropertyMeta)
		const records = await getEventRecord(
			con,
			PropertyFactoryCreate,
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
			let count = 0
			for (let record of targetRecords) {
				const propertyInstance = await getPropertyInstance(
					con,
					web3,
					record.property
				)
				const tmp = await propertyInstance.methods.author().call()
				const author = String(tmp)
				if (await this.hasRecord(con, author, record.property)) {
					throw new Error(
						`property meta data is already exists author:${author} property:${record.property}`
					)
				}

				const insertRecord = new PropertyMeta()
				insertRecord.author = author
				insertRecord.property = record.property
				insertRecord.sender = record.from_address
				insertRecord.block_number = record.block_number
				insertRecord.name = await propertyInstance.methods.name().call()
				insertRecord.symbol = await propertyInstance.methods.symbol().call()
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
	const dataCreator = new PropertyMetaCreator(context, myTimer)
	await dataCreator.execute()
}

export default timerTrigger
