import type {Moment} from 'moment-timezone'
import type {QueryKey} from '@tanstack/react-query'

import {campusById, type CampusId} from '../../campuses'
import {queryClient} from '../../init/tanstack-query'
import {buildingsOptions} from '../building-hours/query'
import {bonAppMeals} from '../menus/lib/bonapp-meals'
import {cafeTabsOf, menuServerOf} from '../menus/menu-tabs'
import {bonAppMenuOptions, prepareFood} from '../menus/query'
import {specialsAnswer, UNAVAILABLE_SPECIALS} from './answers'
import {buildDirectory, type HotlineMenu} from './directory'
import {hallsOf, type HotlineHall} from './halls'

/**
 * How long the call waits on the network. Offline, a query pauses rather than
 * failing, so without a limit the phone would ring forever.
 */
const LOAD_TIMEOUT_MS = 8_000

/** `promise`, or a rejection once `ms` have passed without it settling. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	return new Promise((resolve, reject) => {
		let timer = setTimeout(() => reject(new Error('timed out')), ms)
		promise.then(
			(value) => {
				clearTimeout(timer)
				resolve(value)
			},
			(error: unknown) => {
				clearTimeout(timer)
				reject(error)
			},
		)
	})
}

/**
 * A query's data as the screens that own it would load it now, or what they
 * last cached when it cannot be had in time, as offline.
 */
async function freshOrCached<T>(
	fetch: () => Promise<T>,
	queryKey: QueryKey,
): Promise<T | undefined> {
	try {
		return await withTimeout(fetch(), LOAD_TIMEOUT_MS)
	} catch {
		return queryClient.getQueryData<T>(queryKey)
	}
}

/** One dining hall's specials answer, or the apology when its menu cannot be had. */
async function hallSpecials(
	campus: CampusId,
	{title, cafe, ignoreProvidedMenus}: HotlineHall,
	now: Moment,
): Promise<{name: string; specials: string}> {
	let server = menuServerOf(campusById(campus))
	let options = bonAppMenuOptions(server, cafe, now.format('YYYY-MM-DD'))
	let menu = await freshOrCached(() => queryClient.query(options), options.queryKey)
	if (!menu) {
		return {name: title, specials: UNAVAILABLE_SPECIALS(title)}
	}
	let items = prepareFood(menu)
	let meals = bonAppMeals(menu, items, {ignoreProvidedMenus})
	return {name: title, specials: specialsAnswer(title, meals, items, now)}
}

/**
 * The hotline's tree for `campus` at `now`, from the same queries as the Hours
 * and Menus screens. Null when the campus's hours cannot be had at all; a hall
 * whose menu cannot be had says so in its own answer instead.
 */
export async function loadDirectory(campus: CampusId, now: Moment): Promise<HotlineMenu | null> {
	let halls = hallsOf(cafeTabsOf(campus)).map((hall) => hallSpecials(campus, hall, now))
	let hours = buildingsOptions(campus)
	let [buildings, ...specials] = await Promise.all([
		freshOrCached(() => queryClient.query(hours), hours.queryKey),
		...halls,
	])
	return buildings ? buildDirectory({halls: specials, buildings, now}) : null
}
