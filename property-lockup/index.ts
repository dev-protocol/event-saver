import { AzureFunction, Context } from '@azure/functions'
import { EntityManager } from 'typeorm'
import { LockupInfoCreator } from '../common/lockup'
import { PropertyLockup } from '../entities/property-lockup'

class PropertyLockupCreator extends LockupInfoCreator {
	getBatchName(): string {
		return 'property-lockup'
	}

	async getOldRecord(
		manager: EntityManager,
		accountAddress: string,
		propertyAddress: string
	): Promise<PropertyLockup> {
		const findRecord = await manager.findOne(PropertyLockup, {
			account_address: accountAddress,
			property_address: propertyAddress,
		})

		if (typeof findRecord === 'undefined') {
			return undefined
		}

		return findRecord
	}

	getModel(): PropertyLockup {
		return new PropertyLockup()
	}
}

const timerTrigger: AzureFunction = async function (
	context: Context,
	myTimer: any
): Promise<void> {
	const dataCreator = new PropertyLockupCreator(context, myTimer)
	await dataCreator.execute()
}

export default timerTrigger
