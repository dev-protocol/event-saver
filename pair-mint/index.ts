import { AzureFunction, Context } from '@azure/functions'
import { ObjectType } from 'typeorm'
import { EventSaver } from '../common/event-save'
import { PairMint } from '../entities/pair-mint'

class MintEventSaver extends EventSaver {
	getModelObject<Entity>(): ObjectType<Entity> {
		return PairMint
	}

	getSaveData(event: Map<string, any>): any {
		const pairrMint = new PairMint()
		const values = event.get('returnValues')
		pairrMint.sender = values.sender
		pairrMint.amount0 = values.amount0
		pairrMint.amount1 = values.amount1
		return pairrMint
	}

	getContractName(): string {
		return 'Pair'
	}

	getBatchName(): string {
		return 'pair-mint'
	}

	getEventName(): string {
		return 'Mint'
	}
}

const timerTrigger: AzureFunction = async function (
	context: Context,
	myTimer: any
): Promise<void> {
	const saver = new MintEventSaver(context, myTimer)
	await saver.execute()
}

export default timerTrigger
