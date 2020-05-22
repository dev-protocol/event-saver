import { DbConnection } from '../../../../common/db/common'
import { LockupLockedup } from '../../../../entities/lockup-lockedup'
import { getDbConnection } from './../../../lib/db'
import { saveLockupLockupedTestdata } from './../../../lib/test-data'

describe('DbConnection', () => {
	it('can connect to db.', async () => {
		const con = await getDbConnection()
		expect(con.connection.isConnected).toBe(true)
		await con.quit()
	})
})

describe('Transaction', () => {
	let con: DbConnection
	beforeAll(async (done) => {
		con = await getDbConnection()
		done()
	})
	afterAll(async (done) => {
		await con.quit()
		done()
	})
	it('can save data when you commit.', async () => {
		await saveLockupLockupedTestdata(con.connection)
		const recordCount = await con.connection
			.getRepository(LockupLockedup)
			.count()
		expect(recordCount).toBe(3)
	})
	it('cannot save data when you rollback.', async () => {
		await saveLockupLockupedTestdata(con.connection, false)
		const recordCount = await con.connection
			.getRepository(LockupLockedup)
			.count()
		expect(recordCount).toBe(0)
	})
})
