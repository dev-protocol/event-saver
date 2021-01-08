import { EntityManager } from 'typeorm'
import { mocked } from 'ts-jest/utils'
import { getContextMock, getTimerMock } from '../../lib/mock'
import {
	saveContractInfoTestdata,
	clearData,
	getCount,
} from '../../lib/test-data'
import { getDbConnection } from '../../lib/db'

import timerTrigger from '../../../property-directory-factory-create'
import { DbConnection } from '../../../common/db/common'
import { getApprovalBlockNumber } from '../../../common/block-chain/utils'
import { Event } from '../../../common/block-chain/event'
import { PropertyDirectoryFactoryCreate } from '../../../entities/property-directory-factory-create'

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
		await clearData(con.connection, PropertyDirectoryFactoryCreate)
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
							_propertyDirectory: 'dummy-address1',
							_author: 'dummy-author-address1',
							_name: 'dummy-name1',
							_symbol: 'dummy-symbol1',
						},
					},
					{
						id: 'dummy-event-id2',
						blockNumber: 12346,
						logIndex: 14,
						transactionIndex: 23,
						returnValues: {
							_propertyDirectory: 'dummy-address2',
							_author: 'dummy-author-address2',
							_name: 'dummy-name2',
							_symbol: 'dummy-symbol2',
						},
					},
					{
						id: 'dummy-event-id3',
						blockNumber: 12347,
						logIndex: 12,
						transactionIndex: 21,
						returnValues: {
							_propertyDirectory: 'dummy-address3',
							_author: 'dummy-author-address3',
							_name: 'dummy-name3',
							_symbol: 'dummy-symbol3',
						},
					},
				]),
			}
		})
		await timerTrigger(context, timer)

		const count = await getCount(con.connection, PropertyDirectoryFactoryCreate)
		expect(count).toBe(3)

		const manager = new EntityManager(con.connection)
		let record = await manager.findOneOrFail(
			PropertyDirectoryFactoryCreate,
			'dummy-event-id1'
		)

		expect(record.event_id).toBe('dummy-event-id1')
		expect(record.property_directory).toBe('dummy-address1')
		expect(record.author).toBe('dummy-author-address1')
		expect(record.name).toBe('dummy-name1')
		expect(record.symbol).toBe('dummy-symbol1')
		let rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id1')
		expect(rawData.returnValues._propertyDirectory).toBe('dummy-address1')
		expect(rawData.returnValues._author).toBe('dummy-author-address1')
		expect(rawData.returnValues._name).toBe('dummy-name1')
		expect(rawData.returnValues._symbol).toBe('dummy-symbol1')

		record = await manager.findOneOrFail(
			PropertyDirectoryFactoryCreate,
			'dummy-event-id2'
		)

		expect(record.event_id).toBe('dummy-event-id2')
		expect(record.property_directory).toBe('dummy-address2')
		expect(record.author).toBe('dummy-author-address2')
		expect(record.name).toBe('dummy-name2')
		expect(record.symbol).toBe('dummy-symbol2')
		rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id2')
		expect(rawData.returnValues._propertyDirectory).toBe('dummy-address2')
		expect(rawData.returnValues._author).toBe('dummy-author-address2')
		expect(rawData.returnValues._name).toBe('dummy-name2')
		expect(rawData.returnValues._symbol).toBe('dummy-symbol2')

		record = await manager.findOneOrFail(
			PropertyDirectoryFactoryCreate,
			'dummy-event-id3'
		)

		expect(record.event_id).toBe('dummy-event-id3')
		expect(record.property_directory).toBe('dummy-address3')
		expect(record.author).toBe('dummy-author-address3')
		expect(record.name).toBe('dummy-name3')
		expect(record.symbol).toBe('dummy-symbol3')
		rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id3')
		expect(rawData.returnValues._propertyDirectory).toBe('dummy-address3')
		expect(rawData.returnValues._author).toBe('dummy-author-address3')
		expect(rawData.returnValues._name).toBe('dummy-name3')
		expect(rawData.returnValues._symbol).toBe('dummy-symbol3')
	})
	afterAll(async () => {
		await con.quit()
	})
})
