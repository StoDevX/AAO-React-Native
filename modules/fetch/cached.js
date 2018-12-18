// @flow
/* globals Request, Response, Headers */

import {AsyncStorage} from 'react-native'
import CachePolicy from 'http-cache-semantics'
import fromPairs from 'lodash/fromPairs'

const ROOT = 'fp'

async function serializeResponse(r: Request) {
	let {headers, status, statusText} = r
	let body = await r.clone().text()
	if ('entries' in headers) {
		headers = [...headers.entries()]
	}
	return {headers, status, statusText, body}
}

function responseForCachePolicy(response: Response) {
	// Request and response must have a headers property with all header names
	// in lower case. url, status and method are optional (defaults are any
	// URL, status 200, and GET method).

	// const request = {
	//     url: '/',
	//     method: 'GET',
	//     headers: {
	//         accept: '*/*',
	//     },
	// };

	let {url, method, headers} = response

	// now we need to convert from a Headers object to an object-of-headers

	headers = fromPairs([...Object.entries(headers)])

	return {url, method, headers}
}

function requestForCachePolicy(request: Request) {
	// Request and response must have a headers property with all header names
	// in lower case. url, status and method are optional (defaults are any
	// URL, status 200, and GET method).

	// const response = {
	//     status: 200,
	//     headers: {
	//         'cache-control': 'public, max-age=7234',
	//     },
	// };

	let {status, headers} = request

	// now we need to convert from a Headers object to an object-of-headers

	headers = fromPairs([...Object.entries(headers)])

	return {status, headers}
}

function headersObjectToHeadersClass(headers: {[string]: string}) {
	let updatedHeaders = new Headers()
	for (let [key, value] of Object.entries(headers)) {
		updatedHeaders.append(key, value)
	}
	return updatedHeaders
}

async function cacheItem(args: {
	key: string,
	response: Response,
	policy: CachePolicy,
}) {
	let {key, response, policy} = args
	response = await serializeResponse(response)

	await AsyncStorage.multiSet([
		[`${ROOT}:${key}:response`, JSON.stringify(response)],
		[`${ROOT}:${key}:policy`, JSON.stringify(policy.toObject())],
		[`${ROOT}:${key}:ttl`, JSON.stringify(policy.timeToLive())],
	])
}

async function getItem(
	key: string,
): Promise<{response: Response, policy: ?CachePolicy}> {
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

// global.AsyncStorage = AsyncStorage
// global.getItem = getItem
// global.cachedFetch = cachedFetch

export async function cachedFetch(request: Request): Promise<Response> {
	let {url} = request

	let key = `urlcache:${url}`
	let {response: oldResponse, policy: oldPolicy} = await getItem(key)

	// if nothing has ever been cached, go fetch it
	if (!oldPolicy) {
		console.log(`fetch(${request.url}): no policy cached; fetching`)

		let response = await fetch(request)
		// console.log(response.headers)
		// global.xyz = response.headers
		let policy = new CachePolicy(requestForCachePolicy(request), responseForCachePolicy(response))

		if (policy.storable()) {
			console.log(`fetch(${request.url}): caching`)
			await cacheItem({key, response, policy})
		} else {
			console.log(`fetch(${request.url}): not cachable`)
		}

		return response
	}

	// if we can re-use the cached data, return it
	if (oldPolicy.satisfiesWithoutRevalidation(requestForCachePolicy(request))) {
		console.log(`fetch(${request.url}): fresh; returning`)
		oldResponse.headers = headersObjectToHeadersClass(oldPolicy.responseHeaders())
		return oldResponse
	}

	// otherwise, we're serving requests from the cache

	// Change the request to ask the origin server if the cached response can be used
	request.headers = headersObjectToHeadersClass(oldPolicy.revalidationHeaders(requestForCachePolicy(request)))

	// console.log('revalidationHeaders', oldPolicy.revalidationHeaders(request))
	// console.log('old headers', oldPolicy._resHeaders)

	console.log(`fetch(${request.url}): stale; validating`)

	// Send request to the origin server. The server may respond with status 304
	let newResponse = await fetch(request)

	// Create updated policy and combined response from the old and new data
	let {policy, modified} = oldPolicy.revalidatedPolicy(requestForCachePolicy(request), responseForCachePolicy(newResponse))

	if (modified) {
		console.log(`fetch(${request.url}): validated; did change`)
		console.log('old', oldPolicy.responseHeaders())
		console.log('new', policy.responseHeaders())
	} else {
		console.log(`fetch(${request.url}): validated; 304 no change`)
	}

	let response = modified ? newResponse : oldResponse

	// Update the cache with the newer/fresher response
	await cacheItem({key, policy, response})

	// And proceed returning cached response as usual
	response.headers = headersObjectToHeadersClass(policy.responseHeaders())

	console.log(`fetch(${request.url}): returning updated response`)

	return response
}
