import { ObjectType, Connection, EntityManager } from 'typeorm'
import { ProcessedBlockNumber } from '../../entities/processed-block-number'
import { Transaction } from './common'

export class EventTableAccessor<Entity> {
	private readonly _connection: Connection
	private readonly _entityClass: ObjectType<Entity>

	constructor(connection: Connection, entityClass: ObjectType<Entity>) {
		this._connection = connection
		this._entityClass = entityClass
	}

	public async getMaxBlockNumber(): Promise<number> {
		const number = await getMaxBlockNumber(this._connection, this._entityClass)
		return number
	}

	public async hasData(eventId: string): Promise<boolean> {
		const firstUser = await this._connection
			.getRepository(this._entityClass)
			.createQueryBuilder('tmp')
			.where('tmp.event_id = :id', { id: eventId })
			.getOne()
		return typeof firstUser !== 'undefined'
	}
}

export async function getMaxBlockNumber<Entity>(
	connection: Connection,
	entityClass: ObjectType<Entity>
): Promise<number> {
	let { max } = await connection
		.getRepository(entityClass)
		.createQueryBuilder()
		.select('MAX(block_number)', 'max')
		.getRawOne()
	if (max === null) {
		max = 0
	}

	return Number(max)
}

export async function getMinBlockNumber<Entity>(
	connection: Connection,
	entityClass: ObjectType<Entity>
): Promise<number> {
	let { min } = await connection
		.getRepository(entityClass)
		.createQueryBuilder()
		.select('MIN(block_number)', 'min')
		.getRawOne()
	if (min === null) {
		min = 0
	}

	return Number(min)
}

export async function getProcessedBlockNumber(
	connection: Connection,
	batchName: string
): Promise<number> {
	const manager = new EntityManager(connection)
	const record = await manager.findOne(ProcessedBlockNumber, batchName)
	if (typeof record === 'undefined') {
		return 0
	}

	return record.block_number
}

export async function setProcessedBlockNumber(
	transaction: Transaction,
	batchName: string,
	blockNumber: number
): Promise<void> {
	const saveData = new ProcessedBlockNumber()
	saveData.key_name = batchName
	saveData.block_number = blockNumber
	await transaction.save(saveData)
}

export async function getEventRecordThenGreaterBlockNumber<Entity>(
	connection: Connection,
	entityClass: ObjectType<Entity>,
	blockNumber: number
): Promise<Entity[]> {
	const records = await connection
		.getRepository(entityClass)
		.createQueryBuilder('tmp')
		.where('tmp.block_number >= :_blockNumber', { _blockNumber: blockNumber })
		.orderBy('tmp.block_number')
		.getMany()

	return records
}
