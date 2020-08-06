import { Connection } from 'typeorm'
import { mocked } from 'ts-jest/utils'
import { getContextMock, getTimerMock } from '../../lib/mock'
import {
	saveContractInfoTestdata,
	clearData,
	getCount,
} from '../../lib/test-data'
import { getDbConnection } from '../../lib/db'

import timerTrigger from '../../../property-balance/index'
import { DbConnection, Transaction } from '../../../common/db/common'
import { getPropertyInstance } from '../../../common/block-chain/utils'
import { PropertyBalance } from '../../../entities/property-balance'
import { WithdrawPropertyTransfer } from '../../../entities/withdraw-property_transfer'
import { ProcessedBlockNumber } from '../../../entities/processed-block-number'
import { getProcessedBlockNumber } from '../../../common/db/event'

const context = getContextMock()

jest.mock('../../../common/notifications')
jest.mock('../../../common/block-chain/utils')

async function createPropertyInstanceMock(
	balance = 10000000000000000000000000,
	events = []
) {
	const author = function () {
		return {
			call: async function (): Promise<any> {
				return 'dummy-auther-address1'
			},
		}
	}

	const totalSupply = function () {
		return {
			call: async function (): Promise<any> {
				return 10000000000000000000000000
			},
		}
	}

	const balanceOf = function (_address: string) {
		return {
			call: async function (): Promise<any> {
				return balance
			},
		}
	}

	const getPastEvents = async function (_eventName: string): Promise<any> {
		return events
	}

	const mockResult = {
		methods: {
			author: author,
			balanceOf: balanceOf,
			totalSupply: totalSupply,
		},
		getPastEvents: getPastEvents,
	}

	mocked(getPropertyInstance).mockImplementation(async () =>
		Promise.resolve(mockResult)
	)
}

const timer = getTimerMock()

describe('timerTrigger', () => {
	let con: DbConnection
	beforeAll(async () => {
		con = await getDbConnection()
		await saveContractInfoTestdata(con.connection)
	})
	beforeEach(async () => {
		await clearData(con.connection, PropertyBalance)
		await clearData(con.connection, ProcessedBlockNumber)
		await clearData(con.connection, WithdrawPropertyTransfer)
	})
	it('If the target record does not exist, nothing is processed.', async () => {
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyBalance)
		expect(count).toBe(0)
		count = await getCount(con.connection, WithdrawPropertyTransfer)
		expect(count).toBe(0)
		count = await getCount(con.connection, ProcessedBlockNumber)
		expect(count).toBe(0)
	})
	it('If the auther has all tokens, the record is not created.', async () => {
		await saveTestData1(con.connection)
		await createPropertyInstanceMock()
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyBalance)
		expect(count).toBe(0)
		count = await getCount(con.connection, WithdrawPropertyTransfer)
		expect(count).toBe(1)
		const blockNumber = await getProcessedBlockNumber(
			con.connection,
			'property-balance'
		)
		expect(blockNumber).toBe(300000)
	})
	it('If the balance of the property has been moved, a record is created.', async () => {
		await saveTestData1(con.connection)
		await createPropertyInstanceMock(7000000000000000000000000, [
			{
				id: 'dummy-event-id1',
				blockNumber: 300000,
				logIndex: 15,
				transactionIndex: 31,
				returnValues: {
					from: 'dummy-auther-address1',
					to: 'dummy-to-address1',
					value: 3000000000000000000000000,
				},
			},
		])
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyBalance)
		expect(count).toBe(2)
		count = await getCount(con.connection, WithdrawPropertyTransfer)
		expect(count).toBe(1)
		const repository = con.connection.getRepository(PropertyBalance)
		let record = await repository.findOne({
			property_address: 'dummy-property-address1',
			account_address: 'dummy-auther-address1',
		})

		expect(record.balance.toString()).toBe('7000000000000000000000000')
		expect(record.is_author).toBe(true)
		expect(record.block_number).toBe(300000)

		record = await repository.findOne({
			property_address: 'dummy-property-address1',
			account_address: 'dummy-to-address1',
		})

		expect(record.balance.toString()).toBe('3000000000000000000000000')
		expect(record.is_author).toBe(false)
		expect(record.block_number).toBe(300000)
		const blockNumber = await getProcessedBlockNumber(
			con.connection,
			'property-balance'
		)
		expect(blockNumber).toBe(300000)
	})
	it('After the property balance is moved, if the balance is restored, the record is deleted.', async () => {
		await saveTestData1(con.connection)
		await createPropertyInstanceMock(7000000000000000000000000, [
			{
				id: 'dummy-event-id1',
				blockNumber: 300000,
				logIndex: 15,
				transactionIndex: 31,
				returnValues: {
					from: 'dummy-auther-address1',
					to: 'dummy-to-address1',
					value: 3000000000000000000000000,
				},
			},
		])
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyBalance)
		expect(count).toBe(2)
		await createPropertyInstanceMock(10000000000000000000000000, [
			{
				id: 'dummy-event-id1',
				blockNumber: 300000,
				logIndex: 15,
				transactionIndex: 31,
				returnValues: {
					from: 'dummy-auther-address1',
					to: 'dummy-to-address1',
					value: 3000000000000000000000000,
				},
			},
			{
				id: 'dummy-event-id2',
				blockNumber: 301000,
				logIndex: 15,
				transactionIndex: 31,
				returnValues: {
					from: 'dummy-to-address1',
					to: 'dummy-auther-address1',
					value: 3000000000000000000000000,
				},
			},
		])
		await saveTestData2(con.connection)
		await timerTrigger(context, timer)
		count = await getCount(con.connection, PropertyBalance)
		expect(count).toBe(0)
	})
	afterAll(async () => {
		await con.quit()
	})
})

async function saveTestData1(con: Connection) {
	const transaction = new Transaction(con)
	await transaction.start()
	const record = new WithdrawPropertyTransfer()
	record.event_id = 'dummy-event-id1'
	record.block_number = 300000
	record.log_index = 20
	record.transaction_index = 31
	record.property_address = 'dummy-property-address1'
	record.from_address = 'dummy-author-address1'
	record.to_address = 'dummy-to-address1'
	record.raw_data = '{}'
	await transaction.save(record)
	await transaction.commit()
	await transaction.finish()
}

async function saveTestData2(con: Connection) {
	const transaction = new Transaction(con)
	await transaction.start()
	let record = new WithdrawPropertyTransfer()
	record.event_id = 'dummy-event-id2'
	record.block_number = 301000
	record.log_index = 20
	record.transaction_index = 31
	record.property_address = 'dummy-property-address1'
	record.from_address = 'dummy-to-address1'
	record.to_address = 'dummy-author-address1'
	record.raw_data = '{}'
	await transaction.save(record)
	await transaction.commit()
	await transaction.finish()
}
