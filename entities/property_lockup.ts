/* eslint-disable new-cap */
import { Entity, Column, PrimaryColumn, BaseEntity } from 'typeorm'

@Entity()
export class PropertyLockup extends BaseEntity {
	@PrimaryColumn()
	public property_address!: string

	@PrimaryColumn()
	public account_address!: string

	@Column()
	public value!: number

	@Column()
	public locked_up_event_id!: string

	@Column()
	public block_number!: number
}
