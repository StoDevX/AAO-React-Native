import AsyncStorage from '@react-native-async-storage/async-storage'
import CachePolicy from 'http-cache-semantics'
import fromPairs from 'lodash/fromPairs'

const ROOT = 'fp'

interface StorableResponse {
	readonly headers: Headers
	readonly status: number
	readonly statusText: string
	readonly body: string
}

// Pulls out the important bits from a Response for storage
async function serializeResponse(r: Response): Promise<StorableResponse> {
	let {headers, status, statusText} = r
	let body = await r.clone().text()
	return {headers, status, statusText, body}
}

// Converts a react-native Headers instance into a plain object for http-cache-semantics
function headersInstanceToObject(headers: Headers): CachePolicy.Headers {
	return fromPairs([...Object.entries(headers)])
}

// Convert a react-native Request into a CachePolicy.Request for http-cache-semantics.
function requestForCachePolicy({
	url,
	method,
	headers,
}: Request): CachePolicy.Request {
	// CachePolicy.Request must have a headers property with all header names in lower
	// case. `url` and `method` are optional.

	return {url, method, headers: headersInstanceToObject(headers)}
}

// Convert a react-native Response into a CachePolicy.Response for http-cache-semantics.
function responseForCachePolicy({
	status,
	headers,
}: Response): CachePolicy.Response {
	// CachePolicy.Response must have a headers property with all header names in lower
	// case. `url` and `status` are optional.

	return {status, headers: headersInstanceToObject(headers)}
}

export async function insertForUrl(url: string, data: unknown): Promise<void> {
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
	key: string
	response: Response
	policy: CachePolicy
	bundled?: boolean
}
async function cacheItem({
	key,
	response,
	policy,
	bundled,
}: CacheItemArgs): Promise<void> {
	let storableResponse = await serializeResponse(response)

	let strResponse = JSON.stringify(storableResponse)
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
type GetItemResult = {response: Response; policy?: CachePolicy}
async function getItem(key: string): Promise<GetItemResult> {
	let [[, response], [, policy]] = await AsyncStorage.multiGet([
		`${ROOT}:${key}:response`,
		`${ROOT}:${key}:policy`,
	])

	if (!response) {
		// TODO: This line used to just return the `response`, which has a type of `string`.
		// We return a promise, so can't we just reject? :-)  Regardless, make TypeScript
		// treat this like the type error it was supposed to be.
		return {response: undefined as unknown as Response, policy: undefined}
	}

	let {body, ...init} = JSON.parse(response)

	return {
		response: new Response(body, init),
		policy: CachePolicy.fromObject(JSON.parse(policy ?? '{}')),
	}
}
