import { formatTransferEventToPropertyBalance } from '../../../../common/db/format'
import { generateTestAddress, EventDataGenerator } from '../../../lib/test-data'

describe('formatTransferEvent', () => {
	const [
		account1,
		account2,
		account3,
		treasury,
		property,
	] = generateTestAddress()
	it('if the event data does not exist, an empty array will be returned..', async () => {
		const generator = new EventDataGenerator()
		const result = formatTransferEventToPropertyBalance(generator.data, '', '')
		expect(result.length).toBe(0)
	})
	it('a record corresponding to the event data will be created.', async () => {
		const generator = new EventDataGenerator()
		generator.addMintTransfer(account1, 10000, 100)
		generator.addMintTransfer(treasury, 5000, 100)
		generator.addTransfer(account1, account2, 100, 120)
		generator.addTransfer(account1, account3, 50, 122)
		const result = formatTransferEventToPropertyBalance(
			generator.data,
			account1,
			property
		)
		expect(result.length).toBe(4)
		result.forEach((record) => {
			expect(record.property_address).toBe(property)
			switch (record.account_address) {
				case treasury:
					expect(record.balance).toBe('5000')
					expect(record.is_author).toBe(false)
					expect(record.block_number).toBe(100)
					break
				case account2:
					expect(record.balance).toBe('100')
					expect(record.is_author).toBe(false)
					expect(record.block_number).toBe(120)
					break
				case account3:
					expect(record.balance).toBe('50')
					expect(record.is_author).toBe(false)
					expect(record.block_number).toBe(122)
					break
				case account1:
					expect(record.balance).toBe('9850')
					expect(record.is_author).toBe(true)
					expect(record.block_number).toBe(122)
					break
				default:
					throw new Error('illegal account address')
			}
		})
	})
})
