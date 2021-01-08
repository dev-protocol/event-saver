/* eslint-disable new-cap */
import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm'

@Entity()
export class PropertyDirectoryFactoryRecreate extends BaseEntity {
	@PrimaryColumn()
	public event_id!: string

	@Column()
	public block_number!: number

	@Column()
	public log_index!: number

	@Column()
	public transaction_index!: number

	@Column()
	public old!: string

	@Column()
	public new!: string

	@Column()
	public raw_data!: string
}
