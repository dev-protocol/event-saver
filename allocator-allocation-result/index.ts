import { AzureFunction, Context } from '@azure/functions'
import { ObjectType } from 'typeorm'
import { EventSaver } from '../common/event-save'
import { AllocatorAllocationResult } from '../entities/allocator-allocation-result'

class AllocationResultEventSaver extends EventSaver {
	getModelObject<Entity>(): ObjectType<Entity> {
		return AllocatorAllocationResult
	}

	getSaveData(event: Map<string, any>): any {
		const allocationResult = new AllocatorAllocationResult()
		const values = event.get('returnValues')
		allocationResult.metrics = values._metrics
		allocationResult.arg_value = values._value
		allocationResult.market = values._market
		allocationResult.property = values._property
		allocationResult.lockup_value = values._lockupValue
		allocationResult.result = values._result

		return allocationResult
	}

	getContractName(): string {
		return 'Allocator'
	}

	getBatchName(): string {
		return 'allocator-allocation-result'
	}

	getEventName(): string {
		return 'AllocationResult'
	}
}

const timerTrigger: AzureFunction = async function (
	context: Context,
	myTimer: any
): Promise<void> {
	const saver = new AllocationResultEventSaver(context, myTimer)
	await saver.execute()
}

export default timerTrigger
