/* eslint-disable new-cap */
import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm'

@Entity()
export class PolicyFactoryCreate extends BaseEntity {
	@PrimaryColumn()
	public event_id!: string

	@Column()
	public block_number!: number

	@Column()
	public log_index!: number

	@Column()
	public transaction_index!: number

	@Column()
	public from_address!: string

	@Column()
	public policy_address!: string

	@Column()
	public inner_policy!: string

	@Column()
	public raw_data!: string
}
