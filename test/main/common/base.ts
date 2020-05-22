import { mocked } from 'ts-jest/utils'
import { getContextMock, getTimerMock } from '../../lib/mock'
import { TimerBatchBase } from '../../../common/base'
import { EventSaverLogging } from '../../../common/notifications'

const context = getContextMock()

jest.mock('../../../common/notifications')

const TEST_FUNC_NAME = 'test-func-name'

class TestTimerBatchBase extends TimerBatchBase {
	getBatchName(): string {
		return TEST_FUNC_NAME
	}

	async innerExecute(): Promise<void> {
		const sleep = async (time: number): Promise<number> => {
			return new Promise<number>((resolve) => {
				setTimeout(() => {
					resolve(time)
				}, time)
			})
		}

		await sleep(1)
	}
}

class TestTimerBatchBaseError extends TimerBatchBase {
	getBatchName(): string {
		return TEST_FUNC_NAME
	}

	async innerExecute(): Promise<void> {
		throw new Error('test-error')
	}
}

describe('TimerBatchBase', () => {
	beforeEach(() => {
		mocked(EventSaverLogging).mockClear()
	})
	it('Upon successful completion, logging executes the start and finish methods.', async () => {
		expect(EventSaverLogging).not.toHaveBeenCalled()
		const timer = getTimerMock()
		const timerBatch = new TestTimerBatchBase(context, timer)
		await timerBatch.execute()
		expect(EventSaverLogging).toHaveBeenCalledTimes(1)
		const mockSoundPlayerInstance = mocked(EventSaverLogging).mock.instances[0]
		expect(mockSoundPlayerInstance.start).toHaveBeenCalledTimes(1)
		expect(mockSoundPlayerInstance.finish).toHaveBeenCalledTimes(1)
		expect(mockSoundPlayerInstance.warning).toHaveBeenCalledTimes(0)
		expect(mockSoundPlayerInstance.error).toHaveBeenCalledTimes(0)
	})
	it('If running deferred, logging executes the start, finish, and warning methods.', async () => {
		expect(EventSaverLogging).not.toHaveBeenCalled()
		const timer = getTimerMock(true)
		const timerBatch = new TestTimerBatchBase(context, timer)
		await timerBatch.execute()
		expect(EventSaverLogging).toHaveBeenCalledTimes(1)
		const mockSoundPlayerInstance = mocked(EventSaverLogging).mock.instances[0]
		expect(mockSoundPlayerInstance.start).toHaveBeenCalledTimes(1)
		expect(mockSoundPlayerInstance.finish).toHaveBeenCalledTimes(1)
		expect(mockSoundPlayerInstance.warning).toHaveBeenCalledTimes(1)
		expect(mockSoundPlayerInstance.warning).toHaveBeenCalledWith(
			'Timer function is running late!'
		)
		expect(mockSoundPlayerInstance.error).toHaveBeenCalledTimes(0)
	})
	it('If an error occurs, logging executes the start and error methods.', async () => {
		expect(EventSaverLogging).not.toHaveBeenCalled()
		const timer = getTimerMock()
		const timerBatch = new TestTimerBatchBaseError(context, timer)
		const promise = timerBatch.execute()
		await expect(promise).rejects.toThrowError(new Error('test-error'))
		expect(EventSaverLogging).toHaveBeenCalledTimes(1)
		const mockSoundPlayerInstance = mocked(EventSaverLogging).mock.instances[0]
		expect(mockSoundPlayerInstance.start).toHaveBeenCalledTimes(1)
		expect(mockSoundPlayerInstance.finish).toHaveBeenCalledTimes(0)
		expect(mockSoundPlayerInstance.warning).toHaveBeenCalledTimes(0)
		expect(mockSoundPlayerInstance.error).toHaveBeenCalledTimes(1)
	})
})
