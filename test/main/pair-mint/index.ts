import { EntityManager } from 'typeorm'
import { mocked } from 'ts-jest/utils'
import { getContextMock, getTimerMock } from '../../lib/mock'
import {
	saveContractInfoTestdata,
	clearData,
	getCount,
} from '../../lib/test-data'
import { getDbConnection } from '../../lib/db'

import timerTrigger from '../../../pair-mint/index'
import { DbConnection } from '../../../common/db/common'
import { getApprovalBlockNumber } from '../../../common/block-chain/utils'
import { Event } from '../../../common/block-chain/event'
import { PairMint } from '../../../entities/pair-mint'

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
		await clearData(con.connection, PairMint)
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
							sender: 'dummy-router-address1',
							amount0: 1234500000000000000000,
							amount1: 2000000000000000000,
						},
					},
					{
						id: 'dummy-event-id2',
						blockNumber: 12346,
						logIndex: 14,
						transactionIndex: 23,
						returnValues: {
							sender: 'dummy-router-address2',
							amount0: 5432100000000000000000,
							amount1: 7000000000000000000,
						},
					},
					{
						id: 'dummy-event-id3',
						blockNumber: 12347,
						logIndex: 12,
						transactionIndex: 21,
						returnValues: {
							sender: 'dummy-router-address2',
							amount0: 6700000000000000000,
							amount1: 1000000000000000000,
						},
					},
				]),
			}
		})
		await timerTrigger(context, timer)

		const count = await getCount(con.connection, PairMint)
		expect(count).toBe(3)

		const manager = new EntityManager(con.connection)
		let record = await manager.findOneOrFail(PairMint, 'dummy-event-id1')

		expect(record.event_id).toBe('dummy-event-id1')
		expect(record.sender).toBe('dummy-router-address1')
		expect(Number(record.amount0)).toBe(1234500000000000000000)
		expect(Number(record.amount1)).toBe(2000000000000000000)
		let rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id1')
		expect(rawData.returnValues.sender).toBe('dummy-router-address1')
		expect(rawData.returnValues.amount0).toBe(1234500000000000000000)
		expect(rawData.returnValues.amount1).toBe(2000000000000000000)

		record = await manager.findOneOrFail(PairMint, 'dummy-event-id2')

		expect(record.event_id).toBe('dummy-event-id2')
		expect(record.sender).toBe('dummy-router-address2')
		expect(Number(record.amount0)).toBe(5432100000000000000000)
		expect(Number(record.amount1)).toBe(7000000000000000000)
		rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id2')
		expect(rawData.returnValues.sender).toBe('dummy-router-address2')
		expect(rawData.returnValues.amount0).toBe(5432100000000000000000)
		expect(rawData.returnValues.amount1).toBe(7000000000000000000)

		record = await manager.findOneOrFail(PairMint, 'dummy-event-id3')

		expect(record.event_id).toBe('dummy-event-id3')
		expect(record.sender).toBe('dummy-router-address2')
		expect(Number(record.amount0)).toBe(6700000000000000000)
		expect(Number(record.amount1)).toBe(1000000000000000000)
		rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id3')
		expect(rawData.returnValues.sender).toBe('dummy-router-address2')
		expect(rawData.returnValues.amount0).toBe(6700000000000000000)
		expect(rawData.returnValues.amount1).toBe(1000000000000000000)
	})
	afterAll(async () => {
		await con.quit()
	})
})
