/* eslint-disable new-cap */
import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm'

@Entity()
export class LegacyGroupContractInfo extends BaseEntity {
	@PrimaryColumn()
	public name!: string

	@PrimaryColumn()
	public address!: string

	@Column()
	public abi!: string
}
