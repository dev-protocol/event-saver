import { AzureFunction, Context } from '@azure/functions'
import { ObjectType } from 'typeorm'
import { EventSaver } from '../common/event-save'
import { MarketFactoryCreate } from '../entities/market-factory-create'

class CreateEventSaver extends EventSaver {
	getModelObject<Entity>(): ObjectType<Entity> {
		return MarketFactoryCreate
	}

	getSaveData(event: Map<string, any>): any {
		const metricsFactoryCreate = new MarketFactoryCreate()
		const values = event.get('returnValues')
		metricsFactoryCreate.from_address = values._from
		metricsFactoryCreate.market = values._market
		return metricsFactoryCreate
	}

	getContractName(): string {
		return 'MarketFactory'
	}

	getBatchName(): string {
		return 'market-factory-create'
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
