import { AzureFunction, Context } from '@azure/functions'
import { ObjectType } from 'typeorm'
import { EventSaver } from '../common/event-save'
import { LockupLockedup } from '../entities/lockup-lockedup'

class LockupdEventSaver extends EventSaver {
	getModelObject<Entity>(): ObjectType<Entity> {
		return LockupLockedup
	}

	getSaveData(event: Map<string, any>): any {
		const lockupLockedup = new LockupLockedup()
		const values = event.get('returnValues')
		lockupLockedup.from_address = values._from
		lockupLockedup.property = values._property
		lockupLockedup.token_value = values._value
		return lockupLockedup
	}

	getContractName(): string {
		return 'Lockup'
	}

	getBatchName(): string {
		return 'lockup-lockedup'
	}

	getEventName(): string {
		return 'Lockedup'
	}
}

const timerTrigger: AzureFunction = async function (
	context: Context,
	myTimer: any
): Promise<void> {
	const saver = new LockupdEventSaver(context, myTimer)
	await saver.execute()
}

export default timerTrigger
