/* eslint-disable new-cap */
import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm'

@Entity()
export class ProcessedBlockNumber extends BaseEntity {
	@PrimaryColumn()
	public key_name!: string

	@Column()
	public block_number!: number
}
