// @flow
import {AsyncStorage} from 'react-native'
import moment from 'moment'
import {GH_PAGES_URL, WEEKLY_MOVIE_URL} from '../globals'

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

/// MARK: courses

const studentNumberKey = 'courses:student-number'
const studentNumberCacheTime = [1, 'week']
export function setStudentNumber(idNumbers: number) {
	return setItem(studentNumberKey, idNumbers, studentNumberCacheTime)
}
export function getStudentNumber(): CacheResultType<number> {
	return getItem(studentNumberKey)
}

const coursesKey = 'courses'
const coursesCacheTime = [1, 'hour']
import {type CoursesByTermType} from './courses/types'
export function setAllCourses(courses: CoursesByTermType) {
	return setItem(coursesKey, courses, coursesCacheTime)
}
export function getAllCourses(): CacheResultType<?CoursesByTermType> {
	return getItem(coursesKey)
}

/// MARK: Financials

const flexBalanceKey = 'financials:flex'
const flexBalanceCacheTime = [5, 'minutes']
export function setFlexBalance(balance: ?string) {
	return setItem(flexBalanceKey, balance, flexBalanceCacheTime)
}
export function getFlexBalance(): CacheResultType<?string> {
	return getItem(flexBalanceKey)
}

const oleBalanceKey = 'financials:ole'
const oleBalanceCacheTime = [5, 'minutes']
export function setOleBalance(balance: ?string) {
	return setItem(oleBalanceKey, balance, oleBalanceCacheTime)
}
export function getOleBalance(): CacheResultType<?string> {
	return getItem(oleBalanceKey)
}

const printBalanceKey = 'financials:print'
const printBalanceCacheTime = [5, 'minutes']
export function setPrintBalance(balance: ?string) {
	return setItem(printBalanceKey, balance, printBalanceCacheTime)
}
export function getPrintBalance(): CacheResultType<?string> {
	return getItem(printBalanceKey)
}

const dailyMealsKey = 'meals:daily'
const dailyMealsCacheTime = [5, 'minutes']
export function setDailyMealInfo(dailyMeals: ?string) {
	return setItem(dailyMealsKey, dailyMeals, dailyMealsCacheTime)
}
export function getDailyMealInfo(): CacheResultType<?string> {
	return getItem(dailyMealsKey)
}

const weeklyMealsKey = 'meals:weekly'
const weeklyMealsCacheTime = [5, 'minutes']
export function setWeeklyMealInfo(weeklyMeals: ?string) {
	return setItem(weeklyMealsKey, weeklyMeals, weeklyMealsCacheTime)
}
export function getWeeklyMealInfo(): CacheResultType<?string> {
	return getItem(weeklyMealsKey)
}

const mealPlanKey = 'meals:plan'
const mealPlanCacheTime = [5, 'minutes']
export function setMealPlanInfo(mealPlanName: ?string) {
	return setItem(mealPlanKey, mealPlanName, mealPlanCacheTime)
}
export function getMealPlanInfo(): CacheResultType<?string> {
	return getItem(mealPlanKey)
}

type BalancesInputType = {
	flex: ?string,
	ole: ?string,
	print: ?string,
	daily: ?string,
	weekly: ?string,
	plan: ?string,
}
export function setBalances({
	flex,
	ole,
	print,
	daily,
	weekly,
	plan,
}: BalancesInputType) {
	return Promise.all([
		setFlexBalance(flex),
		setOleBalance(ole),
		setPrintBalance(print),
		setDailyMealInfo(daily),
		setWeeklyMealInfo(weekly),
		setMealPlanInfo(plan),
	])
}

type BalancesOutputType = {
	flex: BaseCacheResultType<?string>,
	ole: BaseCacheResultType<?string>,
	print: BaseCacheResultType<?string>,
	daily: BaseCacheResultType<?string>,
	weekly: BaseCacheResultType<?string>,
	plan: BaseCacheResultType<?string>,
	_isExpired: boolean,
	_isCached: boolean,
}
export async function getBalances(): Promise<BalancesOutputType> {
	const [flex, ole, print, daily, weekly, plan] = await Promise.all([
		getFlexBalance(),
		getOleBalance(),
		getPrintBalance(),
		getDailyMealInfo(),
		getWeeklyMealInfo(),
		getMealPlanInfo(),
	])

	const _isExpired =
		flex.isExpired ||
		ole.isExpired ||
		print.isExpired ||
		daily.isExpired ||
		weekly.isExpired ||
		plan.isExpired
	const _isCached =
		flex.isCached ||
		ole.isCached ||
		print.isCached ||
		daily.isCached ||
		weekly.isCached ||
		plan.isCached

	return {flex, ole, print, daily, weekly, plan, _isExpired, _isCached}
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
	return fetchJson(GH_PAGES_URL('help.json'))
}
export async function fetchHelpTools(
	isOnline: boolean,
): Promise<Array<ToolOptions>> {
	const cachedValue = await getHelpTools()

	if (process.env.NODE_ENV === 'development') {
		return fetchHelpToolsBundled()
	}

	if (!isOnline) {
		if (cachedValue.isCached && cachedValue.value) {
			return cachedValue.value
		}
		return fetchHelpToolsBundled()
	}

	if (!cachedValue.isExpired && cachedValue.value) {
		return cachedValue.value
	}

	const request = await fetchHelpToolsRemote()
	await setHelpTools(request.data)

	return request.data
}

/// MARK: Weekly Movie

type MaybeError<T> = {error: true, message: string} | {error: false, data: T}

const weeklyMovieKey = 'streaming:movie:current'
const weeklyMovieCacheTime = [4, 'hours']
import {type Movie as WeeklyMovie} from '../views/streaming/movie/types'
export function setWeeklyMovie(movieInfo: WeeklyMovie) {
	return setItem(weeklyMovieKey, movieInfo, weeklyMovieCacheTime)
}
export function getWeeklyMovie(): CacheResultType<?WeeklyMovie> {
	return getItem(weeklyMovieKey)
}
async function fetchWeeklyMovieRemote(): Promise<MaybeError<WeeklyMovie>> {
	try {
		console.log(WEEKLY_MOVIE_URL('next.json'))
		const nextMovie = await fetchJson(WEEKLY_MOVIE_URL('next.json'))
		console.log(nextMovie)
		const movieInfo = await fetchJson(nextMovie.movie)
		return {error: false, data: movieInfo}
	} catch (err) {
		console.error(JSON.stringify(err))
		return {error: true, message: err.message}
	}
}
export async function fetchWeeklyMovie(
	isOnline: boolean,
): Promise<MaybeError<WeeklyMovie>> {
	const cachedValue = await getWeeklyMovie()

	if (process.env.NODE_ENV !== 'development') {
		if (!isOnline) {
			if (cachedValue.isCached && cachedValue.value) {
				return {error: false, data: cachedValue.value}
			}
			return {error: true, message: 'You are currently offline'}
		}

		if (!cachedValue.isExpired && cachedValue.value) {
			return {error: false, data: cachedValue.value}
		}
	}

	const request = await fetchWeeklyMovieRemote()
	if (request.error) {
		return {error: true, message: request.message}
	}
	await setWeeklyMovie(request.data)

	return {error: false, data: request.data}
}
