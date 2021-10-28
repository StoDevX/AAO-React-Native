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

export interface ExpandedFetchArgs extends RequestInit {
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

class Fetch {
	private readonly startMs: number
	private readonly request: Request
	private response?: Response
	private readonly options: ExpandedFetchArgs

	// Essentially, the constructor *creates* the Request, but does not actually do
	// anything with it. The provided `json` and `data` methods (which themselves
	// return promises) *must* be awaited, and doing so will trigger the response.
	constructor(input: RequestInfo, init: ExpandedFetchArgs = {}) {
		this.startMs = Date.now()

		this.options = {
			throwHttpErrors: true,
			delay: 0,
			...init,
		}

		let url = input instanceof Request ? input.url : input

		if (init.searchParams) {
			url = url.split('?')[0]
			url = `${url}?${queryString.stringify(init.searchParams)}`
		}

		let request: Request
		if (typeof input === 'string') {
			request = new Request(url, init)
		} else {
			request = new Request({...input, url: url}, init)
		}

		if (!request.headers.has('User-Agent')) {
			request.headers.set('User-Agent', USER_AGENT)
		}

		this.request = request
	}

	async json<T>(): Promise<T> {
		if (!this.response) {
			this.response = await this.doFetch()
		}

		return this.response.clone().json()
	}

	async text(): Promise<string> {
		if (!this.response) {
			this.response = await this.doFetch()
		}

		return this.response.clone().text()
	}

	// Actually makes the request.
	async doFetch(): Promise<Response> {
		let response: Response = await fetch(this.request)

		if (this.options.throwHttpErrors && !response.ok) {
			throw new HTTPError(response)
		}

		let elapsed = Date.now() - this.startMs

		// Optionally, if a delay was specified, withhold the promised
		// response value until (roughly) the specified delay time has
		// elapsed.  This can actually make the interface feel less "broken."
		if (this.options.delay && elapsed < this.options.delay) {
			await delay(this.options.delay - elapsed)
		}

		return response
	}
}

const buildFetch = (input: RequestInfo, init?: ExpandedFetchArgs): Fetch =>
	new Fetch(input, init)

export {buildFetch as fetch}
