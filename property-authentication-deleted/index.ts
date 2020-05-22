import { AzureFunction, Context } from '@azure/functions'
import { Connection } from 'typeorm'
import { TimerBatchBase } from '../common/base'
import { getPropertyByMetrics } from '../common/block-chain/utils'
import { getMaxBlockNumber, getEventRecord } from '../common/db/event'
import { DbConnection, Transaction } from '../common/db/common'
import { PropertyAuthentication } from '../entities/property-authentication'
import { PropertyAuthenticationDeleted } from '../entities/property-authentication-deleted'
import { MetricsFactoryDestroy } from '../entities/metrics-factory-destroy'
/* eslint-disable @typescript-eslint/no-var-requires */
const Web3 = require('web3')

class PropertyAuthenticationDeleter extends TimerBatchBase {
	getBatchName(): string {
		return 'property-authentication-deleted'
	}

	async innerExecute(): Promise<void> {
		const db = new DbConnection(this.getBatchName())
		await db.connect()

		try {
			await this.movePropertyAuthenticationRecord(db.connection)
			// eslint-disable-next-line no-useless-catch
		} catch (e) {
			throw e
		} finally {
			await db.quit()
		}
	}

	private async movePropertyAuthenticationRecord(
		con: Connection
	): Promise<void> {
		const destroyRecords = await this.getEvents(con)
		if (destroyRecords.length === 0) {
			this.logging.infolog('no target record')
			return
		}

		const relationData = await this.getPropertyInfo(con, destroyRecords)
		const transaction = new Transaction(con)
		try {
			await transaction.start()
			this.logging.infolog(`record count：${relationData.length}`)
			for (const data of relationData) {
				// eslint-disable-next-line no-await-in-loop
				const record = await this.getPropertyAuthenticationRecord(
					con,
					data.property,
					data.metrics
				)
				// eslint-disable-next-line no-await-in-loop
				await transaction.remove(record)
				const saveData = this.createPropertyAuthenticationDeletedData(
					data,
					record
				)

				// eslint-disable-next-line no-await-in-loop
				await transaction.save(saveData)
			}

			await transaction.commit()
		} catch (e) {
			await transaction.rollback()
			throw e
		} finally {
			await transaction.finish()
		}
	}

	private async getPropertyAuthenticationRecord(
		con: Connection,
		property_: string,
		metrics_: string
	): Promise<PropertyAuthentication> {
		const repository = con.getRepository(PropertyAuthentication)
		const record = await repository.findOne({
			property: property_,
			metrics: metrics_,
		})
		if (typeof record === 'undefined') {
			throw new Error(
				`property_authintication record is not found.  property:${property_} metrics:${metrics_}.`
			)
		}

		return record
	}

	private createPropertyAuthenticationDeletedData(
		data: any,
		originalRecord: PropertyAuthentication
	): PropertyAuthenticationDeleted {
		const saveData = new PropertyAuthenticationDeleted()
		saveData.property = data.property
		saveData.metrics = data.metrics
		saveData.block_number = originalRecord.block_number
		saveData.market = originalRecord.market
		saveData.authentication_id = originalRecord.authentication_id
		return saveData
	}

	private async getPropertyInfo(
		con: Connection,
		destroyRecords: MetricsFactoryDestroy[]
	): Promise<any[]> {
		const relationData = []
		const web3 = new Web3(
			new Web3.providers.HttpProvider(process.env.WEB3_URL!)
		)
		for (const record of destroyRecords) {
			// eslint-disable-next-line no-await-in-loop
			const propertyAddress = await getPropertyByMetrics(
				con,
				web3,
				record.metrics
			)
			relationData.push({
				property: propertyAddress,
				metrics: record.metrics,
			})
		}

		return relationData
	}

	private async getEvents(con: Connection): Promise<MetricsFactoryDestroy[]> {
		const blockNumber = await getMaxBlockNumber(
			con,
			PropertyAuthenticationDeleted
		)
		this.logging.infolog(`processed block number:${blockNumber}`)
		const records = await getEventRecord(
			con,
			MetricsFactoryDestroy,
			blockNumber + 1
		)
		return records
	}
}

const timerTrigger: AzureFunction = async function (
	context: Context,
	myTimer: any
): Promise<void> {
	const dataCreator = new PropertyAuthenticationDeleter(context, myTimer)
	await dataCreator.execute()
}

export default timerTrigger
