import { AzureFunction, Context } from '@azure/functions'
import { ObjectType } from 'typeorm'
import { EventSaver } from '../common/event-save'
import { PropertyDirectoryFactoryRecreate } from '../entities/property-directory-factory-recreate'

class PropertyDirectoryFactoryRecreateEventSaver extends EventSaver {
	getModelObject<Entity>(): ObjectType<Entity> {
		return PropertyDirectoryFactoryRecreate
	}

	getSaveData(event: Map<string, any>): any {
		const propertyDirectoryFactoryRecreate = new PropertyDirectoryFactoryRecreate()
		const values = event.get('returnValues')
		propertyDirectoryFactoryRecreate.old = values._old
		propertyDirectoryFactoryRecreate.new = values._new
		return propertyDirectoryFactoryRecreate
	}

	getContractName(): string {
		return 'PropertyDirectoryFactory'
	}

	getBatchName(): string {
		return 'property-directory-factory-recreate'
	}

	getEventName(): string {
		return 'Recreate'
	}
}

const timerTrigger: AzureFunction = async function (
	context: Context,
	myTimer: any
): Promise<void> {
	const saver = new PropertyDirectoryFactoryRecreateEventSaver(context, myTimer)
	await saver.execute()
}

export default timerTrigger
