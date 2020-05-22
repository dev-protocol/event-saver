import { AzureFunction, Context } from '@azure/functions'
import { ObjectType } from 'typeorm'
import { EventSaver } from '../common/event-save'
import { MetricsFactoryCreate } from '../entities/metrics-factory-create'

class CreateEventSaver extends EventSaver {
	getModelObject<Entity>(): ObjectType<Entity> {
		return MetricsFactoryCreate
	}

	getSaveData(event: Map<string, any>): any {
		const metricsFactoryCreate = new MetricsFactoryCreate()
		const values = event.get('returnValues')
		metricsFactoryCreate.from_address = values._from
		metricsFactoryCreate.metrics = values._metrics
		return metricsFactoryCreate
	}

	getContractName(): string {
		return 'MetricsFactory'
	}

	getBatchName(): string {
		return 'metrics-factory-create'
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
