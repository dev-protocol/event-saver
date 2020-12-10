import { EventData } from 'web3-eth-contract/types'
import { PropertyBalance } from '../../entities/property-balance'
import { formatTransferEvent } from '../block-chain/format'

export function formatTransferEventToPropertyBalance(
	propertyTransferEventData: EventData[],
	author: string,
	propertyAddress: string
): PropertyBalance[] {
	const [balance, blockNumber] = formatTransferEvent(propertyTransferEventData)
	const result = []
	balance.forEach(function (balance, account) {
		const record = new PropertyBalance()
		record.property_address = propertyAddress
		record.account_address = account
		record.balance = balance.toString()
		record.is_author = account === author
		record.block_number = blockNumber.get(account)
		result.push(record)
	})
	return result
}
