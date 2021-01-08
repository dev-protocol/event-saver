import { AzureFunction, Context } from '@azure/functions'
import { ObjectType } from 'typeorm'
import { EventSaver } from '../common/event-save'
import { PropertyDirectoryFactoryCreate } from '../entities/property-directory-factory-create'

class PropertyDirectoryFactoryCreateEventSaver extends EventSaver {
	getModelObject<Entity>(): ObjectType<Entity> {
		return PropertyDirectoryFactoryCreate
	}

	getSaveData(event: Map<string, any>): any {
		const propertyDirectoryFactoryCreate = new PropertyDirectoryFactoryCreate()
		const values = event.get('returnValues')
		propertyDirectoryFactoryCreate.property_directory = values._propertyDirectory
		propertyDirectoryFactoryCreate.author = values._author
		propertyDirectoryFactoryCreate.name = values._name
		propertyDirectoryFactoryCreate.symbol = values._symbol
		return propertyDirectoryFactoryCreate
	}

	getContractName(): string {
		return 'PropertyDirectoryFactory'
	}

	getBatchName(): string {
		return 'property-directory-factory-create'
	}

	getEventName(): string {
		return 'Create'
	}
}

const timerTrigger: AzureFunction = async function (
	context: Context,
	myTimer: any
): Promise<void> {
	const saver = new PropertyDirectoryFactoryCreateEventSaver(context, myTimer)
	await saver.execute()
}

export default timerTrigger
