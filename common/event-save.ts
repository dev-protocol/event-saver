import { Context } from '@azure/functions'
import { ObjectType } from 'typeorm'
import { TimerBatchBase } from './base'
import { DbConnection, Transaction } from './db/common'
import { EventTableAccessor } from './db/event'
import { getContractInfo } from './db/contract-info'
import { Event } from './block-chain/event'
import { getApprovalBlockNumber } from './block-chain/utils'
import { ContractInfo } from '../entities/contract-info'

/* eslint-disable @typescript-eslint/no-var-requires */
const Web3 = require('web3')

export abstract class EventSaver extends TimerBatchBase {
	private readonly _db: DbConnection

	constructor(context: Context, myTimer: any) {
		super(context, myTimer)
		this._db = new DbConnection(this.getBatchName())
	}

	async innerExecute(): Promise<void> {
		try {
			await this._db.connect()
			const events = await this._getEvents()
			if (events.length !== 0) {
				await this._saveEvents(events)
				this.logging.infolog('save ' + String(events.length) + ' data')
			}
			// eslint-disable-next-line no-useless-catch
		} catch (err) {
			throw err
		} finally {
			await this._db.quit()
		}
	}

	private async _saveEvents(events: Array<Map<string, any>>): Promise<void> {
		const eventTable = new EventTableAccessor(
			this._db.connection,
			this.getModelObject()
		)
		const transaction = new Transaction(this._db.connection)
		try {
			await transaction.start()
			for (let event of events) {
				const eventMap = new Map(Object.entries(event))
				// eslint-disable-next-line no-await-in-loop
				const hasData = await eventTable.hasData(eventMap.get('id'))
				if (hasData) {
					throw new Error('Data already exists.')
				}

				const saveData = this.getSaveData(eventMap)
				saveData.event_id = eventMap.get('id')
				saveData.block_number = eventMap.get('blockNumber')
				saveData.log_index = eventMap.get('logIndex')
				saveData.transaction_index = eventMap.get('transactionIndex')
				saveData.raw_data = JSON.stringify(event)

				// eslint-disable-next-line no-await-in-loop
				await transaction.save(saveData)
			}

			await transaction.commit()
		} catch (err) {
			await transaction.rollback()
			throw err
		} finally {
			await transaction.finish()
		}
	}

	private async _getEvents(): Promise<Array<Map<string, any>>> {
		const eventTable = new EventTableAccessor(
			this._db.connection,
			this.getModelObject()
		)
		const maxBlockNumber = await eventTable.getMaxBlockNumber()
		const contractInfo = await this._getContractInfo()
		const web3 = new Web3(
			new Web3.providers.HttpProvider(process.env.WEB3_URL!)
		)
		const approvalBlockNumber = await getApprovalBlockNumber(web3)
		const event = new Event(web3)
		this.logging.infolog(`target contract address:${contractInfo.address}`)
		await event.generateContract(
			JSON.parse(contractInfo.abi),
			contractInfo.address
		)
		const events = await event.getEvent(
			this.getEventName(),
			Number(maxBlockNumber) + 1,
			approvalBlockNumber
		)
		return events
	}

	private async _getContractInfo(): Promise<ContractInfo> {
		const info = await getContractInfo(
			this._db.connection,
			this.getContractName()
		)
		return info
	}

	abstract getModelObject<Entity>(): ObjectType<Entity>
	abstract getContractName(): string
	abstract getSaveData(event: Map<string, any>): any
	abstract getEventName(): string
}
