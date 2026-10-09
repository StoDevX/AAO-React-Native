import ky from 'ky'

/// For modules that read ky's errors without depending on ky themselves.
export {isHTTPError} from 'ky'

/// What answers a request instead of the network, under UI tests that name a
/// campus. `next` is the network.
export type FetchInterceptor = (request: Request, next: typeof fetch) => Promise<Response>

let interceptor: FetchInterceptor | null = null

export function setFetchInterceptor(next: FetchInterceptor | null): void {
	interceptor = next
}

/// `fetch`, through the interceptor when one is set. Both clients and the
/// data sources' own fetches go through it.
export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
	if (!interceptor) return fetch(input, init)
	return interceptor(new Request(input instanceof URL ? input.href : input, init), fetch)
}

export let stolafClient: typeof ky

/// The server the app was pointed at, for URLs that are not fetched through
/// `stolafClient`, such as an image's `uri`. Unset until `setApiRoot` has run.
let apiRoot: URL | undefined

export function getApiRoot(): URL | undefined {
	return apiRoot
}

export function setApiRoot(url: URL): void {
	apiRoot = url
	stolafClient = ky.create({baseUrl: url, fetch: apiFetch})
}

/// Carleton runs its own ccc-server deployment. The map view reads building
/// data from it directly, so it needs a peer of `stolafClient` rather than a
/// different path on the St. Olaf server.
export let carletonClient: typeof ky

let carletonApiRoot: URL | undefined

export function getCarletonApiRoot(): URL | undefined {
	return carletonApiRoot
}

export function setCarletonApiRoot(url: URL): void {
	carletonApiRoot = url
	carletonClient = ky.create({baseUrl: url, fetch: apiFetch})
}
