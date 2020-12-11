import Web3 from 'web3'
import { EventData } from 'web3-eth-contract/types'
import * as lodashfrom from 'lodash'
import { formatTransferEvent } from '../../../../common/block-chain/format'
import { ZERO_ADDRESS } from '../../../../common/block-chain/utils'

describe('splitMintEvent', () => {
	const [user1, user2, user3, user4] = generateTestAddress()
	it('No error is raised when an empty array is passed.', async () => {
		const generator = new EventDataGenerator()
		const [balanceinfo, blockNumber] = formatTransferEvent(generator.data)
		expect(balanceinfo.size).toBe(0)
		expect(blockNumber.size).toBe(0)
	})
	it('If you mint it only once.', async () => {
		const generator = new EventDataGenerator()
		generator.addMintTransfer(user1, 1234567890, 163200)
		const [balanceinfo, blockNumber] = formatTransferEvent(generator.data)
		expect(balanceinfo.get(user1)).toBe(1234567890)
		expect(blockNumber.get(user1)).toBe(163200)
	})
	it('If you mint twice.', async () => {
		const generator = new EventDataGenerator()
		generator.addMintTransfer(user1, 1234567890, 163200)
		generator.addMintTransfer(user2, 7463547, 163500)
		const [balanceinfo, blockNumber] = formatTransferEvent(generator.data)
		expect(balanceinfo.get(user1)).toBe(1234567890)
		expect(blockNumber.get(user1)).toBe(163200)
		expect(balanceinfo.get(user2)).toBe(7463547)
		expect(blockNumber.get(user2)).toBe(163500)
	})
	it('If the minted destination is duplicated.', async () => {
		const generator = new EventDataGenerator()
		generator.addMintTransfer(user1, 1234567890, 163200)
		generator.addMintTransfer(user1, 7463547, 163500)
		const [balanceinfo, blockNumber] = formatTransferEvent(generator.data)
		expect(balanceinfo.get(user1)).toBe(1234567890 + 7463547)
		expect(blockNumber.get(user1)).toBe(163500)
	})
	it('If you mint and then transfer.', async () => {
		const generator = new EventDataGenerator()
		generator.addMintTransfer(user1, 1234567890, 163200)
		generator.addTransfer(user1, user2, 7463547, 163500)
		const [balanceinfo, blockNumber] = formatTransferEvent(generator.data)
		expect(balanceinfo.get(user1)).toBe(1234567890 - 7463547)
		expect(blockNumber.get(user1)).toBe(163500)
		expect(balanceinfo.get(user2)).toBe(7463547)
		expect(blockNumber.get(user2)).toBe(163500)
	})
	it('If you transfer after multiple mint.', async () => {
		const generator = new EventDataGenerator()
		generator.addMintTransfer(user1, 1234567890, 163200)
		generator.addMintTransfer(user2, 7463547, 163500)
		generator.addTransfer(user1, user3, 150000, 164500)
		generator.addTransfer(user3, user4, 100000, 165500)
		const [balanceinfo, blockNumber] = formatTransferEvent(generator.data)
		expect(balanceinfo.get(user1)).toBe(1234567890 - 150000)
		expect(blockNumber.get(user1)).toBe(164500)
		expect(balanceinfo.get(user2)).toBe(7463547)
		expect(blockNumber.get(user2)).toBe(163500)
		expect(balanceinfo.get(user3)).toBe(150000 - 100000)
		expect(blockNumber.get(user3)).toBe(165500)
		expect(balanceinfo.get(user4)).toBe(100000)
		expect(blockNumber.get(user4)).toBe(165500)
	})
})

function generateTestAddress(): string[] {
	const addresses = []
	const web3 = new Web3()
	for (let i = 0; i < 10; i++) {
		const account = web3.eth.accounts.create()
		addresses.push(account.address)
	}

	return addresses
}

class EventDataGenerator {
	static readonly TEMPLATE: EventData = {
		returnValues: {},
		raw: {
			data: '',
			topics: [''],
		},
		event: '',
		signature: '',
		logIndex: 0,
		transactionIndex: 0,
		transactionHash: '',
		blockHash: '',
		blockNumber: 0,
		address: '',
	}

	private readonly testData: EventData[] = []
	public addMintTransfer(to: string, value: number, blockNumber: number) {
		this.addTransfer(ZERO_ADDRESS, to, value, blockNumber)
	}

	public addTransfer(
		from: string,
		to: string,
		value: number,
		blockNumber: number
	) {
		const data = lodashfrom.cloneDeep(EventDataGenerator.TEMPLATE) as EventData
		data.returnValues = {
			from: from,
			to: to,
			value: value,
		}
		data.blockNumber = blockNumber
		this.testData.push(data)
	}

	get data(): EventData[] {
		return this.testData
	}
}
