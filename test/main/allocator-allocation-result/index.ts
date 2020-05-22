import { EntityManager } from 'typeorm'
import { mocked } from 'ts-jest/utils'
import { getContextMock, getTimerMock } from '../../lib/mock'
import {
	saveContractInfoTestdata,
	clearData,
	getCount,
} from '../../lib/test-data'
import { getDbConnection } from '../../lib/db'

import timerTrigger from '../../../allocator-allocation-result/index'
import { DbConnection } from '../../../common/db/common'
import { getApprovalBlockNumber } from '../../../common/block-chain/utils'
import { Event } from '../../../common/block-chain/event'
import { AllocatorAllocationResult } from '../../../entities/allocator-allocation-result'

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
		await clearData(con.connection, AllocatorAllocationResult)
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
							_metrics: 'dummy-metrics-address1',
							_value: 10,
							_market: 'dummy-market-address1',
							_property: 'dummy-property-address1',
							_lockupValue: 100,
							_result: 1000,
						},
					},
					{
						id: 'dummy-event-id2',
						blockNumber: 12346,
						logIndex: 14,
						transactionIndex: 23,
						returnValues: {
							_metrics: 'dummy-metrics-address2',
							_value: 20,
							_market: 'dummy-market-address2',
							_property: 'dummy-property-address2',
							_lockupValue: 200,
							_result: 2000,
						},
					},
					{
						id: 'dummy-event-id3',
						blockNumber: 12347,
						logIndex: 12,
						transactionIndex: 21,
						returnValues: {
							_metrics: 'dummy-metrics-address3',
							_value: 30,
							_market: 'dummy-market-address3',
							_property: 'dummy-property-address3',
							_lockupValue: 300,
							_result: 3000,
						},
					},
				]),
			}
		})
		await timerTrigger(context, timer)

		const count = await getCount(con.connection, AllocatorAllocationResult)
		expect(count).toBe(3)

		const manager = new EntityManager(con.connection)
		let record = await manager.findOneOrFail(
			AllocatorAllocationResult,
			'dummy-event-id1'
		)

		expect(record.event_id).toBe('dummy-event-id1')
		expect(record.metrics).toBe('dummy-metrics-address1')
		expect(Number(record.arg_value)).toBe(10)
		expect(record.market).toBe('dummy-market-address1')
		expect(record.property).toBe('dummy-property-address1')
		expect(Number(record.lockup_value)).toBe(100)
		expect(Number(record.result)).toBe(1000)
		let rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id1')
		expect(rawData.returnValues._metrics).toBe('dummy-metrics-address1')
		expect(rawData.returnValues._value).toBe(10)
		expect(rawData.returnValues._market).toBe('dummy-market-address1')
		expect(rawData.returnValues._property).toBe('dummy-property-address1')
		expect(rawData.returnValues._lockupValue).toBe(100)
		expect(rawData.returnValues._result).toBe(1000)

		record = await manager.findOneOrFail(
			AllocatorAllocationResult,
			'dummy-event-id2'
		)

		expect(record.event_id).toBe('dummy-event-id2')
		expect(record.metrics).toBe('dummy-metrics-address2')
		expect(Number(record.arg_value)).toBe(20)
		expect(record.market).toBe('dummy-market-address2')
		expect(record.property).toBe('dummy-property-address2')
		expect(Number(record.lockup_value)).toBe(200)
		expect(Number(record.result)).toBe(2000)
		rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id2')
		expect(rawData.returnValues._metrics).toBe('dummy-metrics-address2')
		expect(rawData.returnValues._value).toBe(20)
		expect(rawData.returnValues._market).toBe('dummy-market-address2')
		expect(rawData.returnValues._property).toBe('dummy-property-address2')
		expect(rawData.returnValues._lockupValue).toBe(200)
		expect(rawData.returnValues._result).toBe(2000)

		record = await manager.findOneOrFail(
			AllocatorAllocationResult,
			'dummy-event-id3'
		)

		expect(record.event_id).toBe('dummy-event-id3')
		expect(record.metrics).toBe('dummy-metrics-address3')
		expect(Number(record.arg_value)).toBe(30)
		expect(record.market).toBe('dummy-market-address3')
		expect(record.property).toBe('dummy-property-address3')
		expect(Number(record.lockup_value)).toBe(300)
		expect(Number(record.result)).toBe(3000)
		rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id3')
		expect(rawData.returnValues._metrics).toBe('dummy-metrics-address3')
		expect(rawData.returnValues._value).toBe(30)
		expect(rawData.returnValues._market).toBe('dummy-market-address3')
		expect(rawData.returnValues._property).toBe('dummy-property-address3')
		expect(rawData.returnValues._lockupValue).toBe(300)
		expect(rawData.returnValues._result).toBe(3000)
	})
	afterAll(async () => {
		await con.quit()
	})
})
