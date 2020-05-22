import { Connection } from 'typeorm'
import { mocked } from 'ts-jest/utils'
import { getContextMock, getTimerMock } from '../../lib/mock'
import {
	saveContractInfoTestdata,
	clearData,
	getCount,
} from '../../lib/test-data'
import { getDbConnection } from '../../lib/db'

import timerTrigger from '../../../property-authentication/index'
import { DbConnection } from '../../../common/db/common'
import {
	getPropertyByMetrics,
	getAuthenticationIdByMetrics,
} from '../../../common/block-chain/utils'
import { MetricsFactoryCreate } from '../../../entities/metrics-factory-create'
import { PropertyAuthentication } from '../../../entities/property-authentication'
import { Transaction } from '../../../common/db/common'

const context = getContextMock()

jest.mock('../../../common/notifications')
jest.mock('../../../common/block-chain/utils')

mocked(getPropertyByMetrics).mockImplementation(async () =>
	Promise.resolve('dummy-property-address1')
)
mocked(getAuthenticationIdByMetrics).mockImplementation(async () =>
	Promise.resolve('dummy-authentication-id1')
)

const timer = getTimerMock()

describe('timerTrigger', () => {
	let con: DbConnection
	beforeAll(async () => {
		con = await getDbConnection()
		await saveContractInfoTestdata(con.connection)
	})
	beforeEach(async () => {
		await clearData(con.connection, PropertyAuthentication)
		await clearData(con.connection, MetricsFactoryCreate)
	})
	it('If the target record does not exist, nothing is processed.', async () => {
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyAuthentication)
		expect(count).toBe(0)
		count = await getCount(con.connection, MetricsFactoryCreate)
		expect(count).toBe(0)
	})
	it('Save the result of the calculation if the target record exists.', async () => {
		await saveMetricsFactoryCreateTestData(con.connection)
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, MetricsFactoryCreate)
		expect(count).toBe(1)
		count = await getCount(con.connection, PropertyAuthentication)
		expect(count).toBe(1)
		const repository = con.connection.getRepository(PropertyAuthentication)
		const record = await repository.findOne({
			property: 'dummy-property-address1',
			metrics: 'dummy-metrics-address1',
		})

		expect(record.property).toBe('dummy-property-address1')
		expect(record.metrics).toBe('dummy-metrics-address1')
		expect(record.block_number).toBe(30000)
		expect(record.market).toBe('dummy-market-address1')
		expect(record.authentication_id).toBe('dummy-authentication-id1')
	})
	it('Up to 100 records can be processed at a time.', async () => {
		await saveManyMetricsFactoryCreateTestData(con.connection)
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, MetricsFactoryCreate)
		expect(count).toBe(120)
		count = await getCount(con.connection, PropertyAuthentication)
		expect(count).toBe(100)
	})
	afterAll(async () => {
		await con.quit()
	})
})

async function saveMetricsFactoryCreateTestData(con: Connection) {
	const transaction = new Transaction(con)
	await transaction.start()
	const record = new MetricsFactoryCreate()
	record.event_id = 'dummy-event-id1'
	record.block_number = 30000
	record.log_index = 2
	record.transaction_index = 3
	record.from_address = 'dummy-market-address1'
	record.metrics = 'dummy-metrics-address1'
	record.raw_data = '{}'

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
