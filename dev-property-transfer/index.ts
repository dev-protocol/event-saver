import { AzureFunction, Context } from '@azure/functions'
import { ObjectType } from 'typeorm'
/* eslint-disable @typescript-eslint/no-var-requires */
const Web3 = require('web3')
import { EventSaver } from '../common/event-save'
import { getContractInfo } from '../common/db/contract-info'
import { DbConnection } from '../common/db/common'
import { DevPropertyTransfer } from '../entities/dev-property-transfer'

class DevPropertySaver extends EventSaver {
	private _propertyAddress: PropertyAddress
	async setup(): Promise<void> {
		this._propertyAddress = new PropertyAddress(this._db)
		await this._propertyAddress.setup()
	}

	async isTargetEvent(event: Map<string, any>): Promise<boolean> {
		const values = event.get('returnValues')
		let isPropertyAddressFrom = this._propertyAddress.isExistencePropertyAddress(
			values.from
		)
		if (!isPropertyAddressFrom) {
			isPropertyAddressFrom = await this._propertyAddress.isPropertyAddress(
				values.from
			)
		}

		let isPropertyAddressTo = this._propertyAddress.isExistencePropertyAddress(
			values.to
		)
		if (!isPropertyAddressTo) {
			isPropertyAddressTo = await this._propertyAddress.isPropertyAddress(
				values.to
			)
		}

		if (isPropertyAddressFrom && isPropertyAddressTo) {
			return false
		}

		if (isPropertyAddressFrom) {
			return true
		}

		if (isPropertyAddressTo) {
			return true
		}

		return false
	}

	getModelObject<Entity>(): ObjectType<Entity> {
		return DevPropertyTransfer
	}

	getSaveData(event: Map<string, any>): any {
		const devPropertyTransfer = new DevPropertyTransfer()
		const values = event.get('returnValues')
		devPropertyTransfer.from_address = values.from
		devPropertyTransfer.to_address = values.to
		devPropertyTransfer.value = values.value
		devPropertyTransfer.is_from_address_property = this._propertyAddress.isExistencePropertyAddress(
			values.from
		)
		return devPropertyTransfer
	}

	getContractName(): string {
		return 'Dev'
	}

	getBatchName(): string {
		return 'dev-property-transfer'
	}

	getEventName(): string {
		return 'Transfer'
	}
}

class PropertyAddress {
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

	public isExistencePropertyAddress(address: string): boolean {
		return this._propertySet.has(address)
	}

	public async isPropertyAddress(address: string): Promise<boolean> {
		if (this._propertyGroupInstance.methods.isGroup(address)) {
			this._propertySet.add(address)
			return true
		}

		return false
	}
}

const timerTrigger: AzureFunction = async function (
	context: Context,
	myTimer: any
): Promise<void> {
	const saver = new DevPropertySaver(context, myTimer)
	await saver.execute()
}

export default timerTrigger
