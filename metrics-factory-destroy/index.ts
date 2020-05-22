import { AzureFunction, Context } from '@azure/functions'
import { ObjectType } from 'typeorm'
import { EventSaver } from '../common/event-save'
import { MetricsFactoryDestroy } from '../entities/metrics-factory-destroy'

class DestroyEventSaver extends EventSaver {
	getModelObject<Entity>(): ObjectType<Entity> {
		return MetricsFactoryDestroy
	}

	getSaveData(event: Map<string, any>): any {
		const metricsFactoryDestroy = new MetricsFactoryDestroy()
		const values = event.get('returnValues')
		metricsFactoryDestroy.from_address = values._from
		metricsFactoryDestroy.metrics = values._metrics
		return metricsFactoryDestroy
	}

	getContractName(): string {
		return 'MetricsFactory'
	}

	getBatchName(): string {
		return 'metrics-factory-destroy'
	}

	getEventName(): string {
		return 'Destroy'
	}
}

const timerTrigger: AzureFunction = async function (
	context: Context,
	myTimer: any
): Promise<void> {
	const saver = new DestroyEventSaver(context, myTimer)
	await saver.execute()
}

export default timerTrigger
