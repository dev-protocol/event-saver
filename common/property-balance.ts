import { Connection } from 'typeorm'
import { EventData } from 'web3-eth-contract/types'
import { Transaction } from './db/common'
import { PropertyData } from './property'
import { PropertyBalance } from '../entities/property-balance'
import { formatTransferEventToPropertyBalance } from './db/format'

/* eslint-disable @typescript-eslint/no-var-requires */
const Web3 = require('web3')

export class PropertyBalanceAccessor {
	private readonly transaction: Transaction
	constructor(_transaction: Transaction) {
		this.transaction = _transaction
	}

	public async deleteRecord(propertyAddress: string) {
		const records = await this.transaction.manager.find(PropertyBalance, {
			property_address: propertyAddress,
		})
		for (let record of records) {
			// eslint-disable-next-line no-await-in-loop
			await this.transaction.remove(record)
		}
	}

	public async insertRecord(
		propertyTransferEventData: EventData[],
		propertyAddress: string,
		author: string
	): Promise<void> {
		if (propertyTransferEventData.length === 0) {
			throw new Error(`property balance record is 0: ${propertyAddress}`)
		}

		await this.deleteRecord(propertyAddress)
		const propertyBalanceRecords = formatTransferEventToPropertyBalance(
			propertyTransferEventData,
			author,
			propertyAddress
		)

		for (let record of propertyBalanceRecords) {
			// eslint-disable-next-line no-await-in-loop
			await this.transaction.save(record)
		}
	}
}

export async function createPropertyBalance(
	con: Connection,
	propertyAddress: string,
	endBlockNumber: number,
	transaction: Transaction
): Promise<void> {
	const propertyBalanceAccessor = new PropertyBalanceAccessor(transaction)
	const web3 = new Web3(new Web3.providers.HttpProvider(process.env.WEB3_URL!))
	const property = new PropertyData(web3, con, propertyAddress)
	await property.load()

	const hasAllToken = await property.hasAllTokenByAuthor()
	if (hasAllToken) {
		await propertyBalanceAccessor.deleteRecord(propertyAddress)
		return
	}

	const events = await property.getTransferEvent(endBlockNumber + 1)
	const author = await property.getAuthor()
	await propertyBalanceAccessor.insertRecord(events, propertyAddress, author)
}
