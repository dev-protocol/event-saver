import { AzureFunction, Context } from '@azure/functions'
import { Connection, ObjectType } from 'typeorm'
import { LockupInfoCreator } from '../common/lockup'
import { PropertyLockup } from '../entities/property_lockup'

class PropertyLockupCreator extends LockupInfoCreator {
	getBatchName(): string {
		return 'property-lockup'
	}

	getModelObject<Entity>(): ObjectType<Entity> {
		return PropertyLockup
	}

	async getOldRecord(
		con: Connection,
		accountAddress: string,
		propertyAddress: string
	): Promise<any> {
		const repository = con.getRepository(this.getModelObject())

		const findRecords = await repository.findOne({
			account_address: accountAddress,
			property_address: propertyAddress,
		})
		if (typeof findRecords === 'undefined') {
			return undefined
		}

		return findRecords
	}

	getModel(): any {
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
