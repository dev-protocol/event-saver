import { HttpRequest } from '@azure/functions'

export function getHttpRequestMock(
	headersArg: Record<string, string>,
	bodyArg: any,
	params = {}
): HttpRequest {
	const mockHttpReq: HttpRequest = {
		method: 'POST',
		url: 'https://dummy-domein',
		headers: headersArg,
		query: {},
		params: params,
		body: bodyArg,
		rawBody: undefined,
	}
	return mockHttpReq
}
