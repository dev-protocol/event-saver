/* eslint-disable new-cap */
import { Entity, Column, PrimaryColumn, BaseEntity } from 'typeorm'

@Entity()
export class CurrentLockup extends BaseEntity {
	@PrimaryColumn()
	public wallet_address!: string

	@PrimaryColumn()
	public property_address!: string

	@Column()
	public value!: number

	@Column()
	public locked_up_event_id!: string

	@Column()
	public block_number!: number
}
