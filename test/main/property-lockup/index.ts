import { Connection } from 'typeorm'
import { getContextMock, getTimerMock } from '../../lib/mock'
import {
	saveContractInfoTestdata,
	clearData,
	getCount,
} from '../../lib/test-data'
import { getDbConnection } from '../../lib/db'

import timerTrigger from '../../../property-lockup/index'
import { DbConnection, Transaction } from '../../../common/db/common'
import { PropertyLockup } from '../../../entities/property-lockup'
import { DevPropertyTransfer } from '../../../entities/dev-property-transfer'
import { LockupLockedup } from '../../../entities/lockup-lockedup'
import { ProcessedBlockNumber } from '../../../entities/processed-block-number'
import { getProcessedBlockNumber } from '../../../common/db/event'

const context = getContextMock()

jest.mock('../../../common/notifications')

const timer = getTimerMock()

describe('timerTrigger', () => {
	let con: DbConnection
	beforeAll(async () => {
		con = await getDbConnection()
		await saveContractInfoTestdata(con.connection)
	})
	beforeEach(async () => {
		await clearData(con.connection, PropertyLockup)
		await clearData(con.connection, ProcessedBlockNumber)
		await clearData(con.connection, DevPropertyTransfer)
	})
	it('If the target record does not exist, nothing is processed.', async () => {
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyLockup)
		expect(count).toBe(0)
		count = await getCount(con.connection, DevPropertyTransfer)
		expect(count).toBe(0)
		count = await getCount(con.connection, ProcessedBlockNumber)
		expect(count).toBe(0)
	})
	it('Save the lockup data if the target record exists.', async () => {
		await saveTestData1(con.connection)
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyLockup)
		expect(count).toBe(1)
		count = await getCount(con.connection, DevPropertyTransfer)
		expect(count).toBe(1)
		const repository = con.connection.getRepository(PropertyLockup)

		const record = await repository.findOne({
			account_address: 'dummy-from-address1',
			property_address: 'dummy-to-address1',
		})

		expect(record.account_address).toBe('dummy-from-address1')
		expect(record.property_address).toBe('dummy-to-address1')
		expect(record.value).toBe('30000')
		expect(record.locked_up_event_id).toBe('dummy-lockup-event-id1')
		const blockNumber = await getProcessedBlockNumber(
			con.connection,
			'property-lockup'
		)
		expect(blockNumber).toBe(300000)
	})
	it('transfer event data will be added later.', async () => {
		await saveTestData1(con.connection)
		await timerTrigger(context, timer)
		await saveTestData2(con.connection)
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyLockup)
		expect(count).toBe(2)
		count = await getCount(con.connection, DevPropertyTransfer)
		expect(count).toBe(2)
		const repository = con.connection.getRepository(PropertyLockup)

		const record = await repository.findOne({
			account_address: 'dummy-from-address2',
			property_address: 'dummy-to-address2',
		})

		expect(record.account_address).toBe('dummy-from-address2')
		expect(record.property_address).toBe('dummy-to-address2')
		expect(record.value).toBe('10')
		expect(record.locked_up_event_id).toBe('dummy-lockup-event-id2')
		const blockNumber = await getProcessedBlockNumber(
			con.connection,
			'property-lockup'
		)
		expect(blockNumber).toBe(310000)
	})
	it('If the lockup is for the same user and property, value is added.', async () => {
		await saveTestData1(con.connection)
		await saveTestData3(con.connection)
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyLockup)
		expect(count).toBe(1)
		count = await getCount(con.connection, DevPropertyTransfer)
		expect(count).toBe(2)
		const repository = con.connection.getRepository(PropertyLockup)

		const record = await repository.findOne({
			account_address: 'dummy-from-address1',
			property_address: 'dummy-to-address1',
		})

		expect(record.account_address).toBe('dummy-from-address1')
		expect(record.property_address).toBe('dummy-to-address1')
		expect(record.value).toBe('30010')
		expect(record.locked_up_event_id).toBe('dummy-lockup-event-id2')
		const blockNumber = await getProcessedBlockNumber(
			con.connection,
			'property-lockup'
		)
		expect(blockNumber).toBe(310000)
	}, 10000)
	it('Ignore if there is no lockup information in the withdraw event.', async () => {
		await saveTestData4(con.connection)
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyLockup)
		expect(count).toBe(0)
		count = await getCount(con.connection, DevPropertyTransfer)
		expect(count).toBe(1)

		const blockNumber = await getProcessedBlockNumber(
			con.connection,
			'property-lockup'
		)
		expect(blockNumber).toBe(300030)
	})
	it('If the lockup information exists but the value is different, an error occurs.', async () => {
		await saveTestData1(con.connection)
		await saveTestData5(con.connection)
		try {
			await timerTrigger(context, timer)
		} catch (e) {
			expect(e.message).toBe('the values of lockup and withdraw are different.')
		}
	})
	it('If the lockup information exists, it is removed.', async () => {
		await saveTestData1(con.connection)
		await saveTestData4(con.connection)
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyLockup)
		expect(count).toBe(0)
		count = await getCount(con.connection, DevPropertyTransfer)
		expect(count).toBe(2)

		const blockNumber = await getProcessedBlockNumber(
			con.connection,
			'property-lockup'
		)
		expect(blockNumber).toBe(300030)
	})
	it('Up to 100 records can be processed at a time.', async () => {
		await saveManyTestData(con.connection)
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, PropertyLockup)
		expect(count).toBe(100)
		count = await getCount(con.connection, DevPropertyTransfer)
		expect(count).toBe(120)
	}, 20000)
	afterAll(async () => {
		await con.quit()
	})
})

async function saveTestData1(con: Connection) {
	const transaction = new Transaction(con)
	await transaction.start()
	const record = new DevPropertyTransfer()
	record.event_id = 'dummy-event-id1'
	record.block_number = 300000
	record.log_index = 20
	record.transaction_index = 31
	record.from_address = 'dummy-from-address1'
	record.to_address = 'dummy-to-address1'
	record.value = 30000
	record.is_from_address_property = false
	record.raw_data = '{}'
	await transaction.save(record)

	const record2 = new LockupLockedup()
	record2.event_id = 'dummy-lockup-event-id1'
	record2.block_number = 300000
	record2.log_index = 20
	record2.transaction_index = 31
	record2.from_address = 'dummy-from-address1'
	record2.property = 'dummy-to-address1'
	record2.token_value = 30000
	record2.raw_data = '{}'
	await transaction.save(record2)

	await transaction.commit()
	await transaction.finish()
}

async function saveTestData4(con: Connection) {
	const transaction = new Transaction(con)
	await transaction.start()
	const record = new DevPropertyTransfer()
	record.event_id = 'dummy-event-id2'
	record.block_number = 300030
	record.log_index = 12
	record.transaction_index = 3
	record.from_address = 'dummy-to-address1'
	record.to_address = 'dummy-from-address1'
	record.value = 30000
	record.is_from_address_property = true
	record.raw_data = '{}'
	await transaction.save(record)

	await transaction.commit()
	await transaction.finish()
}

async function saveTestData5(con: Connection) {
	const transaction = new Transaction(con)
	await transaction.start()
	const record = new DevPropertyTransfer()
	record.event_id = 'dummy-event-id2'
	record.block_number = 300030
	record.log_index = 12
	record.transaction_index = 3
	record.from_address = 'dummy-to-address1'
	record.to_address = 'dummy-from-address1'
	record.value = 30001
	record.is_from_address_property = true
	record.raw_data = '{}'
	await transaction.save(record)

	await transaction.commit()
	await transaction.finish()
}

async function saveTestData2(con: Connection) {
	const transaction = new Transaction(con)
	await transaction.start()
	const record = new DevPropertyTransfer()
	record.event_id = 'dummy-event-id2'
	record.block_number = 310000
	record.log_index = 21
	record.transaction_index = 30
	record.from_address = 'dummy-from-address2'
	record.to_address = 'dummy-to-address2'
	record.value = 10
	record.is_from_address_property = false
	record.raw_data = '{}'
	await transaction.save(record)

	const record2 = new LockupLockedup()
	record2.event_id = 'dummy-lockup-event-id2'
	record2.block_number = 310000
	record2.log_index = 20
	record2.transaction_index = 30
	record2.from_address = 'dummy-from-address2'
	record2.property = 'dummy-to-address2'
	record2.token_value = 10
	record2.raw_data = '{}'
	await transaction.save(record2)

	await transaction.commit()
	await transaction.finish()
}

async function saveTestData3(con: Connection) {
	const transaction = new Transaction(con)
	await transaction.start()
	const record = new DevPropertyTransfer()
	record.event_id = 'dummy-event-id2'
	record.block_number = 310000
	record.log_index = 21
	record.transaction_index = 30
	record.from_address = 'dummy-from-address1'
	record.to_address = 'dummy-to-address1'
	record.value = 10
	record.is_from_address_property = false
	record.raw_data = '{}'
	await transaction.save(record)

	const record2 = new LockupLockedup()
	record2.event_id = 'dummy-lockup-event-id2'
	record2.block_number = 310000
	record2.log_index = 20
	record2.transaction_index = 30
	record2.from_address = 'dummy-from-address1'
	record2.property = 'dummy-to-address1'
	record2.token_value = 10
	record2.raw_data = '{}'
	await transaction.save(record2)

	await transaction.commit()
	await transaction.finish()
}

async function saveManyTestData(con: Connection) {
	const transaction = new Transaction(con)
	await transaction.start()
	const record = new DevPropertyTransfer()
	const record2 = new LockupLockedup()
	for (let i = 0; i < 120; i++) {
		record.event_id = `dummy-event-id${i}`
		record.block_number = 300000 + i
		record.log_index = 20 + i
		record.transaction_index = 30 + i
		record.from_address = `dummy-from-address${i}`
		record.to_address = `dummy-to-address${i}`
		record.value = 30000 + i
		record.is_from_address_property = false
		record.raw_data = '{}'
		// eslint-disable-next-line no-await-in-loop
		await transaction.save(record)

		record2.event_id = `dummy-lockup-event-id${i}`
		record2.block_number = 300000 + i
		record2.log_index = 20 + i
		record2.transaction_index = 30 + i
		record2.from_address = `dummy-from-address${i}`
		record2.property = `dummy-to-address${i}`
		record2.token_value = 30000 + i
		record2.raw_data = '{}'
		// eslint-disable-next-line no-await-in-loop
		await transaction.save(record2)
	}

	await transaction.commit()
	await transaction.finish()
}
