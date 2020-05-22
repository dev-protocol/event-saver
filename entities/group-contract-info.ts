/* eslint-disable new-cap */
import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm'

@Entity()
export class GroupContractInfo extends BaseEntity {
	@PrimaryColumn()
	public name!: string

	@Column()
	public abi!: string
}
