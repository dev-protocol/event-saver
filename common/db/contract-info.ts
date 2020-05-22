import { Connection } from 'typeorm'
import { ContractInfo } from '../../entities/contract-info'
import { GroupContractInfo } from '../../entities/group-contract-info'
import { LegacyGroupContractInfo } from '../../entities/legacy-group-contract-info'

export async function getContractInfo(
	connection: Connection,
	batchName: string
): Promise<ContractInfo> {
	const repository = connection.getRepository(ContractInfo)
	const record = await repository.findOne({
		name: batchName,
	})
	return record
}

export async function getGroupContractInfo(
	connection: Connection,
	contractName: string
): Promise<GroupContractInfo> {
	const repository = connection.getRepository(GroupContractInfo)
	const record = await repository.findOne({
		name: contractName,
	})
	return record
}

export async function getLegacyGroupContractInfo(
	connection: Connection,
	contractName: string,
	contractAddress: string
): Promise<LegacyGroupContractInfo> {
	const repository = connection.getRepository(LegacyGroupContractInfo)
	const record = await repository.findOne({
		name: contractName,
		address: contractAddress,
	})
	return record
}
