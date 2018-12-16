// @flow
import {AsyncStorage} from 'react-native'
import moment from 'moment'
import {reportNetworkProblem} from '@frogpond/analytics'
import delay from 'delay'

// global.AsyncStorage = AsyncStorage

type _BaseCacheResult<T> = {
	isExpired: boolean,
	isCached: boolean,
	value: ?T,
	source: ?string,
}

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

async function setItem(
	key: string,
	value: any,
	{ttl, source}: {ttl?: [number, string], source?: string},
) {
	console.log('setItem', {key, value, ttl, source})
	await AsyncStorage.multiSet([
		[`fp:${key}:data`, JSON.stringify(value)],
		[`fp:${key}:ts`, new Date().toUTCString()],
		[`fp:${key}:ttl`, JSON.stringify(ttl)],
		[`fp:${key}:source`, source],
	])
}

async function getItem(key: string): CacheResult<any> {
	console.log('getItem', key)

	let [[, value], [, ts], [, ttl], [, source]] = await AsyncStorage.multiGet([
		`fp:${key}:data`,
		`fp:${key}:ts`,
		`fp:${key}:ttl`,
		`fp:${key}:source`,
	])

	return {
		value: JSON.parse(value),
		source,
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

	let {value, isExpired, isCached, source} = await getItem(key)

	if (!isExpired && value != null && !shouldForce) {
		return {value, isCached, isExpired, source}
	}

	if (!source && url) {
		source = url
	}

	try {
		// try fetching first
		let body = await fetchJson(url)

		if (afterFetch) {
			body = afterFetch(body)
		}

		await setItem(key, body, {source: url, ttl})

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
				await setItem(key, data, {source: url, ttl})
				return getItem(key)
			}

			return {value: null, isCached, isExpired, source}
		}

		// if we have data, though, return it
		return {value, isCached, isExpired, source}
	}
}
