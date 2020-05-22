import { ObjectType, EntityManager, Connection } from 'typeorm'
import { Transaction } from '../../common/db/common'
import { LockupLockedup } from '../../entities/lockup-lockedup'
import { ContractInfo } from '../../entities/contract-info'
import { GroupContractInfo } from '../../entities/group-contract-info'
import { LegacyGroupContractInfo } from '../../entities/legacy-group-contract-info'

export async function saveLockupLockupedTestdata(
	con: Connection,
	executeCommit = true
): Promise<void> {
	await clearData(con, LockupLockedup)
	const transaction = new Transaction(con)
	await transaction.start()
	const lockupLockedup = new LockupLockedup()

	lockupLockedup.event_id = 'dummy-event-id1'
	lockupLockedup.block_number = 30000
	lockupLockedup.log_index = 21
	lockupLockedup.transaction_index = 36
	lockupLockedup.from_address = '0x12345'
	lockupLockedup.property = '0x12345'
	lockupLockedup.token_value = 100
	lockupLockedup.raw_data = '{}'
	await transaction.save(lockupLockedup)

	lockupLockedup.event_id = 'dummy-event-id2'
	lockupLockedup.block_number = 31000
	lockupLockedup.log_index = 23
	lockupLockedup.transaction_index = 30
	lockupLockedup.from_address = '0x82736'
	lockupLockedup.property = '0xabe34'
	lockupLockedup.token_value = 10
	lockupLockedup.raw_data = '{}'
	await transaction.save(lockupLockedup)

	lockupLockedup.event_id = 'dummy-event-id3'
	lockupLockedup.block_number = 32000
	lockupLockedup.log_index = 19
	lockupLockedup.transaction_index = 12
	lockupLockedup.from_address = '0xab123'
	lockupLockedup.property = '0xcd435'
	lockupLockedup.token_value = 5
	lockupLockedup.raw_data = '{}'
	await transaction.save(lockupLockedup)
	if (executeCommit) {
		await transaction.commit()
	} else {
		await transaction.rollback()
	}

	await transaction.finish()
}

export async function clearData<Entity>(
	con: Connection,
	entityClass: ObjectType<Entity>
): Promise<void> {
	const manager = new EntityManager(con)
	await manager.clear(entityClass)
}

export async function getCount<Entity>(
	con: Connection,
	entityClass: ObjectType<Entity>
): Promise<number> {
	const manager = new EntityManager(con)
	const number = await manager.count(entityClass)
	return number
}

export async function saveContractInfoTestdata(con: Connection): Promise<void> {
	const manager = new EntityManager(con)
	await manager.clear(ContractInfo)
	const transaction = new Transaction(con)
	await transaction.start()
	const contractInfo = new ContractInfo()

	contractInfo.name = 'AddressConfig'
	contractInfo.address = '0x152437ababab'
	contractInfo.abi =
		'[{"inputs": [{"internalType": "address","name": "_config","type": "string"}]}]'
	await transaction.save(contractInfo)

	contractInfo.name = 'Lockup'
	contractInfo.address = '0x152437ababababa'
	contractInfo.abi =
		'[{"inputs": [{"internalType": "address","name": "_config","type": "uint"}]}]'
	await transaction.save(contractInfo)

	contractInfo.name = 'Allocator'
	contractInfo.address = '0x152437abababac'
	contractInfo.abi =
		'[{"inputs": [{"internalType": "address","name": "_config","type": "uint"}]}]'
	await transaction.save(contractInfo)

	contractInfo.name = 'MarketFactory'
	contractInfo.address = '0x152437abababacd'
	contractInfo.abi =
		'[{"inputs": [{"internalType": "address","name": "_config","type": "uint"}]}]'
	await transaction.save(contractInfo)

	contractInfo.name = 'MetricsFactory'
	contractInfo.address = '0x152437abababacde'
	contractInfo.abi =
		'[{"inputs": [{"internalType": "address","name": "_config","type": "uint"}]}]'
	await transaction.save(contractInfo)

	contractInfo.name = 'PolicyFactory'
	contractInfo.address = '0x152437bbababacde'
	contractInfo.abi =
		'[{"inputs": [{"internalType": "address","name": "_config","type": "uint"}]}]'
	await transaction.save(contractInfo)

	contractInfo.name = 'PropertyFactory'
	contractInfo.address = '0x252437bbababacde'
	contractInfo.abi =
		'[{"inputs": [{"internalType": "address","name": "_config","type": "uint"}]}]'
	await transaction.save(contractInfo)

	await transaction.commit()
	await transaction.finish()
}

export async function saveGroupContractInfoTestdata(
	con: Connection
): Promise<void> {
	await clearData(con, GroupContractInfo)
	const transaction = new Transaction(con)
	await transaction.start()
	const groupContractInfo = new GroupContractInfo()

	groupContractInfo.name = 'Metrics'
	groupContractInfo.abi =
		'[{"inputs": [{"internalType": "address","name": "_config","type": "string"}]}]'
	await transaction.save(groupContractInfo)

	groupContractInfo.name = 'dummy-name-2'
	groupContractInfo.abi =
		'[{"inputs": [{"internalType": "address","name": "_config","type": "address"}]}]'
	await transaction.save(groupContractInfo)

	groupContractInfo.name = 'IPolicy'
	groupContractInfo.abi =
		'[{"inputs": [{"internalType": "address","name": "_config","type": "uint"}]}]'
	await transaction.save(groupContractInfo)

	groupContractInfo.name = 'IMarketBehavior'
	groupContractInfo.abi =
		'[{"constant":true,"inputs":[{"internalType":"address","name":"_metrics","type":"address"}],"name":"getId","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"}]'
	await transaction.save(groupContractInfo)

	groupContractInfo.name = 'IMarket'
	groupContractInfo.abi =
		'[{"inputs": [{"internalType": "address","name": "_config","type": "byte32"}]}]'
	await transaction.save(groupContractInfo)

	groupContractInfo.name = 'Property'
	groupContractInfo.abi =
		'[{"inputs": [{"internalType": "address","name": "_config","type": "byte32"}]}]'
	await transaction.save(groupContractInfo)

	await transaction.commit()
	await transaction.finish()
}

export async function updateGroupContractInfoTestdata(
	con: Connection,
	name: string,
	abi: string
): Promise<void> {
	const groupContractInfo = new GroupContractInfo()
	const transaction = new Transaction(con)
	await transaction.start()
	groupContractInfo.name = name
	groupContractInfo.abi = abi
	await transaction.save(groupContractInfo)

	await transaction.commit()
}

export async function saveLegacyGroupContractInfoTestdata(
	con: Connection
): Promise<void> {
	const manager = new EntityManager(con)
	await manager.clear(LegacyGroupContractInfo)
	const transaction = new Transaction(con)
	await transaction.start()
	const legacyGroupContractInfo = new LegacyGroupContractInfo()

	legacyGroupContractInfo.name = 'dummy-name-1'
	legacyGroupContractInfo.address = '0x152437ababab'
	legacyGroupContractInfo.abi =
		'[{"inputs": [{"internalType": "address","name": "_config","type": "string"}]}]'
	await transaction.save(legacyGroupContractInfo)

	legacyGroupContractInfo.name = 'dummy-name-2'
	legacyGroupContractInfo.address = '0x152437cdcdcd'
	legacyGroupContractInfo.abi =
		'[{"inputs": [{"internalType": "address","name": "_config","type": "address"}]}]'
	await transaction.save(legacyGroupContractInfo)

	legacyGroupContractInfo.name = 'dummy-name-3'
	legacyGroupContractInfo.address = '0x152437efefef'
	legacyGroupContractInfo.abi =
		'[{"inputs": [{"internalType": "address","name": "_config","type": "uint"}]}]'
	await transaction.save(legacyGroupContractInfo)

	await transaction.commit()
	await transaction.finish()
}
