import { AzureFunction, Context } from '@azure/functions'
import { ObjectType } from 'typeorm'
import { EventSaver } from '../common/event-save'
import { DevPropertyTransfer } from '../entities/dev-property-transfer'
import { PropertyAddress } from '../common/property'

class TransferEventSaver extends EventSaver {
	private _propertyAddress: PropertyAddress

	async setup(): Promise<void> {
		this._propertyAddress = new PropertyAddress(this._db, this._web3)
		await this._propertyAddress.setup()
	}

	async isTargetEvent(event: Map<string, any>): Promise<boolean> {
		const values = event.get('returnValues')
		let isPropertyAddressFrom = await this._propertyAddress.isExistencePropertyAddress(
			values.from
		)
		if (!isPropertyAddressFrom) {
			isPropertyAddressFrom = await this._propertyAddress.isPropertyAddress(
				values.from
			)
		}

		let isPropertyAddressTo = await this._propertyAddress.isExistencePropertyAddress(
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
		devPropertyTransfer.is_from_address_property = this._propertyAddress.isSet(
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

const timerTrigger: AzureFunction = async function (
	context: Context,
	myTimer: any
): Promise<void> {
	const saver = new TransferEventSaver(context, myTimer)
	await saver.execute()
}

export default timerTrigger
