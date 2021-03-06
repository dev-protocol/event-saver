import { Connection } from 'typeorm'
import { EventData } from 'web3-eth-contract/types'
import { DbConnection } from './db/common'
import { getContractInfo } from './db/contract-info'
import { PropertyMeta } from '../entities/property-meta'
import { getPropertyInstance } from '../common/block-chain/utils'

/* eslint-disable @typescript-eslint/no-var-requires */
const Web3 = require('web3')

export class PropertyAddress {
	private readonly _db: DbConnection
	private readonly _web3: any
	private readonly _propertySet: Set<string>
	private _propertyGroupInstance: any
	constructor(db: DbConnection, web3: any) {
		this._db = db
		this._web3 = web3
		this._propertySet = new Set<string>()
	}

	public async setup(): Promise<void> {
		const propertyGroupInfo = await getContractInfo(
			this._db.connection,
			'PropertyGroup'
		)
		this._propertyGroupInstance = await new this._web3.eth.Contract(
			JSON.parse(propertyGroupInfo.abi),
			propertyGroupInfo.address
		)
		const records = await this._db.connection
			.getRepository(PropertyMeta)
			.createQueryBuilder('tmp')
			.getMany()
		records.forEach((record) => {
			const checkedAddress = Web3.utils.toChecksumAddress(record.property)
			this._propertySet.add(checkedAddress)
		})
	}

	public isSet(address: string): boolean {
		const checkedAddress = Web3.utils.toChecksumAddress(address)
		return this._propertySet.has(checkedAddress)
	}

	public async isPropertyAddress(address: string): Promise<boolean> {
		const checkedAddress = Web3.utils.toChecksumAddress(address)
		const result = await this._propertyGroupInstance.methods
			.isGroup(checkedAddress)
			.call()
		if (result) {
			this._propertySet.add(checkedAddress)
		}

		return result
	}
}

export class PropertyData {
	private readonly web3: any
	private readonly con: Connection
	private readonly propertyAddress: string
	private propertyInstance: any
	private record: PropertyMeta

	constructor(_web3: any, _con: Connection, _propertyAddress: string) {
		this.web3 = _web3
		this.con = _con
		this.propertyAddress = _propertyAddress
	}

	public async load(): Promise<void> {
		this.propertyInstance = await getPropertyInstance(
			this.con,
			this.web3,
			this.propertyAddress
		)
		this.record = await getPropertyMeta(this.con, this.propertyAddress)
	}

	public async getAuthor(): Promise<string> {
		const author = await this.propertyInstance.methods.author().call()

		return author
	}

	public async hasAllTokenByAuthor(): Promise<boolean> {
		const author = await this.getAuthor()
		const authorBalance = await this.propertyInstance.methods
			.balanceOf(author)
			.call()
		const totalSupply = this.record.total_supply
		return Number(totalSupply) === Number(authorBalance)
	}

	public async getTransferEvent(endBlock: number): Promise<EventData[]> {
		const startBlock = this.record.block_number
		const events = await this.propertyInstance.getPastEvents('Transfer', {
			fromBlock: startBlock - 1,
			toBlock: endBlock,
		})
		return events
	}
}

export async function getPropertyMeta(
	con: Connection,
	address: string
): Promise<PropertyMeta> {
	const repository = con.getRepository(PropertyMeta)
	const record = await repository.findOneOrFail({
		property: address,
	})
	return record
}
