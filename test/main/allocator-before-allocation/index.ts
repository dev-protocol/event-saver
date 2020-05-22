import { EntityManager } from 'typeorm'
import { mocked } from 'ts-jest/utils'
import { getContextMock, getTimerMock } from '../../lib/mock'
import {
	saveContractInfoTestdata,
	clearData,
	getCount,
} from '../../lib/test-data'
import { getDbConnection } from '../../lib/db'

import timerTrigger from '../../../allocator-before-allocation/index'
import { DbConnection } from '../../../common/db/common'
import { getApprovalBlockNumber } from '../../../common/block-chain/utils'
import { Event } from '../../../common/block-chain/event'
import { AllocatorBeforeAllocation } from '../../../entities/allocator-before-allocation'

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
		await clearData(con.connection, AllocatorBeforeAllocation)
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
							_blocks: 10,
							_mint: 20,
							_value: 30,
							_marketValue: 40,
							_assets: 50,
							_totalAssets: 60,
						},
					},
					{
						id: 'dummy-event-id2',
						blockNumber: 12346,
						logIndex: 14,
						transactionIndex: 23,
						returnValues: {
							_blocks: 100,
							_mint: 200,
							_value: 300,
							_marketValue: 400,
							_assets: 500,
							_totalAssets: 600,
						},
					},
					{
						id: 'dummy-event-id3',
						blockNumber: 12347,
						logIndex: 12,
						transactionIndex: 21,
						returnValues: {
							_blocks: 1000,
							_mint: 2000,
							_value: 3000,
							_marketValue: 4000,
							_assets: 5000,
							_totalAssets: 6000,
						},
					},
				]),
			}
		})
		await timerTrigger(context, timer)

		const count = await getCount(con.connection, AllocatorBeforeAllocation)
		expect(count).toBe(3)

		const manager = new EntityManager(con.connection)
		let record = await manager.findOneOrFail(
			AllocatorBeforeAllocation,
			'dummy-event-id1'
		)

		expect(record.event_id).toBe('dummy-event-id1')
		expect(Number(record.blocks)).toBe(10)
		expect(Number(record.mint)).toBe(20)
		expect(Number(record.token_value)).toBe(30)
		expect(Number(record.market_value)).toBe(40)
		expect(Number(record.assets)).toBe(50)
		expect(Number(record.total_assets)).toBe(60)
		let rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id1')
		expect(rawData.returnValues._blocks).toBe(10)
		expect(rawData.returnValues._mint).toBe(20)
		expect(rawData.returnValues._value).toBe(30)
		expect(rawData.returnValues._marketValue).toBe(40)
		expect(rawData.returnValues._assets).toBe(50)
		expect(rawData.returnValues._totalAssets).toBe(60)

		record = await manager.findOneOrFail(
			AllocatorBeforeAllocation,
			'dummy-event-id2'
		)

		expect(record.event_id).toBe('dummy-event-id2')
		expect(Number(record.blocks)).toBe(100)
		expect(Number(record.mint)).toBe(200)
		expect(Number(record.token_value)).toBe(300)
		expect(Number(record.market_value)).toBe(400)
		expect(Number(record.assets)).toBe(500)
		expect(Number(record.total_assets)).toBe(600)
		rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id2')
		expect(rawData.returnValues._blocks).toBe(100)
		expect(rawData.returnValues._mint).toBe(200)
		expect(rawData.returnValues._value).toBe(300)
		expect(rawData.returnValues._marketValue).toBe(400)
		expect(rawData.returnValues._assets).toBe(500)
		expect(rawData.returnValues._totalAssets).toBe(600)

		record = await manager.findOneOrFail(
			AllocatorBeforeAllocation,
			'dummy-event-id3'
		)

		expect(record.event_id).toBe('dummy-event-id3')
		expect(Number(record.blocks)).toBe(1000)
		expect(Number(record.mint)).toBe(2000)
		expect(Number(record.token_value)).toBe(3000)
		expect(Number(record.market_value)).toBe(4000)
		expect(Number(record.assets)).toBe(5000)
		expect(Number(record.total_assets)).toBe(6000)
		rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id3')
		expect(rawData.returnValues._blocks).toBe(1000)
		expect(rawData.returnValues._mint).toBe(2000)
		expect(rawData.returnValues._value).toBe(3000)
		expect(rawData.returnValues._marketValue).toBe(4000)
		expect(rawData.returnValues._assets).toBe(5000)
		expect(rawData.returnValues._totalAssets).toBe(6000)
	})
	afterAll(async () => {
		await con.quit()
	})
})
