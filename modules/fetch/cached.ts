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

export async function insertForUrl(url: string, data: any) {
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
type GetItemResult = {response: Response; policy?: CachePolicy}
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
