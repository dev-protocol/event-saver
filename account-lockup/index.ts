import { AzureFunction, Context } from '@azure/functions'
import { EntityManager } from 'typeorm'
import { LockupInfoCreator } from '../common/lockup'
import { AccountLockup } from '../entities/account-lockup'

class AccountLockupCreator extends LockupInfoCreator {
	getBatchName(): string {
		return 'account-lockup'
	}

	async getOldRecord(
		manager: EntityManager,
		accountAddress: string,
		propertyAddress: string
	): Promise<any> {
		const findRecord = await manager.findOne(AccountLockup, {
			account_address: accountAddress,
			property_address: propertyAddress,
		})

		if (typeof findRecord === 'undefined') {
			return undefined
		}

		return findRecord
	}

	getModel(): any {
		return new AccountLockup()
	}
}

const timerTrigger: AzureFunction = async function (
	context: Context,
	myTimer: any
): Promise<void> {
	const dataCreator = new AccountLockupCreator(context, myTimer)
	await dataCreator.execute()
}

export default timerTrigger
