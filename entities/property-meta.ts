/* eslint-disable new-cap */
import { Entity, Column, PrimaryColumn, BaseEntity } from 'typeorm'

@Entity()
export class PropertyMeta extends BaseEntity {
	@PrimaryColumn()
	public author!: string

	@PrimaryColumn()
	public property!: string

	@Column()
	public sender!: string

	@Column()
	public block_number!: number

	@Column()
	public name!: string

	@Column()
	public symbol!: string
}
