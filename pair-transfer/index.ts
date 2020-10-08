import { AzureFunction, Context } from '@azure/functions'
import { ObjectType } from 'typeorm'
import { EventSaver } from '../common/event-save'
import { PairTransfer } from '../entities/pair-transfer'

class TransferEventSaver extends EventSaver {
	getModelObject<Entity>(): ObjectType<Entity> {
		return PairTransfer
	}

	getSaveData(event: Map<string, any>): any {
		const pairrTransfer = new PairTransfer()
		const values = event.get('returnValues')
		pairrTransfer.from_address = values.from
		pairrTransfer.to_address = values.to
		pairrTransfer.token_value = values.value
		return pairrTransfer
	}

	getContractName(): string {
		return 'Pair'
	}

	getBatchName(): string {
		return 'pair-transfer'
	}

	getEventName(): string {
		return 'Transfer'
	}
}

const timerTrigger: AzureFunction = async function (
	context: Context,
	myTimer: any
): Promise<void> {
	const saver = new TransferEventSaver(context, myTimer)
	await saver.execute()
}

export default timerTrigger
