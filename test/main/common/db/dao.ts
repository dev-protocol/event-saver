import { Connection } from 'typeorm'
import { DbConnection, Transaction } from '../../../../common/db/common'
import {
	EventTableAccessor,
	getMaxBlockNumber,
	getMinBlockNumber,
	getEventRecordThenGreaterBlockNumber,
	getProcessedBlockNumber,
	setProcessedBlockNumber,
	PropertyBalanceAccessor,
} from '../../../../common/db/dao'
import { LockupLockedup } from '../../../../entities/lockup-lockedup'
import { PropertyBalance } from '../../../../entities/property-balance'
import { getDbConnection } from '../../../lib/db'
import {
	generateTestAddress,
	saveLockupLockupedTestdata,
	clearData,
	getCount,
	EventDataGenerator,
} from '../../../lib/test-data'

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

describe('PropertyBalanceAccessor', () => {
	let con: DbConnection
	const [
		property1,
		property2,
		property3,
		account1,
		account2,
		account3,
		account4,
		treasury,
	] = generateTestAddress()
	async function saveTestData1(con: Connection) {
		const transaction = new Transaction(con)
		await transaction.start()
		const record = new PropertyBalance()
		record.property_address = property1
		record.account_address = account1
		record.balance = '100'
		record.is_author = true
		record.block_number = 10000
		await transaction.save(record)
		record.account_address = account2
		record.balance = '1000'
		record.is_author = false
		record.block_number = 10000
		await transaction.save(record)
		record.property_address = property2
		record.account_address = account3
		record.balance = '1000'
		record.is_author = true
		record.block_number = 100000
		await transaction.save(record)
		record.account_address = account4
		record.balance = '1000000'
		record.is_author = false
		record.block_number = 1000000
		await transaction.save(record)
		await transaction.commit()
		await transaction.finish()
	}

	beforeAll(async (done) => {
		con = await getDbConnection()
		done()
	})
	afterAll(async (done) => {
		await con.quit()
		done()
	})
	beforeEach(async () => {
		await clearData(con.connection, PropertyBalance)
	})
	describe('deleteRecord', () => {
		it('delete records that match the specified address.', async () => {
			await saveTestData1(con.connection)
			const transaction = new Transaction(con.connection)
			await transaction.start()
			const accessor = new PropertyBalanceAccessor(transaction)
			await accessor.deleteRecord(property1)
			await transaction.commit()
			await transaction.finish()
			const repository = con.connection.getRepository(PropertyBalance)
			const records = await repository.find({
				property_address: property2,
			})
			expect(records.length).toBe(2)
		})
		it('if there is no matching record, the record will not be deleted.', async () => {
			await saveTestData1(con.connection)
			const transaction = new Transaction(con.connection)
			await transaction.start()
			const accessor = new PropertyBalanceAccessor(transaction)
			await accessor.deleteRecord(property3)
			await transaction.commit()
			await transaction.finish()
			const recordCount = await getCount(con.connection, PropertyBalance)
			expect(recordCount).toBe(4)
		})
	})
	describe('insertRecord', () => {
		it('event information is registered as a record..', async () => {
			await saveTestData1(con.connection)
			const dataGenerator = new EventDataGenerator()
			dataGenerator.addMintTransfer(account1, 10000, 100)
			dataGenerator.addMintTransfer(treasury, 5000, 100)
			dataGenerator.addTransfer(account1, account4, 100, 120)
			dataGenerator.addTransfer(account1, account3, 50, 122)
			const transaction = new Transaction(con.connection)
			await transaction.start()
			const accessor = new PropertyBalanceAccessor(transaction)
			await accessor.insertRecord(dataGenerator.data, property1, account1)
			await transaction.commit()
			await transaction.finish()
			const repository = con.connection.getRepository(PropertyBalance)
			const property2Records = await repository.find({
				property_address: property2,
			})
			expect(property2Records.length).toBe(2)
			const property1Records = await repository.find({
				property_address: property1,
			})
			expect(property1Records.length).toBe(4)
			property1Records.forEach((property1Record) => {
				expect(property1Record.property_address).toBe(property1)
				switch (property1Record.account_address) {
					case treasury:
						expect(property1Record.balance).toBe('5000')
						expect(property1Record.is_author).toBe(false)
						expect(property1Record.block_number).toBe(100)
						break
					case account4:
						expect(property1Record.balance).toBe('100')
						expect(property1Record.is_author).toBe(false)
						expect(property1Record.block_number).toBe(120)
						break
					case account3:
						expect(property1Record.balance).toBe('50')
						expect(property1Record.is_author).toBe(false)
						expect(property1Record.block_number).toBe(122)
						break
					case account1:
						expect(property1Record.balance).toBe('9850')
						expect(property1Record.is_author).toBe(true)
						expect(property1Record.block_number).toBe(122)
						break
					default:
						throw new Error('illegal account address')
				}
			})
		})
		it('if the event information is zero, an error occurs.', async () => {
			const dataGenerator = new EventDataGenerator()
			const transaction = new Transaction(con.connection)
			await transaction.start()
			const accessor = new PropertyBalanceAccessor(transaction)
			const result = await accessor
				.insertRecord(dataGenerator.data, property1, account1)
				.catch((err: Error) => err)
			expect((result as Error).message).toBe(
				`property balance record is 0: ${property1}`
			)
			await transaction.commit()
			await transaction.finish()
		})
	})
})
