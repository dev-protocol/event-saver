import { Connection } from 'typeorm'
import { mocked } from 'ts-jest/utils'
import { DbConnection, Transaction } from '../../../common/db/common'
import {
	PropertyBalanceAccessor,
	createPropertyBalance,
} from '../../../common/property-balance'
import { PropertyData } from '../../../common/property'
import { getDbConnection } from './../../lib/db'
import {
	clearData,
	EventDataGenerator,
	generateTestAddress,
	getCount,
} from './../../lib/test-data'
import { PropertyBalance } from '../../../entities/property-balance'

jest.mock('./../../../common/property')
const undefindMock = jest.fn().mockResolvedValue(undefined)

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

describe('createPropertyBalance', () => {
	let con: DbConnection

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
	it('property-balance data will be created.', async () => {
		const gen = new EventDataGenerator()
		gen.addMintTransfer('dummy-author-address1', 10000000000, 290000)
		gen.addTransfer(
			'dummy-author-address1',
			'dummy-to-address1',
			4000000000,
			3000000
		)
		mocked(PropertyData).mockImplementation((): any => {
			return {
				load: undefindMock,
				getAuthor: jest.fn().mockResolvedValue('dummy-author-address1'),
				hasAllTokenByAuthor: jest.fn().mockResolvedValue(false),
				getTransferEvent: jest.fn().mockResolvedValue(gen.data),
			}
		})
		const transaction = new Transaction(con.connection)
		await transaction.start()
		await createPropertyBalance(
			con.connection,
			'dummy-property-address1',
			3000000,
			transaction
		)
		await transaction.commit()
		await transaction.finish()
		const repository = con.connection.getRepository(PropertyBalance)
		const records = await repository.find({
			property_address: 'dummy-property-address1',
		})
		expect(records.length).toBe(2)
		records.forEach((record) => {
			expect(record.property_address).toBe('dummy-property-address1')
			switch (record.account_address) {
				case 'dummy-author-address1':
					expect(record.balance).toBe('6000000000')
					expect(record.is_author).toBe(true)
					expect(record.block_number).toBe(3000000)
					break
				case 'dummy-to-address1':
					expect(record.balance).toBe('4000000000')
					expect(record.is_author).toBe(false)
					expect(record.block_number).toBe(3000000)
					break
				default:
					throw new Error('illegal account address')
			}
		})
	})
	it('if author has all property token, property balance data will not be created.', async () => {
		mocked(PropertyData).mockImplementation((): any => {
			return {
				load: undefindMock,
				getAuthor: jest.fn().mockResolvedValue('dummy-author-address1'),
				hasAllTokenByAuthor: jest.fn().mockResolvedValue(true),
				getTransferEvent: jest.fn().mockResolvedValue([]),
			}
		})
		const transaction = new Transaction(con.connection)
		await transaction.start()
		await createPropertyBalance(
			con.connection,
			'dummy-property-address1',
			3000000,
			transaction
		)
		await transaction.commit()
		await transaction.finish()
		const repository = con.connection.getRepository(PropertyBalance)
		const records = await repository.find({
			property_address: 'dummy-property-address1',
		})
		expect(records.length).toBe(0)
	})
})
