// @flow

/* globals Request, URL */

import {cachedFetch} from './cached'
import {userAgent} from '@frogpond/constants'
import delay from 'delay'
import queryString from 'query-string'

const USER_AGENT = userAgent()

class HTTPError extends Error {
	response: Response
	constructor(response) {
		super(response.statusText)
		this.name = 'HTTPError'
		this.response = response
	}
}

type ExpandedFetchArgs = RequestOptions & {
	// Search parameters to include in the request URL. Setting this will
	// override all existing search parameters in the input URL.
	searchParams?: {[key: string]: string | number},

	// Number of times to retry failed requests.
	// retry?: number;

	// Timeout in milliseconds for getting a response.
	// timeout?: number;

	// Throw a `HTTPError` for error responses (non-2xx status codes).
	throwHttpErrors?: boolean,

	// Amount of time to delay the request, in milliseconds.
	delay?: number,
}

interface ResponsePromise extends Promise<Response> {
	json(): Promise<any>;
	text(): Promise<string>;
}

class Fetch {
	request: Request
	response: Response

	retryCount: number = 0

	options: ExpandedFetchArgs

	startMs: number

	constructor(input: RequestInfo = '', init?: ExpandedFetchArgs = {}) {
		let {searchParams = null} = init

		this.options = {
			throwHttpErrors: true,
			delay: 0,
			...init,
		}

		this.request = new Request(input, init)

		if (searchParams) {
			let url = new URL(this.request.url)
			// $FlowExpectedError
			url.search = queryString.stringify(searchParams)
			this.request.url = url
		}

		if (!this.request.headers.has('User-Agent')) {
			this.request.headers.set('User-Agent', USER_AGENT)
		}

		this.startMs = Date.now()

		this.response = cachedFetch(this.request)

		// $FlowExpectedError "cannot assign to new property"
		this.response.text = async () => {
			return (await this.response).clone().text()
		}

		// $FlowExpectedError "cannot assign to new property"
		this.response.json = async () => {
			return (await this.response).clone().json()
		}

		return this.start()
	}

	async start() {
		let response = await this.response

		if (this.options.throwHttpErrors && !response.ok) {
			throw new HTTPError(response)
		}

		let elapsed = Date.now() - this.startMs
		if (
			this.options.delay &&
			elapsed < this.options.delay
		) {
			// 0.5s delay for ListViews – if we let them go at full speed, it feels broken
			await delay(this.options.delay - elapsed)
		}

		return response
	}
}

export const fetch = (
	input: RequestInfo = '',
	init?: RequestOptions & ExpandedFetchArgs = {},
): ResponsePromise => (new Fetch(input, init): any)
