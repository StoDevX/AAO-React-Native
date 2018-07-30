// @flow
import {AsyncStorage} from 'react-native'
import moment from 'moment'
import {GH_PAGES_URL} from '../globals'

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
