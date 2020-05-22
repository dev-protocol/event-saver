import { EntityManager, ObjectType } from 'typeorm'
import { mocked } from 'ts-jest/utils'
import { getContextMock, getTimerMock } from '../../lib/mock'
import {
	saveContractInfoTestdata,
	getCount,
	saveLockupLockupedTestdata,
	clearData,
} from '../../lib/test-data'
import { getDbConnection } from '../../lib/db'

import { EventSaver } from '../../../common/event-save'
import { DbConnection } from '../../../common/db/common'
import { getApprovalBlockNumber } from '../../../common/block-chain/utils'
import { Event } from '../../../common/block-chain/event'
import { LockupLockedup } from '../../../entities/lockup-lockedup'

const context = getContextMock()
const undefindMock = jest.fn().mockResolvedValue(undefined)
const noEventListMock = jest.fn().mockResolvedValue([])

jest.mock('../../../common/notifications')
jest.mock('../../../common/block-chain/utils')
jest.mock('../../../common/block-chain/event')
mocked(getApprovalBlockNumber).mockImplementation(async () =>
	Promise.resolve(10)
)

const TEST_FUNC_NAME = 'test-func-name'
const timer = getTimerMock()
class TestEventSaver extends EventSaver {
	getBatchName(): string {
		return TEST_FUNC_NAME
	}

	getModelObject<Entity>(): ObjectType<Entity> {
		return LockupLockedup
	}

	getContractName(): string {
		return 'Lockup'
	}

	getSaveData(event: Map<string, any>): any {
		const lockupLockedup = new LockupLockedup()
		const values = event.get('returnValues')
		lockupLockedup.from_address = values._from
		lockupLockedup.property = values._property
		lockupLockedup.token_value = values._value
		return lockupLockedup
	}

	getEventName(): string {
		return 'TestEvent'
	}
}

describe('EventSaver', () => {
	let con: DbConnection
	beforeAll(async () => {
		con = await getDbConnection()
		await saveContractInfoTestdata(con.connection)
	})
	beforeEach(async () => {
		await clearData(con.connection, LockupLockedup)
	})
	it('If the number of events retrieved is 0, no data is recorded.', async () => {
		mocked(Event).mockImplementation((): any => {
			return {
				generateContract: undefindMock,
				getEvent: noEventListMock,
			}
		})
		const timerBatch = new TestEventSaver(context, timer)
		await timerBatch.execute()
		const result = await getCount(con.connection, LockupLockedup)
		expect(result).toBe(0)
	})
	it('An error occurs if there is a duplicate ID.', async () => {
		await saveLockupLockupedTestdata(con.connection)
		mocked(Event).mockImplementation((): any => {
			return {
				generateContract: undefindMock,
				getEvent: jest.fn().mockResolvedValue([
					{
						id: 'dummy-event-id1',
						blockNumber: 12345,
						logIndex: 1,
						transactionIndex: 2,
						returnValues: {
							_from: '0xabcd4231',
							_property: '0xabcd1234',
							_value: 10,
						},
					},
				]),
			}
		})
		const timerBatch = new TestEventSaver(context, timer)
		const promise = timerBatch.execute()
		await expect(promise).rejects.toThrowError(
			new Error('Data already exists.')
		)
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
							_from: '0xabcd4231',
							_property: '0xabcd1234',
							_value: 10,
						},
					},
					{
						id: 'dummy-event-id2',
						blockNumber: 12346,
						logIndex: 14,
						transactionIndex: 23,
						returnValues: {
							_from: '0xdbca4231',
							_property: '0xabcd4231',
							_value: 10,
						},
					},
					{
						id: 'dummy-event-id3',
						blockNumber: 12347,
						logIndex: 12,
						transactionIndex: 21,
						returnValues: {
							_from: '0xabab4231',
							_property: '0xdbca4231',
							_value: 10,
						},
					},
				]),
			}
		})
		const timerBatch = new TestEventSaver(context, timer)
		await timerBatch.execute()
		const result = await getCount(con.connection, LockupLockedup)
		expect(result).toBe(3)
		const manager = new EntityManager(con.connection)
		let record = await manager.findOneOrFail(LockupLockedup, 'dummy-event-id1')
		expect(record.event_id).toBe('dummy-event-id1')
		expect(record.block_number).toBe(12345)
		expect(record.log_index).toBe(15)
		expect(record.transaction_index).toBe(26)
		let rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id1')
		expect(rawData.blockNumber).toBe(12345)
		expect(rawData.logIndex).toBe(15)
		expect(rawData.transactionIndex).toBe(26)

		record = await manager.findOneOrFail(LockupLockedup, 'dummy-event-id2')
		expect(record.event_id).toBe('dummy-event-id2')
		expect(record.block_number).toBe(12346)
		expect(record.log_index).toBe(14)
		expect(record.transaction_index).toBe(23)
		rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id2')
		expect(rawData.blockNumber).toBe(12346)
		expect(rawData.logIndex).toBe(14)
		expect(rawData.transactionIndex).toBe(23)

		record = await manager.findOneOrFail(LockupLockedup, 'dummy-event-id3')
		expect(record.event_id).toBe('dummy-event-id3')
		expect(record.block_number).toBe(12347)
		expect(record.log_index).toBe(12)
		expect(record.transaction_index).toBe(21)
		rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id3')
		expect(rawData.blockNumber).toBe(12347)
		expect(rawData.logIndex).toBe(12)
		expect(rawData.transactionIndex).toBe(21)
	})
	afterAll(async () => {
		await con.quit()
	})
})
