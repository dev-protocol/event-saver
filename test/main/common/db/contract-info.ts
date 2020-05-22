import { DbConnection } from '../../../../common/db/common'
import {
	getContractInfo,
	getGroupContractInfo,
	getLegacyGroupContractInfo,
} from '../../../../common/db/contract-info'
import { getDbConnection } from './../../../lib/db'
import {
	saveContractInfoTestdata,
	saveGroupContractInfoTestdata,
	saveLegacyGroupContractInfoTestdata,
} from './../../../lib/test-data'

describe('getContractInfo', () => {
	let con: DbConnection
	beforeAll(async (done) => {
		con = await getDbConnection()
		done()
	})
	afterAll(async (done) => {
		await con.quit()
		done()
	})
	it('If the target record exists, the contract meta-information of the corresponding contract can be retrieved.', async () => {
		await saveContractInfoTestdata(con.connection)
		const record = await getContractInfo(con.connection, 'AddressConfig')
		expect(record.address).toBe('0x152437ababab')
		expect(record.abi).toBe(
			'[{"inputs": [{"internalType": "address","name": "_config","type": "string"}]}]'
		)
	})
	it('If the target record does not exist, the contract meta information of the corresponding contract cannot be retrieved.', async () => {
		await saveContractInfoTestdata(con.connection)
		const record = await getContractInfo(con.connection, 'dummy')
		expect(record).toBe(undefined)
	})
})

describe('getGroupContractInfo', () => {
	let con: DbConnection
	beforeAll(async (done) => {
		con = await getDbConnection()
		done()
	})
	afterAll(async (done) => {
		await con.quit()
		done()
	})
	it('If the target record exists, the group contract meta-information of the corresponding contract can be retrieved.', async () => {
		await saveGroupContractInfoTestdata(con.connection)
		const record = await getGroupContractInfo(con.connection, 'dummy-name-2')
		expect(record.abi).toBe(
			'[{"inputs": [{"internalType": "address","name": "_config","type": "address"}]}]'
		)
	})
	it('If the target record does not exist, the group contract meta information of the corresponding contract cannot be retrieved.', async () => {
		const record = await getGroupContractInfo(con.connection, 'dummy')
		expect(record).toBe(undefined)
	})
})

describe('getLegacyGroupContractInfo', () => {
	let con: DbConnection
	beforeAll(async (done) => {
		con = await getDbConnection()
		done()
	})
	afterAll(async (done) => {
		await con.quit()
		done()
	})
	it('If the target record exists, the legacy group contract meta-information of the corresponding contract can be retrieved.', async () => {
		await saveLegacyGroupContractInfoTestdata(con.connection)
		const record = await getLegacyGroupContractInfo(
			con.connection,
			'dummy-name-2',
			'0x152437cdcdcd'
		)
		expect(record.address).toBe('0x152437cdcdcd')
		expect(record.abi).toBe(
			'[{"inputs": [{"internalType": "address","name": "_config","type": "address"}]}]'
		)
	})
	it('If the target record does not exist, the legacy group contract meta information of the corresponding contract cannot be retrieved.', async () => {
		const record = await getLegacyGroupContractInfo(
			con.connection,
			'dummy',
			'dummy-addres'
		)
		expect(record).toBe(undefined)
	})
})
