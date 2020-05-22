/* eslint-disable new-cap */
import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm'

@Entity()
export class ContractInfo extends BaseEntity {
	@PrimaryColumn()
	public name!: string

	@Column()
	public address!: string

	@Column()
	public abi!: string
}
