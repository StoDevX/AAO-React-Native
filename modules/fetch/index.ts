// import {cachedFetch} from './cached'
import {userAgent} from '@frogpond/constants'
import delay from 'delay'
import queryString from 'query-string'

export {insertForUrl} from './cached'

const USER_AGENT = userAgent()

class HTTPError extends Error {
	response: Response
	constructor(response: Response) {
		super(response.statusText)
		this.name = 'HTTPError'
		this.response = response
	}
}

type ExpandedFetchArgs = RequestInit & {
	// Search parameters to include in the request URL. Setting this will
	// override all existing search parameters in the input URL.
	searchParams?: {[key: string]: string | number}

	// Number of times to retry failed requests.
	// retry?: number;

	// Timeout in milliseconds for getting a response.
	// timeout?: number;

	// Throw a `HTTPError` for error responses (non-2xx status codes).
	throwHttpErrors?: boolean

	// Amount of time to delay the request, in milliseconds.
	delay?: number
}

class Fetch implements GlobalFetch {
	async fetch(
		input: RequestInfo,
		init: RequestInit & ExpandedFetchArgs = {},
	): Promise<Response> {
		let startMs = Date.now()

		let {searchParams = null} = init

		let options: ExpandedFetchArgs = {
			throwHttpErrors: true,
			delay: 0,
			...init,
		}

		let url = undefined

		if (input instanceof Request) {
			url = input.url
		} else {
			url = input.split('?')[0]
		}

		if (searchParams) {
			url = url.split('?')[0]
			let queryParams = queryString.stringify(searchParams)
			url = `${url}?${queryParams}`
		}

		let request = new Request(input, init)

		if (!request.headers.has('User-Agent')) {
			request.headers.set('User-Agent', USER_AGENT)
		}

		let response: Response = await fetch(request)

		if (options.throwHttpErrors && !response.ok) {
			throw new HTTPError(response)
		}

		let elapsed = Date.now() - startMs

		if (options.delay && elapsed < options.delay) {
			await delay(options.delay - elapsed)
		}

		return response
	}
}

const doFetch = async (
	input: RequestInfo,
	init?: RequestInit & ExpandedFetchArgs,
) => await new Fetch().fetch(input, init)

export {doFetch as fetch}
