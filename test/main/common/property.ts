import { Connection } from 'typeorm'
import { EventData } from 'web3-eth-contract/types'
import { DbConnection, Transaction } from '../../../common/db/common'
import { ZERO_ADDRESS } from '../../../common/block-chain/utils'
import {
	PropertyAddress,
	PropertyData,
	PropertyBalanceAccessor,
	getPropertyMeta,
} from '../../../common/property'
import { getDbConnection } from './../../lib/db'
import {
	saveContractInfoTestdata,
	clearData,
	EventDataGenerator,
	generateTestAddress,
	getCount,
} from './../../lib/test-data'
import { PropertyMeta } from '../../../entities/property-meta'
import { PropertyBalance } from '../../../entities/property-balance'

describe('PropertyAddress', () => {
	let con: DbConnection
	let propertyAddress: PropertyAddress
	class Web3PropertyCallMock {
		eth: any
		constructor(_: any) {
			this.eth = {
				Contract: class Contract {
					_abi: any
					_address: string
					methods: any
					constructor(abi: any, address: string) {
						this._abi = abi
						this._address = address
						this.methods = {}
						this.methods.isGroup = function (address: string) {
							return {
								call: async function (): Promise<boolean> {
									const groupAddress = new Set([
										'0xD27399E30822E6e4CaB1B6c34d6c78ea1E01BF61',
									])
									return groupAddress.has(address)
								},
							}
						}
					}
				},
			}
		}
	}
	beforeAll(async (done) => {
		con = await getDbConnection()
		await saveContractInfoTestdata(con.connection)
		await clearData(con.connection, PropertyMeta)
		done()
	})
	afterAll(async (done) => {
		await con.quit()
		done()
	})
	beforeEach(async (done) => {
		propertyAddress = new PropertyAddress(con, new Web3PropertyCallMock({}))
		await propertyAddress.setup()
		done()
	})
	describe('isPropertyAddress', () => {
		it('Addresses that are not in the property group.', async () => {
			const target = '0x3BEE6e097758aA532FaA2ba72D7730B85218594c'
			let result = propertyAddress.isSet(target)
			expect(result).toBe(false)
			result = await propertyAddress.isPropertyAddress(target)
			expect(result).toBe(false)
			result = propertyAddress.isSet(target)
			expect(result).toBe(false)
		})
		it('Address of the property group.', async () => {
			const target = '0xD27399E30822E6e4CaB1B6c34d6c78ea1E01BF61'
			let result = propertyAddress.isSet(target)
			expect(result).toBe(false)
			result = await propertyAddress.isPropertyAddress(target)
			expect(result).toBe(true)
			result = propertyAddress.isSet(target)
			expect(result).toBe(true)
		})
		it('address is lower case.', async () => {
			const target = '0xd27399e30822e6e4cab1b6c34d6c78ea1e01bf61'
			let result = propertyAddress.isSet(target)
			expect(result).toBe(false)
			result = await propertyAddress.isPropertyAddress(target)
			expect(result).toBe(true)
			result = propertyAddress.isSet(target)
			expect(result).toBe(true)
		})
	})
})

describe('PropertyData', () => {
	let con: DbConnection
	class Web3Mock {
		eth: any
		constructor(balance: number) {
			this.eth = {
				Contract: class Contract {
					_abi: any
					_address: string
					methods: any
					getPastEvents: any
					constructor(abi: any, address: string) {
						this._abi = abi
						this._address = address
						this.methods = {}
						this.methods.author = function () {
							return {
								call: async function (): Promise<string> {
									return 'author-address'
								},
							}
						}

						this.methods.balanceOf = function (_: string) {
							return {
								call: async function (): Promise<number> {
									return balance
								},
							}
						}

						this.getPastEvents = async function (
							a: string,
							b: Record<string, unknown>
						): Promise<EventData[]> {
							const gen = new EventDataGenerator()
							gen.addMintTransfer('address1', 10, 100)
							gen.addTransfer('address1', 'address2', 5, 110)
							return gen.data
						}
					}
				},
			}
		}
	}

	beforeAll(async (done) => {
		con = await getDbConnection()
		await saveContractInfoTestdata(con.connection)
		await clearData(con.connection, PropertyMeta)

		const transaction = new Transaction(con.connection)
		await transaction.start()
		const propertyMeta = new PropertyMeta()
		propertyMeta.author = 'author-address'
		propertyMeta.property = 'property-address'
		propertyMeta.sender = 'sender-address'
		propertyMeta.block_number = 100
		propertyMeta.name = 'name'
		propertyMeta.symbol = 'SYMBOL'
		propertyMeta.total_supply = 10000000000
		await transaction.save(propertyMeta)
		await transaction.commit()
		await transaction.finish()

		done()
	})
	afterAll(async (done) => {
		await con.quit()
		done()
	})
	describe('getAuthor', () => {
		it('you can get the author.', async () => {
			const propertyData = new PropertyData(
				new Web3Mock(0),
				con.connection,
				'property-address'
			)
			await propertyData.load()
			const author = await propertyData.getAuthor()
			expect(author).toBe('author-address')
		})
	})
	describe('hasAllTokenByAuthor', () => {
		it('if the balance of author is equal to the total number, true will return.', async () => {
			const propertyData = new PropertyData(
				new Web3Mock(10000000000),
				con.connection,
				'property-address'
			)
			await propertyData.load()
			const result = await propertyData.hasAllTokenByAuthor()
			expect(result).toBe(true)
		})
		it('if the balance of author is different from the total number, false will return.', async () => {
			const propertyData = new PropertyData(
				new Web3Mock(9000000000),
				con.connection,
				'property-address'
			)
			await propertyData.load()
			const result = await propertyData.hasAllTokenByAuthor()
			expect(result).toBe(false)
		})
	})
	describe('getTransferEvent', () => {
		it('event information can be retrieved.', async () => {
			const propertyData = new PropertyData(
				new Web3Mock(0),
				con.connection,
				'property-address'
			)
			await propertyData.load()
			const events = await propertyData.getTransferEvent(100)
			expect(events.length).toBe(2)
			events.forEach((event) => {
				switch (event.returnValues.from) {
					case ZERO_ADDRESS:
						expect(event.returnValues.to).toBe('address1')
						expect(event.returnValues.value).toBe(10)
						break
					case 'address1':
						expect(event.returnValues.to).toBe('address2')
						expect(event.returnValues.value).toBe(5)
						break
					default:
						throw new Error('illegal address')
				}
			})
		})
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

describe('getPropertyMeta', () => {
	let con: DbConnection
	beforeAll(async (done) => {
		con = await getDbConnection()
		await clearData(con.connection, PropertyMeta)
		const transaction = new Transaction(con.connection)
		await transaction.start()
		const record = new PropertyMeta()
		record.author = 'author1'
		record.property = 'property1'
		record.sender = 'snder1'
		record.name = 'name1'
		record.symbol = 'symbol1'
		record.total_supply = 100000000
		record.block_number = 10000
		await transaction.save(record)
		record.author = 'author2'
		record.property = 'property2'
		record.sender = 'snder2'
		record.name = 'name2'
		record.symbol = 'symbol2'
		record.total_supply = 1000000000
		record.block_number = 100000
		await transaction.save(record)
		await transaction.commit()
		await transaction.finish()
		done()
	})
	afterAll(async (done) => {
		await con.quit()
		done()
	})
	it('data in the PropertyMeta table can be retrieved..', async () => {
		const propertyMeta = await getPropertyMeta(con.connection, 'property1')
		expect(propertyMeta.author).toBe('author1')
		expect(propertyMeta.property).toBe('property1')
		expect(propertyMeta.sender).toBe('snder1')
		expect(propertyMeta.name).toBe('name1')
		expect(propertyMeta.symbol).toBe('symbol1')
		expect(propertyMeta.total_supply).toBe('100000000')
		expect(propertyMeta.block_number).toBe(10000)
	})
	it('an error occurs when a non-existent property address is specified.', async () => {
		await expect(getPropertyMeta(con.connection, 'hogehoge')).rejects.toThrow(
			'Could not find any entity of type "PropertyMeta"'
		)
	})
})
