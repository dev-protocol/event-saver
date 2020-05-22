import { Connection } from 'typeorm'
import { mocked } from 'ts-jest/utils'
import { getContextMock, getTimerMock } from '../../lib/mock'
import {
	saveContractInfoTestdata,
	clearData,
	getCount,
} from '../../lib/test-data'
import { getDbConnection } from '../../lib/db'

import timerTrigger from '../../../property-meta/index'
import { DbConnection } from '../../../common/db/common'
import { getPropertyInstance } from '../../../common/block-chain/utils'
import { PropertyMeta } from '../../../entities/property-meta'
import { PropertyFactoryCreate } from '../../../entities/property-factory-create'
import { Transaction } from '../../../common/db/common'

const context = getContextMock()

jest.mock('../../../common/notifications')
jest.mock('../../../common/block-chain/utils')

const author = function () {
	return {
		call: async function (): Promise<any> {
			return 'dummy-auther-address1'
		},
	}
}

const name = function () {
	return {
		call: async function (): Promise<any> {
			return 'hoge-property'
		},
	}
}

const symbol = function () {
	return {
		call: async function (): Promise<any> {
			return 'DPT'
		},
	}
}

const mockResult = {
	methods: {
		author: author,
		name: name,
		symbol: symbol,
	},
}

mocked(getPropertyInstance).mockImplementation(async () =>
	Promise.resolve(mockResult)
)

const timer = getTimerMock()

describe('timerTrigger', () => {
	let con: DbConnection
	beforeAll(async () => {
		con = await getDbConnection()
		await saveContractInfoTestdata(con.connection)
	})
	beforeEach(async () => {
		await clearData(con.connection, PropertyMeta)
		await clearData(con.connection, PropertyFactoryCreate)
	})
	it('If the target record does not exist, nothing is processed.', async () => {
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyMeta)
		expect(count).toBe(0)
		count = await getCount(con.connection, PropertyFactoryCreate)
		expect(count).toBe(0)
	})
	it('Save the result of the calculation if the target record exists.', async () => {
		await savePropertyFactoryCreateTestData(con.connection)
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyMeta)
		expect(count).toBe(1)
		count = await getCount(con.connection, PropertyFactoryCreate)
		expect(count).toBe(1)
		const repository = con.connection.getRepository(PropertyMeta)
		const record = await repository.findOne({
			author: 'dummy-auther-address1',
			property: 'dummy-property-address1',
		})

		expect(record.author).toBe('dummy-auther-address1')
		expect(record.property).toBe('dummy-property-address1')
		expect(record.sender).toBe('dummy-user-address1')
		expect(record.block_number).toBe(30000)
		expect(record.name).toBe('hoge-property')
		expect(record.symbol).toBe('DPT')
	})
	it('Up to 100 records can be processed at a time.', async () => {
		await saveManyPropertyFactoryCreateTestData(con.connection)
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyFactoryCreate)
		expect(count).toBe(120)
		count = await getCount(con.connection, PropertyMeta)
		expect(count).toBe(100)
	})
	afterAll(async () => {
		await con.quit()
	})
})

async function savePropertyFactoryCreateTestData(con: Connection) {
	const transaction = new Transaction(con)
	await transaction.start()
	const record = new PropertyFactoryCreate()
	record.event_id = 'dummy-event-id1'
	record.block_number = 30000
	record.log_index = 2
	record.transaction_index = 3
	record.from_address = 'dummy-user-address1'
	record.property = 'dummy-property-address1'
	record.raw_data = '{}'

	await transaction.save(record)
	await transaction.commit()
	await transaction.finish()
}

async function saveManyPropertyFactoryCreateTestData(con: Connection) {
	const transaction = new Transaction(con)
	await transaction.start()
	const record = new PropertyFactoryCreate()
	for (let i = 0; i < 120; i++) {
		record.event_id = `dummy-event-id${i}`
		record.block_number = 30000 + i
		record.log_index = 2
		record.transaction_index = 3
		record.from_address = 'dummy-user-address1'
		record.property = `dummy-property-address${i}`
		record.raw_data = '{}'

		// eslint-disable-next-line no-await-in-loop
		await transaction.save(record)
	}

	await transaction.commit()
	await transaction.finish()
}
