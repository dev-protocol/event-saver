/* eslint-disable new-cap */
import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm'

@Entity()
export class PropertyDirectoryFactoryCreate extends BaseEntity {
	@PrimaryColumn()
	public event_id!: string

	@Column()
	public block_number!: number

	@Column()
	public log_index!: number

	@Column()
	public transaction_index!: number

	@Column()
	public property_directory!: string

	@Column()
	public author!: string

	@Column()
	public name!: string

	@Column()
	public symbol!: string

	@Column()
	public raw_data!: string
}
