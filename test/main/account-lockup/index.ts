import { Connection } from 'typeorm'
import { getContextMock, getTimerMock } from '../../lib/mock'
import {
	saveContractInfoTestdata,
	clearData,
	getCount,
} from '../../lib/test-data'
import { getDbConnection } from '../../lib/db'

import timerTrigger from '../../../account-lockup/index'
import { DbConnection } from '../../../common/db/common'
import { AccountLockup } from '../../../entities/account-lockup'
import { DevPropertyTransfer } from '../../../entities/dev-property-transfer'
import { LockupLockedup } from '../../../entities/lockup-lockedup'
import { Transaction } from '../../../common/db/common'

const context = getContextMock()

jest.mock('../../../common/notifications')

const timer = getTimerMock()

describe('timerTrigger', () => {
	let con: DbConnection
	beforeAll(async () => {
		con = await getDbConnection()
		await saveContractInfoTestdata(con.connection)
	})
	beforeEach(async () => {
		await clearData(con.connection, AccountLockup)
		await clearData(con.connection, DevPropertyTransfer)
	})
	it('If the target record does not exist, nothing is processed.', async () => {
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, AccountLockup)
		expect(count).toBe(0)
		count = await getCount(con.connection, DevPropertyTransfer)
		expect(count).toBe(0)
	})
	it('Save the lockup data if the target record exists.', async () => {
		await saveTestData1(con.connection)
		await timerTrigger(context, timer)
		let count = await getCount(con.connection, AccountLockup)
		expect(count).toBe(1)
		count = await getCount(con.connection, DevPropertyTransfer)
		expect(count).toBe(1)
		const repository = con.connection.getRepository(AccountLockup)

		const record = await repository.findOne({
			account_address: 'dummy-from-address1',
			property_address: 'dummy-to-address1',
		})

		expect(record.account_address).toBe('dummy-from-address1')
		expect(record.property_address).toBe('dummy-to-address1')
		expect(record.value).toBe('30000')
		expect(record.block_number).toBe(300000)
		expect(record.locked_up_event_id).toBe('dummy-lockup-event-id1')
	})
	it('追加のブロック情報を取得する.', async () => {
		console.log(1)
	})
	it('以前のブロック情報が存在する時、valueがプラスされる.', async () => {
		console.log(1)
	})
	it('record.is_from_address_property == trueの時、削除処理。既存のロックアップ情報がない時は無視する.', async () => {
		console.log(1)
	})
	it('record.is_from_address_property == trueの時、削除処理。valueが違う時はエラー.', async () => {
		console.log(1)
	})
	it('record.is_from_address_property == trueの時、削除処理。.', async () => {
		console.log(1)
	})
	it('Up to 100 records can be processed at a time.', async () => {
		// await saveManyPropertyFactoryCreateTestData(con.connection)
		// await timerTrigger(context, timer)
		// let count = await getCount(con.connection, PropertyFactoryCreate)
		// expect(count).toBe(120)
		// count = await getCount(con.connection, PropertyMeta)
		// expect(count).toBe(100)
	})
	afterAll(async () => {
		await con.quit()
	})
})

async function saveTestData1(con: Connection) {
	const transaction = new Transaction(con)
	await transaction.start()
	const record = new DevPropertyTransfer()
	record.event_id = 'dummy-event-id1'
	record.block_number = 300000
	record.log_index = 20
	record.transaction_index = 31
	record.from_address = 'dummy-from-address1'
	record.to_address = 'dummy-to-address1'
	record.value = 30000
	record.is_from_address_property = false
	record.raw_data = '{}'
	await transaction.save(record)

	const record2 = new LockupLockedup()
	record2.event_id = 'dummy-lockup-event-id1'
	record2.block_number = 300000
	record2.log_index = 20
	record2.transaction_index = 31
	record2.from_address = 'dummy-from-address1'
	record2.property = 'dummy-to-address1'
	record2.token_value = 30000
	record2.raw_data = '{}'
	await transaction.save(record2)

	await transaction.commit()
	await transaction.finish()
}


// async function saveManyPropertyFactoryCreateTestData(con: Connection) {
// 	const transaction = new Transaction(con)
// 	await transaction.start()
// 	const record = new PropertyFactoryCreate()
// 	for (let i = 0; i < 120; i++) {
// 		record.event_id = `dummy-event-id${i}`
// 		record.block_number = 30000 + i
// 		record.log_index = 2
// 		record.transaction_index = 3
// 		record.from_address = 'dummy-user-address1'
// 		record.property = `dummy-property-address${i}`
// 		record.raw_data = '{}'

// 		// eslint-disable-next-line no-await-in-loop
// 		await transaction.save(record)
// 	}

// 	await transaction.commit()
// 	await transaction.finish()
// }


// account locksのテスト
// property locksのテスト
// devのデータ取得
