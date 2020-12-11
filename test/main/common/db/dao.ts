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

// Describe('PropertyBalanceAccessor', () => {
// 	let con: DbConnection
// 	const [property1, property2. account1, account2] = generateTestAddress()
// 	async function saveTestData1(con: Connection) {
// 		const transaction = new Transaction(con)
// 		await transaction.start()
// 		const record = new PropertyBalance()
// 		record.property_address = property1
// 		record.account_address = account1
// 		record.balance = '100'
// 		record.is_author = true

// 		@PrimaryColumn()
// 		public property_address!: string

// 		@PrimaryColumn()
// 		public account_address!: string

// 		@Column()
// 		public balance!: string

// 		@Column()
// 		public is_author!: boolean

// 		@Column()
// 		public block_number!: number

// 		record.event_id = 'dummy-event-id1'
// 		record.block_number = 300000
// 		record.log_index = 20
// 		record.transaction_index = 31
// 		record.property_address = 'dummy-property-address1'
// 		record.from_address = 'dummy-author-address1'
// 		record.to_address = 'dummy-to-address1'
// 		record.raw_data = '{}'
// 		await transaction.save(record)

// 		const record2 = new PropertyMeta()
// 		record2.author = '0xauthor'
// 		record2.property = 'dummy-property-address1'
// 		record2.sender = '0xsender'
// 		record2.block_number = 290000
// 		record2.name = 'name'
// 		record2.symbol = 'symbol'
// 		record2.symbol = 'symbol'
// 		await transaction.save(record2)

// 		await transaction.commit()
// 		await transaction.finish()
// 	}
// 	beforeAll(async (done) => {
// 		con = await getDbConnection()
// 		done()
// 	})
// 	afterAll(async (done) => {
// 		await con.quit()
// 		done()
// 	})
// 	beforeEach(async () => {
// 		await clearData(con.connection, PropertyBalance)
// 	})
// 	describe('deleteRecord', () => {
// 		it('propertyアドレスが合致するPropertyBalanceのレコードを全て削除する.', async () => {
// 			const transaction = new Transaction(con.connection)
// 			const accessor = new PropertyBalanceAccessor(transaction)
// 			await accessor.deleteRecord()
// 			const blockNumber = await getProcessedBlockNumber(con.connection, 'test')
// 			expect(blockNumber).toBe(0)
// 		})
// 		it('合致するレコードがない場合、レコードは削除されない.', async () => {
// 			const transaction = new Transaction(con.connection)
// 			const accessor = new PropertyBalanceAccessor(transaction)
// 			await accessor.deleteRecord('dummy')

// 		})
// 		it('変なアドレスを指定するとエラーになる.', async () => {
// 			const transaction = new Transaction(con.connection)
// 			const accessor = new PropertyBalanceAccessor(transaction)
// 			await accessor.deleteRecord('dummy')

// 		})
// 	})
// 	describe('insertRecord', () => {
// 		it('propertyアドレスが合致するPropertyBalanceのレコードを全て削除した後、レコードを登録する.', async () => {
// 			const transaction = new Transaction(con.connection)
// 			const accessor = new PropertyBalanceAccessor(transaction)

// 			const blockNumber = await getProcessedBlockNumber(con.connection, 'test')
// 			expect(blockNumber).toBe(0)
// 		})
// 		it('イベント情報が0の場合、エラーになる.', async () => {

// 		})
// 		it('変なpropertyアドレスを指定するとエラーになる.', async () => {
// 			const transaction = new Transaction(con.connection)
// 			const accessor = new PropertyBalanceAccessor(transaction)
// 			await accessor.deleteRecord('dummy')

// 		})
// 		it('変なauthorアドレスを指定するとエラーになる.', async () => {
// 			const transaction = new Transaction(con.connection)
// 			const accessor = new PropertyBalanceAccessor(transaction)
// 			await accessor.deleteRecord('dummy')

// 		})
// 	})
// })
