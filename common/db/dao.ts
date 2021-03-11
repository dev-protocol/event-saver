import { ObjectType, Connection, EntityManager } from 'typeorm'
import { ProcessedBlockNumber } from '../../entities/processed-block-number'
import { DevPropertyTransfer } from '../../entities/dev-property-transfer'
import { IgnoreDevPropertyTransfer } from '../../entities/ignore-dev-property-transfer'
import { LockupLockedup } from '../../entities/lockup-lockedup'
import { Transaction } from './common'
import { getWalletAddressAndPropertyAddress } from './../utils'

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

export async function insertIgnoreDevPropertyTransfer(
	transaction: Transaction,
	targetRecord: DevPropertyTransfer
): Promise<void> {
	const ignore = new IgnoreDevPropertyTransfer()
	ignore.event_id = targetRecord.event_id
	ignore.block_number = targetRecord.block_number
	ignore.log_index = targetRecord.log_index
	ignore.transaction_index = targetRecord.transaction_index
	ignore.from_address = targetRecord.from_address
	ignore.to_address = targetRecord.to_address
	ignore.value = targetRecord.value
	ignore.is_lockup = targetRecord.is_lockup
	ignore.raw_data = targetRecord.raw_data
	await transaction.save(ignore)
}

export class LockedupEventId {
	private readonly _con: Connection
	private _lockupMinBlockNumber: number

	constructor(con: Connection) {
		this._con = con
	}

	public async prepare(): Promise<void> {
		this._lockupMinBlockNumber = await getMinBlockNumber(
			this._con,
			LockupLockedup
		)
	}

	public async getLockedupEventId(
		record: DevPropertyTransfer
	): Promise<[boolean, string]> {
		if (record.block_number < this._lockupMinBlockNumber) {
			return [false, 'dummy-lockup-id']
		}

		const repository = this._con.getRepository(LockupLockedup)
		const [walletAddress, propertyAddress] = getWalletAddressAndPropertyAddress(
			record
		)

		const findRecords = await repository.find({
			block_number: record.block_number,
			transaction_index: record.transaction_index,
			from_address: walletAddress,
			property: propertyAddress,
			token_value: record.value,
		})
		if (findRecords.length === 1) {
			return [false, findRecords[0].event_id]
		}

		if (findRecords.length === 0) {
			return [true, '']
		}

		throw new Error('lockuped_lock has many record.')
	}
}
