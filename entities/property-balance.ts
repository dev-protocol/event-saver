/* eslint-disable new-cap */
import { Entity, Column, PrimaryColumn, BaseEntity } from 'typeorm'

@Entity()
export class PropertyBalance extends BaseEntity {
	@PrimaryColumn()
	public property_address!: string

	@PrimaryColumn()
	public account_address!: string

	@Column()
	public balance!: string

	@Column()
	public is_author!: boolean

	@Column()
	public block_number!: number
}
