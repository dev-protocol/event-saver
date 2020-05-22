import { AzureFunction, Context } from '@azure/functions'
import { ObjectType } from 'typeorm'
import { EventSaver } from '../common/event-save'
import { PolicyFactoryCreate } from '../entities/policy-factory-create'

class CreateEventSaver extends EventSaver {
	getModelObject<Entity>(): ObjectType<Entity> {
		return PolicyFactoryCreate
	}

	getSaveData(event: Map<string, any>): any {
		const policyFactoryCreate = new PolicyFactoryCreate()
		const values = event.get('returnValues')
		policyFactoryCreate.from_address = values._from
		policyFactoryCreate.policy_address = values._policy
		policyFactoryCreate.inner_policy = values._innerPolicy
		return policyFactoryCreate
	}

	getContractName(): string {
		return 'PolicyFactory'
	}

	getBatchName(): string {
		return 'policy-factory-create'
	}

	getEventName(): string {
		return 'Create'
	}
}

const timerTrigger: AzureFunction = async function (
	context: Context,
	myTimer: any
): Promise<void> {
	const saver = new CreateEventSaver(context, myTimer)
	await saver.execute()
}

export default timerTrigger
