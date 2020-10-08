import { EntityManager } from 'typeorm'
import { mocked } from 'ts-jest/utils'
import { getContextMock, getTimerMock } from '../../lib/mock'
import {
	saveContractInfoTestdata,
	clearData,
	getCount,
} from '../../lib/test-data'
import { getDbConnection } from '../../lib/db'

import timerTrigger from '../../../pair-transfer/index'
import { DbConnection } from '../../../common/db/common'
import { getApprovalBlockNumber } from '../../../common/block-chain/utils'
import { Event } from '../../../common/block-chain/event'
import { PairTransfer } from '../../../entities/pair-transfer'

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
		await clearData(con.connection, PairTransfer)
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
							from: 'dummy-from-address1',
							to: 'dummy-to-address1',
							value: 2000000000000000000,
						},
					},
					{
						id: 'dummy-event-id2',
						blockNumber: 12346,
						logIndex: 14,
						transactionIndex: 23,
						returnValues: {
							from: 'dummy-from-address2',
							to: 'dummy-to-address2',
							value: 7000000000000000000,
						},
					},
					{
						id: 'dummy-event-id3',
						blockNumber: 12347,
						logIndex: 12,
						transactionIndex: 21,
						returnValues: {
							from: 'dummy-from-address3',
							to: 'dummy-to-address3',
							value: 1000000000000000000,
						},
					},
				]),
			}
		})
		await timerTrigger(context, timer)

		const count = await getCount(con.connection, PairTransfer)
		expect(count).toBe(3)

		const manager = new EntityManager(con.connection)
		let record = await manager.findOneOrFail(PairTransfer, 'dummy-event-id1')

		expect(record.event_id).toBe('dummy-event-id1')
		expect(record.from_address).toBe('dummy-from-address1')
		expect(record.to_address).toBe('dummy-to-address1')
		expect(Number(record.token_value)).toBe(2000000000000000000)
		let rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id1')
		expect(rawData.returnValues.from).toBe('dummy-from-address1')
		expect(rawData.returnValues.to).toBe('dummy-to-address1')
		expect(rawData.returnValues.value).toBe(2000000000000000000)

		record = await manager.findOneOrFail(PairTransfer, 'dummy-event-id2')

		expect(record.event_id).toBe('dummy-event-id2')
		expect(record.from_address).toBe('dummy-from-address2')
		expect(record.to_address).toBe('dummy-to-address2')
		expect(Number(record.token_value)).toBe(7000000000000000000)
		rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id2')
		expect(rawData.returnValues.from).toBe('dummy-from-address2')
		expect(rawData.returnValues.to).toBe('dummy-to-address2')
		expect(rawData.returnValues.value).toBe(7000000000000000000)

		record = await manager.findOneOrFail(PairTransfer, 'dummy-event-id3')

		expect(record.event_id).toBe('dummy-event-id3')
		expect(record.from_address).toBe('dummy-from-address3')
		expect(record.to_address).toBe('dummy-to-address3')
		expect(Number(record.token_value)).toBe(1000000000000000000)
		rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id3')
		expect(rawData.returnValues.from).toBe('dummy-from-address3')
		expect(rawData.returnValues.to).toBe('dummy-to-address3')
		expect(rawData.returnValues.value).toBe(1000000000000000000)
	})
	afterAll(async () => {
		await con.quit()
	})
})
