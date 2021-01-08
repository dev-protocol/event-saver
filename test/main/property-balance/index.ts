import { Connection } from 'typeorm'
import { mocked } from 'ts-jest/utils'
import { getContextMock, getTimerMock } from '../../lib/mock'
import {
	saveContractInfoTestdata,
	clearData,
	getCount,
	EventDataGenerator,
} from '../../lib/test-data'
import { getDbConnection } from '../../lib/db'

import timerTrigger from '../../../property-balance/index'
import { DbConnection, Transaction } from '../../../common/db/common'
import { PropertyData } from '../../../common/property'
import { PropertyBalance } from '../../../entities/property-balance'
import { WithdrawPropertyTransfer } from '../../../entities/withdraw-property-transfer'
import { PropertyMeta } from '../../../entities/property-meta'
import { ProcessedBlockNumber } from '../../../entities/processed-block-number'
import { getProcessedBlockNumber } from '../../../common/db/dao'

const context = getContextMock()

jest.mock('../../../common/notifications')
jest.mock('../../../common/property')
const undefindMock = jest.fn().mockResolvedValue(undefined)

const timer = getTimerMock()

describe('timerTrigger', () => {
	let con: DbConnection
	beforeAll(async () => {
		con = await getDbConnection()
		await saveContractInfoTestdata(con.connection)
	})
	beforeEach(async () => {
		await clearData(con.connection, PropertyBalance)
		await clearData(con.connection, PropertyMeta)
		await clearData(con.connection, ProcessedBlockNumber)
		await clearData(con.connection, WithdrawPropertyTransfer)
	})
	it('If the target record does not exist, nothing is processed.', async () => {
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyBalance)
		expect(count).toBe(0)
		count = await getCount(con.connection, WithdrawPropertyTransfer)
		expect(count).toBe(0)
		count = await getCount(con.connection, ProcessedBlockNumber)
		expect(count).toBe(0)
		count = await getCount(con.connection, PropertyMeta)
		expect(count).toBe(0)
	})
	it('If the auther has all tokens, the record is not created.', async () => {
		await saveTestData1(con.connection)
		mocked(PropertyData).mockImplementation((): any => {
			return {
				load: undefindMock,
				getEvent: jest.fn().mockResolvedValue('dummy-author'),
				hasAllTokenByAuthor: jest.fn().mockResolvedValue(true),
				getTransferEvent: jest.fn().mockResolvedValue([]),
			}
		})
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyBalance)
		expect(count).toBe(0)
		count = await getCount(con.connection, WithdrawPropertyTransfer)
		expect(count).toBe(1)

		let blockNumber = await getProcessedBlockNumber(
			con.connection,
			'property-balance'
		)
		expect(blockNumber).toBe(3000000)
		blockNumber = await getProcessedBlockNumber(
			con.connection,
			'property-balance-by-transfer'
		)
		expect(blockNumber).toBe(290000)
	})
	it('If the balance of the property has been moved, a record is created.', async () => {
		await saveTestData1(con.connection)
		const gen = new EventDataGenerator()
		gen.addMintTransfer('dummy-author-address1', 10000000000, 290000)
		gen.addTransfer(
			'dummy-author-address1',
			'dummy-to-address1',
			4000000000,
			3000000
		)
		mocked(PropertyData).mockImplementation((): any => {
			return {
				load: undefindMock,
				getAuthor: jest.fn().mockResolvedValue('dummy-author-address1'),
				hasAllTokenByAuthor: jest.fn().mockResolvedValue(false),
				getTransferEvent: jest.fn().mockResolvedValue(gen.data),
			}
		})
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyBalance)
		expect(count).toBe(2)
		count = await getCount(con.connection, WithdrawPropertyTransfer)
		expect(count).toBe(1)
		const repository = con.connection.getRepository(PropertyBalance)

		let record = await repository.findOne({
			property_address: 'dummy-property-address1',
			account_address: 'dummy-author-address1',
		})
		expect(record.balance.toString()).toBe('6000000000')
		expect(record.is_author).toBe(true)
		expect(record.block_number).toBe(3000000)

		record = await repository.findOne({
			property_address: 'dummy-property-address1',
			account_address: 'dummy-to-address1',
		})

		expect(record.balance.toString()).toBe('4000000000')
		expect(record.is_author).toBe(false)
		expect(record.block_number).toBe(3000000)
		let blockNumber = await getProcessedBlockNumber(
			con.connection,
			'property-balance'
		)
		expect(blockNumber).toBe(3000000)
		blockNumber = await getProcessedBlockNumber(
			con.connection,
			'property-balance-by-transfer'
		)
		expect(blockNumber).toBe(290000)
	})
	it('If the auther has all tokens, the record is not created(property meta).', async () => {
		await saveTestData3(con.connection)
		mocked(PropertyData).mockImplementation((): any => {
			return {
				load: undefindMock,
				getEvent: jest.fn().mockResolvedValue('dummy-author-address1'),
				hasAllTokenByAuthor: jest.fn().mockResolvedValue(true),
				getTransferEvent: jest.fn().mockResolvedValue([]),
			}
		})
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyBalance)
		expect(count).toBe(0)
		count = await getCount(con.connection, PropertyMeta)
		expect(count).toBe(1)
		let blockNumber = await getProcessedBlockNumber(
			con.connection,
			'property-balance'
		)
		expect(blockNumber).toBe(0)
		blockNumber = await getProcessedBlockNumber(
			con.connection,
			'property-balance-by-transfer'
		)
		expect(blockNumber).toBe(100000)
	})
	it('If the balance of the property has been moved, a record is created(property meta).', async () => {
		await saveTestData3(con.connection)
		const gen = new EventDataGenerator()
		gen.addMintTransfer('dummy-author-address1', 100000000000, 100000)
		mocked(PropertyData).mockImplementation((): any => {
			return {
				load: undefindMock,
				getAuthor: jest.fn().mockResolvedValue('dummy-author-address1'),
				hasAllTokenByAuthor: jest.fn().mockResolvedValue(false),
				getTransferEvent: jest.fn().mockResolvedValue(gen.data),
			}
		})
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyBalance)
		expect(count).toBe(1)
		count = await getCount(con.connection, PropertyMeta)
		expect(count).toBe(1)
		const repository = con.connection.getRepository(PropertyBalance)

		let record = await repository.findOne({
			property_address: 'dummy-property-address1',
			account_address: 'dummy-author-address1',
		})
		expect(record.balance.toString()).toBe('100000000000')
		expect(record.is_author).toBe(true)
		expect(record.block_number).toBe(100000)
		let blockNumber = await getProcessedBlockNumber(
			con.connection,
			'property-balance'
		)
		expect(blockNumber).toBe(0)
		blockNumber = await getProcessedBlockNumber(
			con.connection,
			'property-balance-by-transfer'
		)
		expect(blockNumber).toBe(100000)
	})
	afterAll(async () => {
		await con.quit()
	})
})

async function saveTestData1(con: Connection) {
	const transaction = new Transaction(con)
	await transaction.start()
	const record = new WithdrawPropertyTransfer()
	record.event_id = 'dummy-event-id1'
	record.block_number = 3000000
	record.log_index = 20
	record.transaction_index = 31
	record.property_address = 'dummy-property-address1'
	record.from_address = 'dummy-author-address1'
	record.to_address = 'dummy-to-address1'
	record.raw_data = '{}'
	await transaction.save(record)

	const record2 = new PropertyMeta()
	record2.author = 'dummy-author-address1'
	record2.property = 'dummy-property-address1'
	record2.sender = '0xsender'
	record2.block_number = 290000
	record2.name = 'name'
	record2.symbol = 'symbol'
	record2.total_supply = 10000000000
	await transaction.save(record2)

	await transaction.commit()
	await transaction.finish()
}

async function saveTestData3(con: Connection) {
	const transaction = new Transaction(con)
	await transaction.start()
	let record = new PropertyMeta()
	record.author = 'dummy-author-address1'
	record.block_number = 100000
	record.property = 'dummy-property-address1'
	record.sender = 'dummy-sender'
	record.name = 'property-name'
	record.symbol = 'property-symbol'
	record.total_supply = 100000000000
	await transaction.save(record)
	await transaction.commit()
	await transaction.finish()
}
