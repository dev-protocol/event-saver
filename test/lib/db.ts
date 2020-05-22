import { DbConnection } from '../../common/db/common'
import { setDbSettings } from './environment'

export async function getDbConnection(): Promise<DbConnection> {
	setDbSettings()
	const con = new DbConnection(Math.random().toString(36).slice(-8))
	await con.connect()
	return con
}
