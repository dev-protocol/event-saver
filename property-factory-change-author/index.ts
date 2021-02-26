import { AzureFunction, Context } from '@azure/functions'
import { ObjectType } from 'typeorm'
import { EventSaver } from '../common/event-save'
import { PropertyFactoryChangeAuthor } from '../entities/property-factory-change-author'

class CreateEventSaver extends EventSaver {
	getModelObject<Entity>(): ObjectType<Entity> {
		return PropertyFactoryChangeAuthor
	}

	getSaveData(event: Map<string, any>): any {
		const propertyFactoryChangeAuthor = new PropertyFactoryChangeAuthor()
		const values = event.get('returnValues')
		propertyFactoryChangeAuthor.property = values._property
		propertyFactoryChangeAuthor.before_author = values._beforeAuthor
		propertyFactoryChangeAuthor.after_author = values._afterAuthor
		return propertyFactoryChangeAuthor
	}

	getContractName(): string {
		return 'PropertyFactory'
	}

	getBatchName(): string {
		return 'property-factory-change-author'
	}

	getEventName(): string {
		return 'ChangeAuthor'
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
