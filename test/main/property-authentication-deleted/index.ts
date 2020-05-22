import { Connection } from 'typeorm'
import { mocked } from 'ts-jest/utils'
import { getContextMock, getTimerMock } from '../../lib/mock'
import {
	saveContractInfoTestdata,
	clearData,
	getCount,
} from '../../lib/test-data'
import { getDbConnection } from '../../lib/db'

import timerTrigger from '../../../property-authentication-deleted/index'
import { DbConnection } from '../../../common/db/common'
import { getPropertyByMetrics } from '../../../common/block-chain/utils'
import { PropertyAuthentication } from '../../../entities/property-authentication'
import { PropertyAuthenticationDeleted } from '../../../entities/property-authentication-deleted'
import { MetricsFactoryDestroy } from '../../../entities/metrics-factory-destroy'
import { Transaction } from '../../../common/db/common'

const context = getContextMock()

jest.mock('../../../common/notifications')
jest.mock('../../../common/block-chain/utils')
mocked(getPropertyByMetrics).mockImplementation(async () =>
	Promise.resolve('dummy-property-address1')
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
		await clearData(con.connection, PropertyAuthenticationDeleted)
		await clearData(con.connection, MetricsFactoryDestroy)
	})
	it('If the record to be processed does not exist, no action is taken.', async () => {
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyAuthentication)
		expect(count).toBe(0)
		count = await getCount(con.connection, PropertyAuthenticationDeleted)
		expect(count).toBe(0)
		count = await getCount(con.connection, MetricsFactoryDestroy)
		expect(count).toBe(0)
	})
	it('Even if the record to be processed exists, an error will occur if it conflicts with the authentication information.', async () => {
		await saveMetricsFactoryDestroyDummyData(con.connection)
		const promise = timerTrigger(context, timer)
		await expect(promise).rejects.toThrowError(
			new Error(
				'property_authintication record is not found.  property:dummy-property-address1 metrics:dummy-metrics-address1.'
			)
		)
		let count = await getCount(con.connection, PropertyAuthentication)
		expect(count).toBe(0)
		count = await getCount(con.connection, PropertyAuthenticationDeleted)
		expect(count).toBe(0)
		count = await getCount(con.connection, MetricsFactoryDestroy)
		expect(count).toBe(1)
	})
	it('If the authentication is deactivated, the authentication information is also deleted.', async () => {
		await saveMetricsFactoryDestroyDummyData(con.connection)
		await savePropertyAuthenticationDummyData(con.connection)
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyAuthentication)
		expect(count).toBe(0)
		count = await getCount(con.connection, PropertyAuthenticationDeleted)
		expect(count).toBe(1)
		count = await getCount(con.connection, MetricsFactoryDestroy)
		expect(count).toBe(1)
		const repository = con.connection.getRepository(
			PropertyAuthenticationDeleted
		)
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
	afterAll(async () => {
		await con.quit()
	})
})

async function saveMetricsFactoryDestroyDummyData(
	con: Connection
): Promise<void> {
	const transaction = new Transaction(con)
	await transaction.start()
	const record = new MetricsFactoryDestroy()

	record.event_id = 'dummy-event-id1'
	record.block_number = 30000
	record.log_index = 21
	record.transaction_index = 36
	record.from_address = 'dummy-user-address1'
	record.metrics = 'dummy-metrics-address1'
	record.raw_data = '{}'
	await transaction.save(record)

	await transaction.commit()
	await transaction.finish()
}

async function savePropertyAuthenticationDummyData(
	con: Connection
): Promise<void> {
	const transaction = new Transaction(con)
	await transaction.start()
	const record = new PropertyAuthentication()
	record.property = 'dummy-property-address1'
	record.metrics = 'dummy-metrics-address1'
	record.block_number = 30000
	record.market = 'dummy-market-address1'
	record.authentication_id = 'dummy-authentication-id1'
	await transaction.save(record)
	await transaction.commit()
	await transaction.finish()
}
