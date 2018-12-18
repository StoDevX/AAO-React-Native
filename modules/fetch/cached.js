// @flow
/* globals Request, Response, Headers */

import {AsyncStorage} from 'react-native'
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
	let resp = new Response(JSON.stringify(data), {
		status: 200,
		headers: new Headers({}),
	})
	let policy = new CachePolicy(
		requestForCachePolicy(req),
		responseForCachePolicy(resp),
	)

	return cacheItem({key, response: resp, policy})
}

// Does the magic: stores a Request into AsyncStorage
type CacheItemArgs = {key: string, response: Response, policy: CachePolicy}
async function cacheItem({key, response, policy}: CacheItemArgs) {
	response = await serializeResponse(response)

	await AsyncStorage.multiSet([
		[`${ROOT}:${key}:response`, JSON.stringify(response)],
		[`${ROOT}:${key}:policy`, JSON.stringify(policy.toObject())],
		[`${ROOT}:${key}:ttl`, JSON.stringify(policy.timeToLive())],
	])
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

// Requests an URL and retrieves it from the cache if possible
export async function cachedFetch(request: Request): Promise<Response> {
	let {url} = request

	let cachePolicyRequest = requestForCachePolicy(request)

	let key = `urlcache:${url}`
	let {response: oldResponse, policy: oldPolicy} = await getItem(key)

	// If nothing has ever been cached, go fetch it
	if (!oldPolicy) {
		debug && console.log(`fetch(${request.url}): no policy cached; fetching`)

		let response = await fetch(request)
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

	// If we can re-use the cached data, return it; otherwise, we're serving requests from the cache
	if (oldPolicy.satisfiesWithoutRevalidation(cachePolicyRequest)) {
		debug && console.log(`fetch(${request.url}): fresh; returning`)
		oldResponse.headers = new Headers(oldPolicy.responseHeaders())
		return oldResponse
	}

	// Update the request to ask the origin server if the cached response can be used
	request.headers = new Headers(
		oldPolicy.revalidationHeaders(cachePolicyRequest),
	)

	debug && console.log(`fetch(${request.url}): stale; validating`)

	// Send request to the origin server. The server may respond with status 304
	let newResponse = await fetch(request)
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
