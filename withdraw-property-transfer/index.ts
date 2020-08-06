import { AzureFunction, Context } from '@azure/functions'
import { ObjectType } from 'typeorm'
import { EventSaver } from '../common/event-save'
import { WithdrawPropertyTransfer } from '../entities/withdraw-property_transfer'

class PropertyTransferEventSaver extends EventSaver {
	getModelObject<Entity>(): ObjectType<Entity> {
		return WithdrawPropertyTransfer
	}

	getSaveData(event: Map<string, any>): any {
		const withdrawPropertyTransfer = new WithdrawPropertyTransfer()
		const values = event.get('returnValues')
		withdrawPropertyTransfer.property_address = values._property
		withdrawPropertyTransfer.from_address = values._from
		withdrawPropertyTransfer.to_address = values._to
		return withdrawPropertyTransfer
	}

	getContractName(): string {
		return 'Withdraw'
	}

	getBatchName(): string {
		return 'withdraw-property-transfer'
	}

	getEventName(): string {
		return 'Transfer'
	}
}

const timerTrigger: AzureFunction = async function (
	context: Context,
	myTimer: any
): Promise<void> {
	const saver = new PropertyTransferEventSaver(context, myTimer)
	await saver.execute()
}

export default timerTrigger
