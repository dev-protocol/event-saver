import { DbConnection } from '../../../../common/db/common'
import { getDbConnection } from '../../../lib/db'
import {
	saveGroupContractInfoTestdata,
	clearData,
	saveContractInfoTestdata,
	updateGroupContractInfoTestdata,
} from '../../../lib/test-data'
import {
	getApprovalBlockNumber,
	getPropertyByMetrics,
	getPolicyInstance,
	getAuthenticationIdByMetrics,
	getPropertyInstance,
} from '../../../../common/block-chain/utils'
import { ContractInfo } from '../../../../entities/contract-info'
import { GroupContractInfo } from '../../../../entities/group-contract-info'

describe('getApprovalBlockNumber', () => {
	class Web3GetBlockNumberMock {
		eth: any
		constructor(_: any) {
			this.eth = {
				// eslint-disable-next-line @typescript-eslint/promise-function-async
				getBlockNumber: function () {
					return new Promise((resolve) => {
						resolve(25000)
					})
				},
			}
		}
	}
	it('Get the block number to be approved.', async () => {
		process.env.APPROVAL = '50'
		const web3 = new Web3GetBlockNumberMock({})
		const result = await getApprovalBlockNumber(web3)
		expect(result).toBe(24950)
	})
})

describe('getPropertyByMetrics', () => {
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
						this.methods.property = function () {
							return {
								call: async function (): Promise<string> {
									return '0x54E575848E4b62a1a3aaBd09380f73Fc2d6758CA'
								},
							}
						}
					}
				},
			}
		}
	}
	let con: DbConnection
	beforeAll(async (done) => {
		con = await getDbConnection()
		done()
	})
	afterAll(async (done) => {
		await con.quit()
		done()
	})
	it('can get a property address from a metrics address.', async () => {
		await saveGroupContractInfoTestdata(con.connection)
		const web3 = new Web3PropertyCallMock('hoge')
		const result = await getPropertyByMetrics(
			con.connection,
			web3,
			'0x0e0eA88eC1bCC0A67B6514887C490a57e6714Fb8'
		)

		expect(result).toBe('0x54E575848E4b62a1a3aaBd09380f73Fc2d6758CA')
	})
	it('If the contract information does not exist, an error is returned.', async () => {
		await clearData(con.connection, GroupContractInfo)
		const web3 = new Web3PropertyCallMock('hoge')
		const promise = getPropertyByMetrics(
			con.connection,
			web3,
			'0x0e0eA88eC1bCC0A67B6514887C490a57e6714Fb8'
		)

		await expect(promise).rejects.toThrowError(
			new Error('metrics info is not found')
		)
	})
})

describe('getAuthenticationIdByMetrics', () => {
	class Web3Mock {
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
						this.methods.getId = function () {
							return {
								call: async function (): Promise<string> {
									return 'authentication-id'
								},
							}
						}

						this.methods.getPackage = function () {
							return {
								call: async function (): Promise<string> {
									return 'authentication-id-package'
								},
							}
						}

						this.methods.behavior = function () {
							return {
								call: async function (): Promise<string> {
									return '0x54E575848E4b62a1a3aaBd09380f73Fc2d6758CA'
								},
							}
						}
					}
				},
			}
		}
	}
	let con: DbConnection
	beforeAll(async (done) => {
		con = await getDbConnection()
		done()
	})
	afterAll(async (done) => {
		await con.quit()
		done()
	})
	it('In the case of a normal Market, execute the getId function to obtain an authentication ID.', async () => {
		await saveGroupContractInfoTestdata(con.connection)
		const web3 = new Web3Mock('hoge')
		const authenticationId = await getAuthenticationIdByMetrics(
			con.connection,
			web3,
			'dummy-market-address',
			'dummy-metrics-address'
		)
		expect(authenticationId).toBe('authentication-id')
	})
	it('In the case of the old Market, run the getPackage function to get the authentication ID.', async () => {
		await saveGroupContractInfoTestdata(con.connection)
		await updateGroupContractInfoTestdata(
			con.connection,
			'IMarketBehavior',
			'[{"constant":true,"inputs":[{"internalType":"address","name":"_metrics","type":"address"}],"name":"getPackage","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"}]'
		)
		const web3 = new Web3Mock('hoge')
		const authenticationId = await getAuthenticationIdByMetrics(
			con.connection,
			web3,
			'dummy-market-address',
			'dummy-metrics-address'
		)
		expect(authenticationId).toBe('authentication-id-package')
	})
})

describe('getPolicyInstance', () => {
	class Web3Mock {
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
						this.methods.policy = function () {
							return {
								call: async function (): Promise<string> {
									return '0x54E575848E4b62a1a3aaBd09380f73Fc2d6758CA'
								},
							}
						}
					}

					get address(): string {
						return this._address
					}
				},
			}
		}
	}
	let con: DbConnection
	beforeAll(async (done) => {
		con = await getDbConnection()
		done()
	})
	afterAll(async (done) => {
		await con.quit()
		done()
	})
	it('If the information of AddressConfig does not exist, an error occurs.', async () => {
		await clearData(con.connection, ContractInfo)
		const web3 = new Web3Mock('hoge')
		const promise = getPolicyInstance(con.connection, web3)
		await expect(promise).rejects.toThrowError(
			new Error('AddressConfig contract info is not found.')
		)
	})
	it('If the information of Policy does not exist, an error occurs.', async () => {
		await saveContractInfoTestdata(con.connection)
		await clearData(con.connection, GroupContractInfo)
		const web3 = new Web3Mock('hoge')
		const promise = getPolicyInstance(con.connection, web3)
		await expect(promise).rejects.toThrowError(
			new Error('target contract info is not found.')
		)
	})
	it('If the information of Policy exist, return. PolicyInstance returns', async () => {
		await saveContractInfoTestdata(con.connection)
		await saveGroupContractInfoTestdata(con.connection)
		const web3 = new Web3Mock('hoge')
		const policyInstance = await getPolicyInstance(con.connection, web3)
		expect(policyInstance.address).toBe(
			'0x54E575848E4b62a1a3aaBd09380f73Fc2d6758CA'
		)
	})
})

describe('getPropertyInstance', () => {
	class Web3Mock {
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
					}

					get address(): string {
						return this._address
					}
				},
			}
		}
	}
	let con: DbConnection
	beforeAll(async (done) => {
		con = await getDbConnection()
		done()
	})
	afterAll(async (done) => {
		await con.quit()
		done()
	})
	it('If the information of property does not exist, an error occurs.', async () => {
		await clearData(con.connection, GroupContractInfo)
		const web3 = new Web3Mock('hoge')
		const promise = getPropertyInstance(
			con.connection,
			web3,
			'dummy-property-address'
		)
		await expect(promise).rejects.toThrowError(
			new Error('Property contract info is not found.')
		)
	})
	it('If the information of property exist, return. PropertyInstance returns', async () => {
		await saveGroupContractInfoTestdata(con.connection)
		const web3 = new Web3Mock('hoge')
		const propertyInstance = await getPropertyInstance(
			con.connection,
			web3,
			'dummy-property-address'
		)
		expect(propertyInstance.address).toBe('dummy-property-address')
	})
})
