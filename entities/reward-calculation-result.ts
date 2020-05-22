/* eslint-disable new-cap */
import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm'

@Entity()
export class RewardCalculationResult extends BaseEntity {
	@PrimaryColumn()
	public event_id!: string

	@Column()
	public block_number!: number

	@Column()
	public metrics!: string

	@Column()
	public lockup!: number

	@Column()
	public allocate_result!: number

	@Column({ type: 'numeric' })
	public holder_reward!: string

	@Column({ type: 'numeric' })
	public staking_reward!: string

	@Column()
	public policy!: string
}
