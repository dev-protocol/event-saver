import { DbConnection } from './db/common'
import { getContractInfo } from './db/contract-info'
import { PropertyMeta } from '../entities/property-meta'

/* eslint-disable @typescript-eslint/no-var-requires */
const Web3 = require('web3')

export class PropertyAddress {
	private readonly _db: DbConnection
	private readonly _propertySet: Set<string>
	private _propertyGroupInstance: any
	constructor(db: DbConnection) {
		this._db = db
		this._propertySet = new Set<string>()
	}

	public async setup(): Promise<void> {
		const web3 = new Web3(
			new Web3.providers.HttpProvider(process.env.WEB3_URL!)
		)
		const propertyGroupInfo = await getContractInfo(
			this._db.connection,
			'PropertyGroup'
		)
		this._propertyGroupInstance = await new web3.eth.Contract(
			JSON.parse(propertyGroupInfo.abi),
			propertyGroupInfo.address
		)
	}

	public isSet(address: string): boolean {
		const checkedAddress = Web3.utils.toChecksumAddress(address)
		return this._propertySet.has(checkedAddress)
	}

	public async isExistencePropertyAddress(address: string): Promise<boolean> {
		const checkedAddress = Web3.utils.toChecksumAddress(address)
		if (this._propertySet.has(checkedAddress)) {
			return true
		}

		const result = await this._existPropertyAddress(checkedAddress)
		if (result) {
			this._propertySet.add(checkedAddress)
		}

		return result
	}

	public async isPropertyAddress(address: string): Promise<boolean> {
		const checkedAddress = Web3.utils.toChecksumAddress(address)
		const result = await this._propertyGroupInstance.methods.isGroup(
			checkedAddress
		)
		if (result) {
			this._propertySet.add(checkedAddress)
		}

		return result
	}

	private async _existPropertyAddress(address: string): Promise<boolean> {
		const repository = this._db.connection.getRepository(PropertyMeta)
		const record = await repository.findOne({
			property: address,
		})
		return typeof record !== 'undefined'
	}
}
