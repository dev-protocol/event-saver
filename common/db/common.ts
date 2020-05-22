import { createConnection, BaseEntity, Connection, QueryRunner } from 'typeorm'

export class DbConnection {
	private readonly _batchName: string
	private _connection!: Connection

	constructor(batchName: string) {
		this._batchName = batchName
	}

	get connection(): Connection {
		return this._connection
	}

	public async connect(): Promise<void> {
		const config = this._getConfig()
		this._connection = await createConnection(config)
		BaseEntity.useConnection(this._connection)
	}

	public async quit(): Promise<void> {
		await this._connection.close()
	}

	private _getConfig(): any {
		let entities = 'entities/*.ts'
		if (typeof process.env.ENTITIES !== 'undefined') {
			entities = process.env.ENTITIES
		}

		return {
			name: this._batchName,
			type: 'postgres',
			synchronize: false,
			logging: false,
			entities: [entities],
			host: process.env.DB_HOST!,
			port: process.env.DB_PORT!,
			username: process.env.DB_USERNAME!,
			password: process.env.DB_PASSWORD!,
			database: process.env.DB_DATABASE!,
		}
	}
}

export class Transaction {
	private readonly _runner!: QueryRunner

	constructor(connection: Connection) {
		this._runner = connection.createQueryRunner()
	}

	public async start(): Promise<void> {
		await this._runner.connect()
		await this._runner.startTransaction()
	}

	public async save<Entity>(entity: Entity): Promise<void> {
		await this._runner.manager.save(entity)
	}

	public async remove<Entity>(entity: Entity): Promise<Entity> {
		return this._runner.manager.remove(entity)
	}

	public async commit(): Promise<void> {
		await this._runner.commitTransaction()
	}

	public async rollback(): Promise<void> {
		await this._runner.rollbackTransaction()
	}

	public async finish(): Promise<void> {
		await this._runner.release()
	}
}
