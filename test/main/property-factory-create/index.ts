import { EntityManager } from 'typeorm'
import { mocked } from 'ts-jest/utils'
import { getContextMock, getTimerMock } from '../../lib/mock'
import {
	saveContractInfoTestdata,
	clearData,
	getCount,
} from '../../lib/test-data'
import { getDbConnection } from '../../lib/db'

import timerTrigger from '../../../property-factory-create/index'
import { DbConnection } from '../../../common/db/common'
import { getApprovalBlockNumber } from '../../../common/block-chain/utils'
import { Event } from '../../../common/block-chain/event'
import { PropertyFactoryCreate } from '../../../entities/property-factory-create'

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
		await clearData(con.connection, PropertyFactoryCreate)
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
							_from: 'dummy-user-address1',
							_property: 'dummy-property-address1',
						},
					},
					{
						id: 'dummy-event-id2',
						blockNumber: 12346,
						logIndex: 14,
						transactionIndex: 23,
						returnValues: {
							_from: 'dummy-user-address2',
							_property: 'dummy-property-address2',
						},
					},
					{
						id: 'dummy-event-id3',
						blockNumber: 12347,
						logIndex: 12,
						transactionIndex: 21,
						returnValues: {
							_from: 'dummy-user-address3',
							_property: 'dummy-property-address3',
						},
					},
				]),
			}
		})
		await timerTrigger(context, timer)

		const count = await getCount(con.connection, PropertyFactoryCreate)
		expect(count).toBe(3)

		const manager = new EntityManager(con.connection)
		let record = await manager.findOneOrFail(
			PropertyFactoryCreate,
			'dummy-event-id1'
		)

		expect(record.event_id).toBe('dummy-event-id1')
		expect(record.from_address).toBe('dummy-user-address1')
		expect(record.property).toBe('dummy-property-address1')
		let rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id1')
		expect(rawData.returnValues._from).toBe('dummy-user-address1')
		expect(rawData.returnValues._property).toBe('dummy-property-address1')

		record = await manager.findOneOrFail(
			PropertyFactoryCreate,
			'dummy-event-id2'
		)

		expect(record.event_id).toBe('dummy-event-id2')
		expect(record.from_address).toBe('dummy-user-address2')
		expect(record.property).toBe('dummy-property-address2')
		rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id2')
		expect(rawData.returnValues._from).toBe('dummy-user-address2')
		expect(rawData.returnValues._property).toBe('dummy-property-address2')

		record = await manager.findOneOrFail(
			PropertyFactoryCreate,
			'dummy-event-id3'
		)

		expect(record.event_id).toBe('dummy-event-id3')
		expect(record.from_address).toBe('dummy-user-address3')
		expect(record.property).toBe('dummy-property-address3')
		rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id3')
		expect(rawData.returnValues._from).toBe('dummy-user-address3')
		expect(rawData.returnValues._property).toBe('dummy-property-address3')
	})
	afterAll(async () => {
		await con.quit()
	})
})
