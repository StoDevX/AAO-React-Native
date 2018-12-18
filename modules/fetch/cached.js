// @flow
/* globals Request, Response */

import {AsyncStorage} from 'react-native'
import CachePolicy from 'http-cache-semantics'

const ROOT = 'fp'

async function serializeResponse(r: Request) {
	let {headers, status, statusText} = r
	let body = await r.clone().text()
	if ('entries' in headers) {
		headers = [...headers.entries()]
	}
	return {headers, status, statusText, body}
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

export async function cachedFetch(request: Request): Promise<Response> {
	let {url} = request

	let key = `urlcache:${url}`
	let {response: oldResponse, policy: oldPolicy} = await getItem(key)

	// if nothing has ever been cached, go fetch it
	if (!oldPolicy) {
		let response = await fetch(request)
		let policy = new CachePolicy(request, response)

		if (policy.storable()) {
			await cacheItem({key, response, policy})
		}

		return response
	}

	// if we can re-use the cached data, return it
	if (oldPolicy.satisfiesWithoutRevalidation(request)) {
		oldResponse.headers = oldPolicy.responseHeaders()
		return oldResponse
	}

	// otherwise, we're serving requests from the cache

	// Change the request to ask the origin server if the cached response can be used
	request.headers = oldPolicy.revalidationHeaders(request)

	// Send request to the origin server. The server may respond with status 304
	let newResponse = await fetch(request)

	// Create updated policy and combined response from the old and new data
	let {policy, modified} = oldPolicy.revalidatedPolicy(request, newResponse)

	let response = modified ? newResponse : oldResponse

	// Update the cache with the newer/fresher response
	await cacheItem({key, policy, response})

	// And proceed returning cached response as usual
	response.headers = policy.responseHeaders()
	return response
}
