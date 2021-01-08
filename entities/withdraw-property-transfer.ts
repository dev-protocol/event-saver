/* eslint-disable new-cap */
import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm'

@Entity()
export class WithdrawPropertyTransfer extends BaseEntity {
	@PrimaryColumn()
	public event_id!: string

	@Column()
	public block_number!: number

	@Column()
	public log_index!: number

	@Column()
	public transaction_index!: number

	@Column()
	public property_address!: string

	@Column()
	public from_address!: string

	@Column()
	public to_address!: string

	@Column()
	public raw_data!: string
}
