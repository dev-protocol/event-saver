/* eslint-disable @typescript-eslint/no-empty-function */
import context from 'azure-function-context-mock'
context.log.error = function (..._: any[]): void {}
context.log.warn = function (..._: any[]): void {}
context.log.info = function (..._: any[]): void {}
context.log.verbose = function (..._: any[]): void {}
context.executionContext = {
	functionName: 'test-name',
}

export function getContextMock() {
	return context
}

const timer = {
	IsPastDue: false,
}

export function getTimerMock(isPastDue = false) {
	timer.IsPastDue = isPastDue
	return timer
}
