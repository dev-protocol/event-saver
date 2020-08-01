/* eslint-disable new-cap */
import { Entity, Column, PrimaryColumn, BaseEntity } from 'typeorm'

@Entity()
export class AccountLockup extends BaseEntity {
	@PrimaryColumn()
	public account_address!: string

	@PrimaryColumn()
	public property_address!: string

	@Column()
	public value!: string

	@Column()
	public locked_up_event_id!: string
}
