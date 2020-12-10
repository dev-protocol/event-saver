import { EventData } from 'web3-eth-contract/types'
import { ZERO_ADDRESS } from '../block-chain/utils'

export function formatTransferEvent(
	events: EventData[]
): [Map<string, number>, Map<string, number>] {
	const balanceinfo = new Map<string, number>()
	const blockNumber = new Map<string, number>()
	const [mintInfo, transferInfo] = splitMintEvent(events)
	for (let mint of mintInfo) {
		balanceinfo.set(mint.returnValues.to, mint.returnValues.value)
		blockNumber.set(mint.returnValues.to, mint.blockNumber)
	}

	for (let transfer of transferInfo) {
		const fromBalance = balanceinfo.get(transfer.returnValues.from)
		const toBalance =
			typeof balanceinfo.get(transfer.returnValues.to) === 'undefined'
				? 0
				: balanceinfo.get(transfer.returnValues.to)
		balanceinfo.set(
			transfer.returnValues.from,
			fromBalance - Number(transfer.returnValues.value)
		)
		balanceinfo.set(
			transfer.returnValues.to,
			toBalance + Number(transfer.returnValues.value)
		)
		blockNumber.set(transfer.returnValues.from, transfer.blockNumber)
		blockNumber.set(transfer.returnValues.to, transfer.blockNumber)
	}

	return [balanceinfo, blockNumber]
}

function splitMintEvent(events: EventData[]): [EventData[], EventData[]] {
	const mint = []
	const transfer = []
	for (let event of events) {
		const values = event.returnValues
		if (values.from === ZERO_ADDRESS) {
			mint.push(event)
		} else {
			transfer.push(event)
		}
	}

	return [mint, transfer]
}
