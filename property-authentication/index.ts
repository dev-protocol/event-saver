/* eslint-disable no-await-in-loop */
import { AzureFunction, Context } from '@azure/functions'
import { Connection } from 'typeorm'
import { TimerBatchBase } from '../common/base'
import { getTargetRecordsSeparatedByBlockNumber } from '../common/utils'
import { DbConnection, Transaction } from '../common/db/common'
import { getMaxBlockNumber, getEventRecord } from '../common/db/event'
import {
	getPropertyByMetrics,
	getAuthenticationIdByMetrics,
} from '../common/block-chain/utils'
import { PropertyAuthentication } from '../entities/property-authentication'
import { MetricsFactoryCreate } from '../entities/metrics-factory-create'
/* eslint-disable @typescript-eslint/no-var-requires */
const Web3 = require('web3')

class PropertyAuthenticationCreator extends TimerBatchBase {
	getBatchName(): string {
		return 'property-authentication'
	}

	async innerExecute(): Promise<void> {
		const db = new DbConnection(this.getBatchName())
		await db.connect()

		try {
			await this.createPropertyAuthenticationRecord(db.connection)
			// eslint-disable-next-line no-useless-catch
		} catch (e) {
			throw e
		} finally {
			await db.quit()
		}
	}

	private async hasRecord(
		con: Connection,
		prpertyAddress: string,
		metricsAddress: string
	): Promise<boolean> {
		const repository = con.getRepository(PropertyAuthentication)
		const record = await repository.findOne({
			property: prpertyAddress,
			metrics: metricsAddress,
		})
		return typeof record !== 'undefined'
	}

	private async createPropertyAuthenticationRecord(
		con: Connection
	): Promise<void> {
		const blockNumber = await getMaxBlockNumber(con, PropertyAuthentication)
		const records = await getEventRecord(
			con,
			MetricsFactoryCreate,
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
				const insertRecord = new PropertyAuthentication()
				insertRecord.block_number = record.block_number
				const propertyAddress = await getPropertyByMetrics(
					con,
					web3,
					record.metrics
				)

				if (await this.hasRecord(con, propertyAddress, record.metrics)) {
					throw new Error(
						`property authentication data is already exists property:${propertyAddress} metrics:${record.metrics}`
					)
				}

				insertRecord.property = propertyAddress
				insertRecord.market = record.from_address
				insertRecord.metrics = record.metrics
				insertRecord.authentication_id = await getAuthenticationIdByMetrics(
					con,
					web3,
					record.from_address,
					record.metrics
				)
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
	const dataCreator = new PropertyAuthenticationCreator(context, myTimer)
	await dataCreator.execute()
}

export default timerTrigger
