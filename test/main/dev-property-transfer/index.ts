import { EntityManager } from 'typeorm'
import { mocked } from 'ts-jest/utils'
import { getContextMock, getTimerMock } from '../../lib/mock'
import {
	saveContractInfoTestdata,
	clearData,
	getCount,
} from '../../lib/test-data'
import { getDbConnection } from '../../lib/db'

import timerTrigger from '../../../dev-property-transfer/index'
import { DbConnection } from '../../../common/db/common'
import { getApprovalBlockNumber } from '../../../common/block-chain/utils'
import { Event } from '../../../common/block-chain/event'
import { PropertyAddress } from '../../../common/property'
import { DevPropertyTransfer } from '../../../entities/dev-property-transfer'
import { ProcessedBlockNumber } from '../../../entities/processed-block-number'

const context = getContextMock()
const undefindMock = jest.fn().mockResolvedValue(undefined)

jest.mock('../../../common/notifications')
jest.mock('../../../common/block-chain/utils')
jest.mock('../../../common/block-chain/event')
jest.mock('../../../common/property')
mocked(getApprovalBlockNumber).mockImplementation(async () =>
	Promise.resolve(1000000000)
)

const timer = getTimerMock()

const isPropertyAddress = (address: string): boolean => {
	const propertyAddress = new Set([
		'dummy-from-address2',
		'dummy-to-address3',
		'dummy-from-address4',
		'dummy-to-address4',
	])

	return propertyAddress.has(address)
}

describe('timerTrigger', () => {
	let con: DbConnection
	beforeAll(async () => {
		con = await getDbConnection()
		await saveContractInfoTestdata(con.connection)
	})
	beforeEach(async () => {
		await clearData(con.connection, DevPropertyTransfer)
		await clearData(con.connection, ProcessedBlockNumber)
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
							value: 10,
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
							value: 100,
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
							value: 1000,
						},
					},
					{
						id: 'dummy-event-id4',
						blockNumber: 12349,
						logIndex: 2,
						transactionIndex: 12,
						returnValues: {
							from: 'dummy-from-address4',
							to: 'dummy-to-address4',
							value: 10000,
						},
					},
				]),
			}
		})
		mocked(PropertyAddress).mockImplementation((): any => {
			return {
				isExistencePropertyAddress: jest
					.fn()
					.mockImplementation((address: string) => isPropertyAddress(address)),
				isPropertyAddress: jest
					.fn()
					.mockImplementation((address: string) => isPropertyAddress(address)),
				isSet: jest
					.fn()
					.mockImplementation((address: string) => isPropertyAddress(address)),
				setup: undefindMock,
			}
		})
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, DevPropertyTransfer)
		expect(count).toBe(2)
		count = await getCount(con.connection, ProcessedBlockNumber)
		expect(count).toBe(1)
		const manager = new EntityManager(con.connection)
		let record = await manager.findOneOrFail(
			DevPropertyTransfer,
			'dummy-event-id2'
		)

		expect(record.event_id).toBe('dummy-event-id2')
		expect(record.block_number).toBe(12346)
		expect(record.log_index).toBe(14)
		expect(record.transaction_index).toBe(23)
		expect(record.from_address).toBe('dummy-from-address2')
		expect(record.to_address).toBe('dummy-to-address2')
		expect(record.value).toBe('100')
		expect(record.is_lockup).toBe(false)
		let rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id2')
		expect(rawData.returnValues.from).toBe('dummy-from-address2')
		expect(rawData.returnValues.to).toBe('dummy-to-address2')

		record = await manager.findOneOrFail(DevPropertyTransfer, 'dummy-event-id3')

		expect(record.event_id).toBe('dummy-event-id3')
		expect(record.block_number).toBe(12347)
		expect(record.log_index).toBe(12)
		expect(record.transaction_index).toBe(21)
		expect(record.from_address).toBe('dummy-from-address3')
		expect(record.to_address).toBe('dummy-to-address3')
		expect(record.value).toBe('1000')
		expect(record.is_lockup).toBe(true)
		rawData = JSON.parse(record.raw_data)
		expect(rawData.id).toBe('dummy-event-id3')
		expect(rawData.returnValues.from).toBe('dummy-from-address3')
		expect(rawData.returnValues.to).toBe('dummy-to-address3')

		const record2 = await manager.findOneOrFail(
			ProcessedBlockNumber,
			'dev-property-transfer'
		)
		expect(record2.block_number).toBe(30000)
	})
	afterAll(async () => {
		await con.quit()
	})
})
