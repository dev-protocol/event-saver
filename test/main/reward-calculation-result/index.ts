import { Connection } from 'typeorm'
import { mocked } from 'ts-jest/utils'
import { getContextMock, getTimerMock } from '../../lib/mock'
import {
	saveContractInfoTestdata,
	clearData,
	getCount,
} from '../../lib/test-data'
import { getDbConnection } from '../../lib/db'

import timerTrigger from '../../../reward-calculation-result/index'
import { DbConnection } from '../../../common/db/common'
import { getPolicyInstance } from '../../../common/block-chain/utils'
import { RewardCalculationResult } from '../../../entities/reward-calculation-result'
import { AllocatorAllocationResult } from '../../../entities/allocator-allocation-result'
import { Transaction } from '../../../common/db/common'

const context = getContextMock()

jest.mock('../../../common/notifications')
jest.mock('../../../common/block-chain/utils')

const holdersShare = function (_: number, __: number) {
	return {
		call: async function (): Promise<number> {
			return 10000
		},
	}
}

const mockResult = {
	methods: {
		holdersShare: holdersShare,
	},
	options: {
		address: 'dummy-policy-address1',
	},
}

mocked(getPolicyInstance).mockImplementation(async () =>
	Promise.resolve(mockResult)
)

const timer = getTimerMock()

describe('timerTrigger', () => {
	let con: DbConnection
	beforeAll(async () => {
		con = await getDbConnection()
		await saveContractInfoTestdata(con.connection)
	})
	beforeEach(async () => {
		await clearData(con.connection, AllocatorAllocationResult)
		await clearData(con.connection, RewardCalculationResult)
	})
	it('If the target record does not exist, nothing is processed.', async () => {
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, AllocatorAllocationResult)
		expect(count).toBe(0)
		count = await getCount(con.connection, RewardCalculationResult)
		expect(count).toBe(0)
	})
	it('Save the result of the calculation if the target record exists.', async () => {
		await saveAllocatorAllocationResultTestData(con.connection)
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, AllocatorAllocationResult)
		expect(count).toBe(1)
		count = await getCount(con.connection, RewardCalculationResult)
		expect(count).toBe(1)
		const repository = con.connection.getRepository(RewardCalculationResult)
		const record = await repository.findOne({
			event_id: 'dummy-event-id1',
		})
		expect(record.event_id).toBe('dummy-event-id1')
		expect(record.block_number).toBe(30000)
		expect(record.metrics).toBe('dummy-metrics-address1')
		expect(Number(record.lockup)).toBe(10)
		expect(Number(record.allocate_result)).toBe(100000)
		expect(Number(record.holder_reward)).toBe(10000)
		expect(Number(record.staking_reward)).toBe(90000)
		expect(record.policy).toBe('dummy-policy-address1')
	})
	it('Up to 100 records can be processed at a time.', async () => {
		await saveManyAllocatorAllocationResultTestData(con.connection)
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, AllocatorAllocationResult)
		expect(count).toBe(120)
		count = await getCount(con.connection, RewardCalculationResult)
		expect(count).toBe(100)
	})
	afterAll(async () => {
		await con.quit()
	})
})

async function saveAllocatorAllocationResultTestData(con: Connection) {
	const transaction = new Transaction(con)
	await transaction.start()
	const record = new AllocatorAllocationResult()
	record.event_id = 'dummy-event-id1'
	record.block_number = 30000
	record.log_index = 2
	record.transaction_index = 3
	record.metrics = 'dummy-metrics-address1'
	record.arg_value = 1000
	record.market = 'dummy-market-address1'
	record.property = 'dummy-property-address1'
	record.lockup_value = 10
	record.result = 100000
	record.raw_data = '{}'

	await transaction.save(record)
	await transaction.commit()
	await transaction.finish()
}

async function saveManyAllocatorAllocationResultTestData(con: Connection) {
	const transaction = new Transaction(con)
	await transaction.start()
	const record = new AllocatorAllocationResult()
	for (let i = 0; i < 120; i++) {
		record.event_id = `dummy-event-id${i}`
		record.block_number = 30000 + i
		record.log_index = 2
		record.transaction_index = 3
		record.metrics = 'dummy-metrics-address1'
		record.arg_value = 1000
		record.market = 'dummy-market-address1'
		record.property = 'dummy-property-address1'
		record.lockup_value = 10
		record.result = 100000
		record.raw_data = '{}'

		// eslint-disable-next-line no-await-in-loop
		await transaction.save(record)
	}

	await transaction.commit()
	await transaction.finish()
}
