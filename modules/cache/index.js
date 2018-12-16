// @flow
import {AsyncStorage} from 'react-native'
import moment from 'moment'
import {reportNetworkProblem} from '@frogpond/analytics'
import delay from 'delay'

// global.AsyncStorage = AsyncStorage

type _BaseCacheResult<T> = {|
	isExpired: boolean,
	isCached: boolean,
	value: ?T,
|}

export type CacheResult<T> = Promise<_BaseCacheResult<T>>

function needsUpdate(time: Date, [count, unit]: [number, string]): boolean {
	return moment(time).isBefore(moment().subtract(count, unit))
}

function annotateCacheEntry({ts, ttl}: {ts: string, ttl: string}) {
	// handle uncached entries and entries that aren't caches, like the homescreen order
	if (!ts || !ttl) {
		return {isCached: true, isExpired: false}
	}

	return {
		isCached: true,
		isExpired: needsUpdate(new Date(ts), JSON.parse(ttl)),
	}
}

/// MARK: Utilities

const ROOT = 'fp'

async function setItem(
	key: string,
	value: any,
	{ttl}: {ttl?: [number, string]},
) {
	console.log('setItem', {key, value, ttl})
	await AsyncStorage.multiSet([
		[`${ROOT}:${key}:data`, JSON.stringify(value)],
		[`${ROOT}:${key}:ts`, new Date().toUTCString()],
		[`${ROOT}:${key}:ttl`, JSON.stringify(ttl)],
	])
}

async function getItem(key: string): CacheResult<any> {
	console.log('getItem', key)

	let [[, value], [, ts], [, ttl]] = await AsyncStorage.multiGet([
		`${ROOT}:${key}:data`,
		`${ROOT}:${key}:ts`,
		`${ROOT}:${key}:ttl`,
	])

	return {
		value: JSON.parse(value),
		...annotateCacheEntry({ts, ttl}),
	}
}

// global._setItem = setItem
// global._getItem = getItem
// global._fetchAndCacheItem = fetchAndCacheItem

export async function fetchAndCacheItem(args: {
	key: string,
	url?: string,
	cbForBundledData?: () => Promise<mixed>,
	ttl?: [number, string],
	afterFetch?: (parsed: any) => any,
	force?: boolean,
	delay?: boolean,
}): CacheResult<any> {
	let {
		key,
		url,
		cbForBundledData,
		ttl,
		afterFetch,
		force: shouldForce,
		delay: shouldDelay,
	} = args

	let start = Date.now()

	console.log('fetchAndCacheItem', {key, url, cbForBundledData, ttl})

	// if (process.env.NODE_ENV === 'development' && cbForBundledData) {
	// 	let data = await cbForBundledData()
	// 	await setItem(key, data, {source: url})
	// 	return getItem(key)
	// }

	let {value, isExpired, isCached} = await getItem(key)

	if (!isExpired && value != null && !shouldForce) {
		return {value, isCached, isExpired}
	}

	try {
		// try fetching first
		let body = await fetchJson(url)

		if (afterFetch) {
			body = afterFetch(body)
		}

		await setItem(key, body, {ttl})

		let elapsed = Date.now() - start
		if (shouldDelay && elapsed < 500) {
			// 0.5s delay for ListViews – if we let them go at full speed, it feels broken
			await delay(500 - elapsed)
		}

		return getItem(key)
	} catch (error) {
		// fall back to the local data
		if (error.message.startsWith('Failed to fetch')) {
			reportNetworkProblem(error)
		}

		// if there's no data still, return null
		if (!isCached) {
			if (cbForBundledData) {
				let data = await cbForBundledData()
				await setItem(key, data, {ttl})
				return getItem(key)
			}

			return {value: null, isCached, isExpired}
		}

		// if we have data, though, return it
		return {value, isCached, isExpired}
	}
}
