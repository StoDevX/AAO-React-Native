// @flow
import {AsyncStorage} from 'react-native'
import moment from 'moment'
import {API} from '@frogpond/api'

type BaseCacheResultType<T> = {
	isExpired: boolean,
	isCached: boolean,
	value: ?T,
}

type CacheResultType<T> = Promise<BaseCacheResultType<T>>

function needsUpdate(time: Date, [count, unit]: [number, string]): boolean {
	return moment(time).isBefore(moment().subtract(count, unit))
}

function annotateCacheEntry(stored) {
	// if nothing's stored, note that it's expired and not cached
	if (stored === null || stored === undefined) {
		return {isCached: false, isExpired: true, value: null}
	}

	// migration from old storage
	if (
		!('dateCached' in stored && 'timeToCache' in stored && 'value' in stored)
	) {
		return {isCached: true, isExpired: true, value: stored}
	}

	// handle AsyncStorage entries that aren't caches, like the homescreen order
	if (!stored.timeToCache) {
		return {isCached: true, isExpired: false, value: stored.value}
	}

	const date = new Date(stored.dateCached)
	const isExpired = needsUpdate(date, stored.timeToCache)
	return {isCached: true, isExpired, value: stored.value}
}

/// MARK: Utilities

function setItem(key: string, value: any, cacheTime?: [number, string]) {
	const dataToStore = {
		dateCached: new Date().toUTCString(),
		timeToCache: cacheTime,
		value: value,
	}
	return AsyncStorage.setItem(`aao:${key}`, JSON.stringify(dataToStore))
}
function getItem(key: string): CacheResultType<any> {
	return AsyncStorage.getItem(`aao:${key}`).then(stored =>
		annotateCacheEntry(JSON.parse(stored)),
	)
}

/// MARK: Help tools

const helpToolsKey = 'help:tools'
const helpToolsCacheTime = [1, 'hour']
import {type ToolOptions} from '../views/help/types'
const {data: helpData} = require('../../docs/help.json')
export function setHelpTools(tools: Array<ToolOptions>) {
	return setItem(helpToolsKey, tools, helpToolsCacheTime)
}
export function getHelpTools(): CacheResultType<?Array<ToolOptions>> {
	return getItem(helpToolsKey)
}
function fetchHelpToolsBundled(): Promise<Array<ToolOptions>> {
	return Promise.resolve(helpData)
}
function fetchHelpToolsRemote(): Promise<{data: Array<ToolOptions>}> {
	return fetchJson(API('/tools/help'))
}
export async function fetchHelpTools(): Promise<Array<ToolOptions>> {
	const cachedValue = await getHelpTools()

	if (process.env.NODE_ENV === 'development') {
		return fetchHelpToolsBundled()
	}

	if (!cachedValue.isExpired && cachedValue.value) {
		return cachedValue.value
	}

	try {
		const request = await fetchHelpToolsRemote()
		await setHelpTools(request.data)

		return request.data
	} catch (error) {
		if (cachedValue.isCached && cachedValue.value) {
			return cachedValue.value
		}
		return fetchHelpToolsBundled()
	}
}
