import { EntityManager } from 'typeorm'
import { mocked } from 'ts-jest/utils'
import { getContextMock, getTimerMock } from '../../lib/mock'
import {
	saveContractInfoTestdata,
	clearData,
	getCount,
} from '../../lib/test-data'
import { getDbConnection } from '../../lib/db'

import timerTrigger from '../../../metrics-factory-create/index'
import { DbConnection } from '../../../common/db/common'
import { getApprovalBlockNumber } from '../../../common/block-chain/utils'
import { Event } from '../../../common/block-chain/event'
import { MetricsFactoryCreate } from '../../../entities/metrics-factory-create'

const context = getContextMock()
const undefindMock = jest.fn().mockResolvedValue(undefined)

jest.mock('../../../common/notifications')
jest.mock('../../../common/block-chain/utils')
jest.mock('../../../common/block-chain/event')
mocked(getApprovalBlockNumber).mockImplementation(async () =>
	Promise.resolve(10)
)

const timer = getTimerMock()

describe('timerTrigger', () => {
	let con: DbConnection
	beforeAll(async () => {
		con = await getDbConnection()
		await saveContractInfoTestdata(con.connection)
	})
	beforeEach(async () => {
		await clearData(con.connection, MetricsFactoryCreate)
	})
	it('Register data as many events as there are.', async () => {
		mocked(Event).mockImplementation((): any => {
			return {
				generateContract: undefindMock,
				getEvent: jest.fn().mockResolvedValue([
					{
						id: 'dummy-event-id1',
						blockNumber: 12345,
						logIndex: 15,
						transactionIndex: 26,
						returnValues: {
							_from: 'dummy-market-address1',
							_metrics: 'dummy-metrics-address1',
						},
					},
					{
						id: 'dummy-event-id2',
						blockNumber: 12346,
						logIndex: 14,
						transactionIndex: 23,
						returnValues: {
							_from: 'dummy-market-address2',
							_metrics: 'dummy-metrics-address2',
						},
					},
					{
						id: 'dummy-event-id3',
						blockNumber: 12347,
						logIndex: 12,
						transactionIndex: 21,
						returnValues: {
							_from: 'dummy-market-address3',
							_metrics: 'dummy-metrics-address3',
						},
					},
				]),
			}
		})
		await timerTrigger(context, timer)

		const count = await getCount(con.connection, MetricsFactoryCreate)
		expect(count).toBe(3)

		const manager = new EntityManager(con.connection)
		let record = await manager.findOneOrFail(
			MetricsFactoryCreate,
			'dummy-event-id1'
		)

		expect(record.event_id).toBe('dummy-event-id1')
		expect(record.from_address).toBe('dummy-market-address1')
		expect(record.metrics).toBe('dummy-metrics-address1')
		let rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id1')
		expect(rawData.returnValues._from).toBe('dummy-market-address1')
		expect(rawData.returnValues._metrics).toBe('dummy-metrics-address1')

		record = await manager.findOneOrFail(
			MetricsFactoryCreate,
			'dummy-event-id2'
		)

		expect(record.event_id).toBe('dummy-event-id2')
		expect(record.from_address).toBe('dummy-market-address2')
		expect(record.metrics).toBe('dummy-metrics-address2')
		rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id2')
		expect(rawData.returnValues._from).toBe('dummy-market-address2')
		expect(rawData.returnValues._metrics).toBe('dummy-metrics-address2')

		record = await manager.findOneOrFail(
			MetricsFactoryCreate,
			'dummy-event-id3'
		)

		expect(record.event_id).toBe('dummy-event-id3')
		expect(record.from_address).toBe('dummy-market-address3')
		expect(record.metrics).toBe('dummy-metrics-address3')
		rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id3')
		expect(rawData.returnValues._from).toBe('dummy-market-address3')
		expect(rawData.returnValues._metrics).toBe('dummy-metrics-address3')
	})
	afterAll(async () => {
		await con.quit()
	})
})
