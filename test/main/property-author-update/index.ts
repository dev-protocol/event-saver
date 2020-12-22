import { Connection } from 'typeorm'
import { mocked } from 'ts-jest/utils'
import { getContextMock, getTimerMock } from '../../lib/mock'
import {
	saveContractInfoTestdata,
	clearData,
	getCount,
} from '../../lib/test-data'
import { getDbConnection } from '../../lib/db'
import { PropertyData } from '../../../common/property'
import timerTrigger from '../../../property-author-update/index'
import { Transaction, DbConnection } from '../../../common/db/common'
import { PropertyMeta } from '../../../entities/property-meta'
import { PropertyBalance } from '../../../entities/property-balance'
import { PropertyFactoryChangeAuthor } from '../../../entities/property-factory-change-author'
import { ProcessedBlockNumber } from '../../../entities/processed-block-number'

const context = getContextMock()

jest.mock('../../../common/notifications')
jest.mock('./../../../common/property')
const undefindMock = jest.fn().mockResolvedValue(undefined)

const timer = getTimerMock()

describe('timerTrigger', () => {
	let con: DbConnection
	beforeAll(async () => {
		con = await getDbConnection()
		await saveContractInfoTestdata(con.connection)
	})
	beforeEach(async () => {
		await clearData(con.connection, PropertyFactoryChangeAuthor)
		await clearData(con.connection, PropertyBalance)
		await clearData(con.connection, PropertyMeta)
		await clearData(con.connection, ProcessedBlockNumber)
	})
	it('If the target record does not exist, nothing is processed.', async () => {
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyFactoryChangeAuthor)
		expect(count).toBe(0)
		count = await getCount(con.connection, PropertyBalance)
		expect(count).toBe(0)
		count = await getCount(con.connection, PropertyMeta)
		expect(count).toBe(0)
	})
	it('Save the relation data if the target record exists.', async () => {
		await savePropertyFactoryChangeAuthorTestData(con.connection)
		await savePropertyMetaTestData(con.connection)
		await savePropertyBalanceTestData(con.connection)
		mocked(PropertyData).mockImplementation((): any => {
			return {
				load: undefindMock,
				getAuthor: jest.fn().mockResolvedValue('dummy-author-address1'),
				hasAllTokenByAuthor: jest.fn().mockResolvedValue(true),
				getTransferEvent: jest.fn().mockResolvedValue([]),
			}
		})
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyFactoryChangeAuthor)
		expect(count).toBe(1)
		count = await getCount(con.connection, PropertyMeta)
		expect(count).toBe(1)
		const repository2 = con.connection.getRepository(PropertyMeta)
		const record2 = await repository2.findOne({
			property: 'dummy-property-address1',
		})
		expect(record2.property).toBe('dummy-property-address1')
		expect(record2.author).toBe('dummy-after-author-address1')
		expect(record2.block_number).toBe(30000)
		expect(record2.sender).toBe('dummy-sender-address1')
		expect(record2.name).toBe('name')
		expect(record2.symbol).toBe('symbol')
		expect(record2.total_supply).toBe('1000000000000000')
		count = await getCount(con.connection, PropertyBalance)
		expect(count).toBe(0)
	})
	afterAll(async () => {
		await con.quit()
	})
})

async function savePropertyFactoryChangeAuthorTestData(con: Connection) {
	const transaction = new Transaction(con)
	await transaction.start()
	const record = new PropertyFactoryChangeAuthor()
	record.event_id = 'dummy-event-id1'
	record.block_number = 30010
	record.log_index = 2
	record.transaction_index = 3
	record.property = 'dummy-property-address1'
	record.before_author = 'dummy-before-author-address1'
	record.after_author = 'dummy-after-author-address1'
	record.raw_data = '{}'

	await transaction.save(record)
	await transaction.commit()
	await transaction.finish()
}

async function savePropertyMetaTestData(con: Connection) {
	const transaction = new Transaction(con)
	await transaction.start()
	const record = new PropertyMeta()
	record.author = 'dummy-before-author-address1'
	record.block_number = 30000
	record.sender = 'dummy-sender-address1'
	record.name = 'name'
	record.property = 'dummy-property-address1'
	record.symbol = 'symbol'
	record.total_supply = 1000000000000000

	await transaction.save(record)
	await transaction.commit()
	await transaction.finish()
}

async function savePropertyBalanceTestData(con: Connection) {
	const transaction = new Transaction(con)
	await transaction.start()
	const record = new PropertyBalance()
	record.property_address = 'dummy-property-address1'
	record.block_number = 30000
	record.account_address = 'dummy-before-author-address1'
	record.is_author = true
	record.balance = '1000000000000000'

	await transaction.save(record)
	await transaction.commit()
	await transaction.finish()
}

async function saveManyMetricsFactoryCreateTestData(con: Connection) {
	const transaction = new Transaction(con)
	await transaction.start()
	const record = new MetricsFactoryCreate()
	for (let i = 0; i < 120; i++) {
		record.event_id = `dummy-event-id${i}`
		record.block_number = 30000 + i
		record.log_index = 2
		record.transaction_index = 3
		record.from_address = 'dummy-market-address1'
		record.metrics = `dummy-metrics-address${i}`
		record.raw_data = '{}'

		// eslint-disable-next-line no-await-in-loop
		await transaction.save(record)
	}

	await transaction.commit()
	await transaction.finish()
}
