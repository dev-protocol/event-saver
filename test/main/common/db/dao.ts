import { DbConnection, Transaction } from '../../../../common/db/common'
import {
	EventTableAccessor,
	getMaxBlockNumber,
	getMinBlockNumber,
	getEventRecordThenGreaterBlockNumber,
	getProcessedBlockNumber,
	setProcessedBlockNumber,
} from '../../../../common/db/dao'
import { LockupLockedup } from '../../../../entities/lockup-lockedup'
import { getDbConnection } from '../../../lib/db'
import { saveLockupLockupedTestdata, clearData } from '../../../lib/test-data'

describe('EventTableAccessor', () => {
	let con: DbConnection
	beforeAll(async (done) => {
		con = await getDbConnection()
		done()
	})
	afterAll(async (done) => {
		await con.quit()
		done()
	})
	it('can get the maximum block_number that exists in the record.', async () => {
		await clearData(con.connection, LockupLockedup)
		const event = new EventTableAccessor(con.connection, LockupLockedup)
		let nomber = await event.getMaxBlockNumber()
		expect(nomber).toBe(0)
		await saveLockupLockupedTestdata(con.connection)
		nomber = await event.getMaxBlockNumber()
		expect(nomber).toBe(32000)
	})
	it('Based on the event ID, it is possible to check the existence of data in the record.', async () => {
		await saveLockupLockupedTestdata(con.connection)
		const event = new EventTableAccessor(con.connection, LockupLockedup)
		let hasData = await event.hasData('dummy-event-id1')
		expect(hasData).toBe(true)
		hasData = await event.hasData('dummy')
		expect(hasData).toBe(false)
	})
})

describe('getMaxBlockNumber', () => {
	let con: DbConnection
	beforeAll(async (done) => {
		con = await getDbConnection()
		done()
	})
	afterAll(async (done) => {
		await con.quit()
		done()
	})
	it('If the record exists, get the maximum block number.', async () => {
		await saveLockupLockupedTestdata(con.connection)
		const blockNUmber = await getMaxBlockNumber(con.connection, LockupLockedup)
		expect(blockNUmber).toBe(32000)
	})
	it('If the record exists, get 0.', async () => {
		await clearData(con.connection, LockupLockedup)
		const blockNUmber = await getMaxBlockNumber(con.connection, LockupLockedup)
		expect(blockNUmber).toBe(0)
	})
})

describe('getMinBlockNumber', () => {
	let con: DbConnection
	beforeAll(async (done) => {
		con = await getDbConnection()
		done()
	})
	afterAll(async (done) => {
		await con.quit()
		done()
	})
	it('If the record exists, get the maximum block number.', async () => {
		await saveLockupLockupedTestdata(con.connection)
		const blockNUmber = await getMinBlockNumber(con.connection, LockupLockedup)
		expect(blockNUmber).toBe(30000)
	})
	it('If the record exists, get 0.', async () => {
		await clearData(con.connection, LockupLockedup)
		const blockNUmber = await getMaxBlockNumber(con.connection, LockupLockedup)
		expect(blockNUmber).toBe(0)
	})
})

describe('getEventRecordThenGreaterBlockNumber', () => {
	let con: DbConnection
	beforeAll(async (done) => {
		con = await getDbConnection()
		done()
	})
	afterAll(async (done) => {
		await con.quit()
		done()
	})
	it('Records with more than one argument are returned, part 1.', async () => {
		await saveLockupLockupedTestdata(con.connection)
		const records = await getEventRecordThenGreaterBlockNumber(
			con.connection,
			LockupLockedup,
			0
		)
		expect(records.length).toBe(3)
	})
	it('Records with more than one argument are returned, part 2.', async () => {
		await saveLockupLockupedTestdata(con.connection)
		const records = await getEventRecordThenGreaterBlockNumber(
			con.connection,
			LockupLockedup,
			30500
		)
		expect(records.length).toBe(2)
	})
	it('Records with more than one argument are returned, part 3.', async () => {
		await saveLockupLockupedTestdata(con.connection)
		const records = await getEventRecordThenGreaterBlockNumber(
			con.connection,
			LockupLockedup,
			32000
		)
		expect(records.length).toBe(1)
	})
	it('An empty array is returned if there is no record that contains more than the argument block number.', async () => {
		await saveLockupLockupedTestdata(con.connection)
		const records = await getEventRecordThenGreaterBlockNumber(
			con.connection,
			LockupLockedup,
			33000
		)
		expect(records.length).toBe(0)
	})
})

describe('getProcessedBlockNumber,setProcessedBlockNumber', () => {
	let con: DbConnection
	beforeAll(async (done) => {
		con = await getDbConnection()
		done()
	})
	afterAll(async (done) => {
		await con.quit()
		done()
	})
	it('If the record does not exist, it returns 0.', async () => {
		const blockNumber = await getProcessedBlockNumber(con.connection, 'test')
		expect(blockNumber).toBe(0)
	})
	it('It returns the value you set.', async () => {
		const transaction = new Transaction(con.connection)
		await transaction.start()
		await setProcessedBlockNumber(transaction, 'test', 999)
		await transaction.commit()
		await transaction.finish()
		const blockNumber = await getProcessedBlockNumber(con.connection, 'test')
		expect(blockNumber).toBe(999)
	})
})
