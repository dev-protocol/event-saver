/* eslint-disable new-cap */
import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm'

@Entity()
export class PropertyFactoryChangeAuthor extends BaseEntity {
	@PrimaryColumn()
	public event_id!: string

	@Column()
	public block_number!: number

	@Column()
	public log_index!: number

	@Column()
	public transaction_index!: number

	@Column()
	public property!: string

	@Column()
	public before_author!: string

	@Column()
	public after_author!: string

	@Column()
	public raw_data!: string
}
