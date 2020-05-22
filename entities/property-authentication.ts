/* eslint-disable new-cap */
import { Entity, Column, PrimaryColumn, BaseEntity } from 'typeorm'

@Entity()
export class PropertyAuthentication extends BaseEntity {
	@PrimaryColumn()
	public property!: string

	@PrimaryColumn()
	public metrics!: string

	@Column()
	public block_number!: number

	@Column()
	public market!: string

	@Column()
	public authentication_id!: string
}
