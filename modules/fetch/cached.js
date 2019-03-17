// @flow
/* globals Request, Response, Headers */

import AsyncStorage from '@react-native-community/async-storage'
import CachePolicy from 'http-cache-semantics'
import fromPairs from 'lodash/fromPairs'

const ROOT = 'fp'
const debug = false

// Pulls out the important bits from a Request for storage
async function serializeResponse(r: Request) {
	let {headers, status, statusText} = r
	let body = await r.clone().text()
	if ('entries' in headers) {
		headers = [...headers.entries()]
	}
	return {headers, status, statusText, body}
}

// Converts a whatwg Headers instance into a plain object for http-cache-semantics
function headersInstanceToObject(headers: Headers) {
	return fromPairs([...Object.entries(headers)])
}

// Converts a whatwg Response into a plain object for http-cache-semantics
function responseForCachePolicy({url, method, headers}: Response) {
	// Response must have a headers property with all header names in lower
	// case. `url` and `method` are optional.

	return {url, method, headers: headersInstanceToObject(headers)}
}

// Converts a whatwg Request into a plain object for http-cache-semantics
function requestForCachePolicy({status, headers}: Request) {
	// Request must have a headers property with all header names in lower
	// case. `url` and `status` are optional.

	return {status, headers: headersInstanceToObject(headers)}
}

export async function insertForUrl(url: string, data: mixed) {
	let key = `urlcache:${url}`

	let {policy: oldPolicy} = await getItem(key)

	if (oldPolicy) {
		return
	}

	let req = new Request(url)
	let resp = new Response(JSON.stringify(data), {status: 200})
	let policy = new CachePolicy(
		requestForCachePolicy(req),
		responseForCachePolicy(resp),
	)

	return cacheItem({key, response: resp, policy, bundled: true})
}

// Does the magic: stores a Request into AsyncStorage
type CacheItemArgs = {
	key: string,
	response: Response,
	policy: CachePolicy,
	bundled?: boolean,
}
async function cacheItem({key, response, policy, bundled}: CacheItemArgs) {
	response = await serializeResponse(response)

	let strResponse = JSON.stringify(response)
	await AsyncStorage.multiSet([
		[`${ROOT}:${key}:response`, strResponse],
		[`${ROOT}:${key}:policy`, JSON.stringify(policy.toObject())],
		[`${ROOT}:${key}:ttl`, JSON.stringify(policy.timeToLive())],
	])

	if (bundled) {
		await AsyncStorage.setItem(`${ROOT}:${key}:bundled`, strResponse)
	}
}

// Does more magic: gets a Request from AsyncStorage
type GetItemResult = {response: Response, policy: ?CachePolicy}
async function getItem(key: string): Promise<GetItemResult> {
	let [[, response], [, policy]] = await AsyncStorage.multiGet([
		`${ROOT}:${key}:response`,
		`${ROOT}:${key}:policy`,
	])

	if (!response) {
		return {response, policy: null}
	}

	let {body, ...init} = JSON.parse(response)

	return {
		response: new Response(body, init),
		policy: CachePolicy.fromObject(JSON.parse(policy)),
	}
}

// Handles the case of no-data-yet-cached
async function handleInitialFetch(args: {request: Request, key: string}) {
	let {request, key} = args

	debug && console.log(`fetch(${request.url}): no policy cached; fetching`)

	// I explicitly want errors here to propagate. Why? Bundled data will have
	// an expired policy stored, so it won't hit this branch. Thus, the only
	// requests in here will have nothing to fall back to, so we need some way
	// to signal that an error happened.
	let response = await fetch(request)

	let cachePolicyRequest = requestForCachePolicy(request)
	let cachePolicyResponse = responseForCachePolicy(response)

	let policy = new CachePolicy(cachePolicyRequest, cachePolicyResponse)

	if (policy.storable()) {
		debug && console.log(`fetch(${request.url}): caching`)
		await cacheItem({key, response, policy})
	} else {
		debug && console.log(`fetch(${request.url}): not cachable`)
	}

	return response
}

type HandlePartialFetchArgs = {
	request: Request,
	oldResponse: Response,
	oldPolicy: CachePolicy,
	key: string,
}

// Handles the case of cached-and-fresh data
function handleCachedButStillFresh(args: HandlePartialFetchArgs) {
	let {request, oldResponse, oldPolicy} = args

	debug && console.log(`fetch(${request.url}): fresh; returning`)
	oldResponse.headers = new Headers(oldPolicy.responseHeaders())
	return oldResponse
}

// Handles the case of cached-but-stale data
async function handleStale(args: HandlePartialFetchArgs) {
	let {request, oldResponse, oldPolicy, key} = args

	debug && console.log(`fetch(${request.url}): stale; validating`)

	let cachePolicyRequest = requestForCachePolicy(request)

	let newResponse = null
	try {
		// Update the request to ask the origin server if the cached response can be used
		let newHeaders = oldPolicy.revalidationHeaders(cachePolicyRequest)
		request.headers = new Headers(newHeaders)

		// Send request to the origin server. The server may respond with status 304.
		newResponse = await fetch(request)
	} catch (error) {
		// "A fetch() promise only rejects when a network error is encountered [...] not on HTTP errors such as 404"
		// - https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch

		// We know there's data in the cache, or we wouldn't have hit this spot.
		// We've made the decision to return "stale" data if we're offline, so if
		// we have a network error, we just do an early return with the cached
		// data.

		debug && console.log(`fetch(${request.url}): offline; returning stale data`)
		oldResponse.headers = new Headers(oldPolicy.responseHeaders())
		return oldResponse
	}

	let newCachePolicyResponse = responseForCachePolicy(newResponse)

	// Create updated policy and combined response from the old and new data
	let {policy, modified} = oldPolicy.revalidatedPolicy(
		cachePolicyRequest,
		newCachePolicyResponse,
	)

	if (debug) {
		if (modified) {
			console.log(`fetch(${request.url}): validated; did change`)
		} else {
			console.log(`fetch(${request.url}): validated; 304 no change`)
		}
	}

	let response = modified ? newResponse : oldResponse

	// Update the cache with the newer/fresher response
	await cacheItem({key, policy, response})

	// And proceed returning cached response as usual
	response.headers = new Headers(policy.responseHeaders())

	debug && console.log(`fetch(${request.url}): returning updated response`)

	return response
}

// Returns the bundled response when in development
function handleBundledInDev(request: Request, bundledResponse: string) {
	debug &&
		console.log(`fetch(${request.url}): in dev mode; returning bundled data`)
	let {body, ...init} = JSON.parse(bundledResponse)
	return new Response(body, init)
}

// Requests an URL and retrieves it from the cache if possible
export async function cachedFetch(request: Request): Promise<Response> {
	let {url} = request

	let key = `urlcache:${url}`
	let {response: oldResponse, policy: oldPolicy} = await getItem(key)

	// If we're in dev, and there's bundled data, return it
	if (process.env.NODE_ENV === 'development') {
		let bundledResponse = await AsyncStorage.getItem(`${ROOT}:${key}:bundled`)
		if (bundledResponse) {
			return handleBundledInDev(request, bundledResponse)
		}
	}

	// If nothing has ever been cached, go fetch it
	if (!oldPolicy) {
		return handleInitialFetch({request, key})
	}

	// If we can re-use the cached data, return it; otherwise, we're serving requests from the cache
	if (oldPolicy.satisfiesWithoutRevalidation(requestForCachePolicy(request))) {
		return handleCachedButStillFresh({request, oldResponse, oldPolicy, key})
	}

	return handleStale({request, oldResponse, oldPolicy, key})
}
