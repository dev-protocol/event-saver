import { EntityManager } from 'typeorm'
import { mocked } from 'ts-jest/utils'
import { getContextMock, getTimerMock } from '../../lib/mock'
import {
	saveContractInfoTestdata,
	clearData,
	getCount,
} from '../../lib/test-data'
import { getDbConnection } from '../../lib/db'

import timerTrigger from '../../../property-factory-change-author/index'
import { DbConnection } from '../../../common/db/common'
import { getApprovalBlockNumber } from '../../../common/block-chain/utils'
import { Event } from '../../../common/block-chain/event'
import { PropertyFactoryChangeAuthor } from '../../../entities/property-factory-change-author'

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
		await clearData(con.connection, PropertyFactoryChangeAuthor)
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
							_property: 'dummy-property-address1',
							_beforeAuthor: 'dummy-before-address1',
							_afterAuthor: 'dummy-after-address1',
						},
					},
					{
						id: 'dummy-event-id2',
						blockNumber: 12346,
						logIndex: 14,
						transactionIndex: 23,
						returnValues: {
							_property: 'dummy-property-address2',
							_beforeAuthor: 'dummy-before-address2',
							_afterAuthor: 'dummy-after-address2',
						},
					},
					{
						id: 'dummy-event-id3',
						blockNumber: 12347,
						logIndex: 12,
						transactionIndex: 21,
						returnValues: {
							_property: 'dummy-property-address3',
							_beforeAuthor: 'dummy-before-address3',
							_afterAuthor: 'dummy-after-address3',
						},
					},
				]),
			}
		})
		await timerTrigger(context, timer)

		const count = await getCount(con.connection, PropertyFactoryChangeAuthor)
		expect(count).toBe(3)

		const manager = new EntityManager(con.connection)
		let record = await manager.findOneOrFail(
			PropertyFactoryChangeAuthor,
			'dummy-event-id1'
		)

		expect(record.event_id).toBe('dummy-event-id1')
		expect(record.property).toBe('dummy-property-address1')
		expect(record.before_author).toBe('dummy-before-address1')
		expect(record.after_author).toBe('dummy-after-address1')
		let rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id1')
		expect(rawData.returnValues._property).toBe('dummy-property-address1')
		expect(rawData.returnValues._beforeAuthor).toBe('dummy-before-address1')
		expect(rawData.returnValues._afterAuthor).toBe('dummy-after-address1')

		record = await manager.findOneOrFail(
			PropertyFactoryChangeAuthor,
			'dummy-event-id2'
		)

		expect(record.event_id).toBe('dummy-event-id2')
		expect(record.property).toBe('dummy-property-address2')
		expect(record.before_author).toBe('dummy-before-address2')
		expect(record.after_author).toBe('dummy-after-address2')
		rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id2')
		expect(rawData.returnValues._property).toBe('dummy-property-address2')
		expect(rawData.returnValues._beforeAuthor).toBe('dummy-before-address2')
		expect(rawData.returnValues._afterAuthor).toBe('dummy-after-address2')

		record = await manager.findOneOrFail(
			PropertyFactoryChangeAuthor,
			'dummy-event-id3'
		)

		expect(record.event_id).toBe('dummy-event-id3')
		expect(record.property).toBe('dummy-property-address3')
		expect(record.before_author).toBe('dummy-before-address3')
		expect(record.after_author).toBe('dummy-after-address3')
		rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id3')
		expect(rawData.returnValues._property).toBe('dummy-property-address3')
		expect(rawData.returnValues._beforeAuthor).toBe('dummy-before-address3')
		expect(rawData.returnValues._afterAuthor).toBe('dummy-after-address3')
	})
	afterAll(async () => {
		await con.quit()
	})
})
