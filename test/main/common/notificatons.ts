import { getContextMock } from '../../lib/mock'

jest.mock('discord-webhook-ts')

import DiscordWebhook from 'discord-webhook-ts'

// Tslint:disable-next-line:no-any
const discordClient = new DiscordWebhook('')
;(discordClient.execute as any).mockResolvedValue()

import { EventSaverLogging } from '../../../common/notifications'

describe('EventSaverLogging', () => {
	const context = getContextMock()
	describe('start,finish', () => {
		it('No error occurs when running start or finish.', async () => {
			const res = new EventSaverLogging(context.log, 'TestBatchName')
			await res.start()
			await res.finish()
		})
	})
	describe('info,warning,error', () => {
		it('No error occurs when running info, warning or error.', async () => {
			const res = new EventSaverLogging(context.log, 'TestBatchName')
			await res.info('info message')
			await res.warning('warning message')
			await res.error('error message')
		})
		it('No error occurs when running infolog or errorlog.', async () => {
			const res = new EventSaverLogging(context.log, 'TestBatchName')
			res.infolog('info message')
			res.errorlog('error message')
		})
	})
})
