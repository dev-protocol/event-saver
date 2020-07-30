import { Connection } from 'typeorm'
import { DbConnection, Transaction } from '../../../common/db/common'
import { PropertyAddress } from '../../../common/property'
import { getDbConnection } from './../../lib/db'
import { saveContractInfoTestdata, clearData } from './../../lib/test-data'
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
	describe('isExistencePropertyAddress', () => {
		beforeAll(async (done) => {
			await savePropertyMetaTestdata(con.connection)
			done()
		})
		it('Addresses that are not in the property group.', async () => {
			const target = '0x3BEE6e097758aA532FaA2ba72D7730B85218594c'
			let result = propertyAddress.isSet(target)
			expect(result).toBe(false)
			result = await propertyAddress.isExistencePropertyAddress(target)
			expect(result).toBe(false)
			result = propertyAddress.isSet(target)
			expect(result).toBe(false)
		})
		it('Address of the property group.', async () => {
			const target = '0xD27399E30822E6e4CaB1B6c34d6c78ea1E01BF61'
			let result = propertyAddress.isSet(target)
			expect(result).toBe(false)
			result = await propertyAddress.isExistencePropertyAddress(target)
			expect(result).toBe(true)
			result = propertyAddress.isSet(target)
			expect(result).toBe(true)
		})
		it('address is lower case.', async () => {
			const target = '0xd27399e30822e6e4cab1b6c34d6c78ea1e01bf61'
			let result = propertyAddress.isSet(target)
			expect(result).toBe(false)
			result = await propertyAddress.isExistencePropertyAddress(target)
			expect(result).toBe(true)
			result = propertyAddress.isSet(target)
			expect(result).toBe(true)
		})
	})
})

async function savePropertyMetaTestdata(con: Connection): Promise<void> {
	await clearData(con, PropertyMeta)
	const transaction = new Transaction(con)
	await transaction.start()
	const propertyMeta = new PropertyMeta()

	propertyMeta.author = 'dummy-auther'
	propertyMeta.property = '0xD27399E30822E6e4CaB1B6c34d6c78ea1E01BF61'
	propertyMeta.sender = 'dummy-sender'
	propertyMeta.block_number = 36
	propertyMeta.name = 'dummy-name'
	propertyMeta.symbol = 'dummy-symbol'

	await transaction.save(propertyMeta)

	await transaction.commit()

	await transaction.finish()
}
