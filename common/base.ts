import { Context } from '@azure/functions'
import { EventSaverLogging } from './notifications'

export abstract class TimerBatchBase {
	private readonly _context: Context
	private readonly _myTimer: any
	// eslint-disable-next-line @typescript-eslint/member-ordering
	protected readonly logging: EventSaverLogging

	constructor(context: Context, myTimer: any) {
		this._context = context
		this._myTimer = myTimer
		this.logging = new EventSaverLogging(this._context.log, this.getBatchName())
	}

	public async execute(): Promise<void> {
		try {
			await this.logging.start()
			if (this._myTimer.IsPastDue) {
				await this.logging.warning('Timer function is running late!')
			}

			await this.innerExecute()
		} catch (err) {
			this.logging.errorlog(err.stack)
			await this.logging.error(err.message)
			throw err
		}

		await this.logging.finish()
	}

	abstract getBatchName(): string
	abstract async innerExecute(): Promise<void>
}
