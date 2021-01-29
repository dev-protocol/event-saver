import { EventData } from 'web3-eth-contract/types'
import { DbConnection, Transaction } from '../../../common/db/common'
import { ZERO_ADDRESS } from '../../../common/block-chain/utils'
import { PropertyAddress, PropertyData } from '../../../common/property'
import { getDbConnection } from './../../lib/db'
import {
	saveContractInfoTestdata,
	clearData,
	EventDataGenerator,
} from './../../lib/test-data'
import { PropertyMeta } from '../../../entities/property-meta'

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
