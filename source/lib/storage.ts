import {
	getItem,
	setItem,
	clearAsyncStorage,
	getItemAsBoolean,
	getItemAsArray,
	setStoragePrefix,
} from '@frogpond/storage'

export {clearAsyncStorage}

setStoragePrefix('aao:')

/// MARK: Settings

const homescreenOrderKey = 'homescreen:view-order'
export function setHomescreenOrder(order: string[]): Promise<void> {
	return setItem(homescreenOrderKey, order)
}
export function getHomescreenOrder(): Promise<Array<string>> {
	return getItemAsArray(homescreenOrderKey)
}

const homescreenViewsKey = 'homescreen:disabled-views'
export function setDisabledViews(disabledViews: string[]): Promise<void> {
	return setItem(homescreenViewsKey, disabledViews)
}
export function getDisabledViews(): Promise<Array<string>> {
	return getItemAsArray(homescreenViewsKey)
}

const acknowledgementStatusKey = 'settings:ackd'
export function setAcknowledgementStatus(status: boolean): Promise<void> {
	return setItem(acknowledgementStatusKey, status)
}
export function getAcknowledgementStatus(): Promise<boolean> {
	return getItemAsBoolean(acknowledgementStatusKey)
}

const serverAddressKey = 'settings:server-address'
export function setServerAddress(address: string): Promise<void> {
	return setItem(serverAddressKey, address)
}
export function getServerAddress(): Promise<string> {
	return getItem(serverAddressKey)
}

/// MARK: Favorite Buildings

const favoriteBuildingsKey = 'buildings:favorited'
export function setFavoriteBuildings(buildings: string[]): Promise<void> {
	return setItem(favoriteBuildingsKey, buildings)
}
export function getFavoriteBuildings(): Promise<Array<string>> {
	return getItemAsArray(favoriteBuildingsKey)
}

/// MARK: SIS
import type {FilterComboType} from '../views/sis/course-search/lib/format-filter-combo'
import type {CourseType, TermType} from './course-search/types'

const courseDataKey = 'sis:course-data'
export function setTermCourseData(
	term: number,
	courseData: Array<CourseType>,
): Promise<void> {
	const key = courseDataKey + `:${term}:courses`
	return setItem(key, courseData)
}
export function getTermCourseData(term: number): Promise<Array<CourseType>> {
	const key = courseDataKey + `:${term}:courses`
	return getItemAsArray(key)
}
const termInfoKey = courseDataKey + ':term-info'
export function setTermInfo(termData: Array<TermType>): Promise<void> {
	return setItem(termInfoKey, termData)
}
export function getTermInfo(): Promise<Array<TermType>> {
	return getItemAsArray(termInfoKey)
}
const filterDataKey = courseDataKey + ':filter-data'
export function setCourseFilterOption(
	name: string,
	data: string[],
): Promise<void> {
	const key = filterDataKey + `:${name}`
	return setItem(key, data)
}
export function getCourseFilterOption(name: string): Promise<Array<string>> {
	const key = filterDataKey + `:${name}`
	return getItemAsArray(key)
}

const recentSearchesKey = 'courses:recent-searches'
export function setRecentSearches(searches: string[]): Promise<void> {
	return setItem(recentSearchesKey, searches)
}
export function getRecentSearches(): Promise<Array<string>> {
	return getItemAsArray(recentSearchesKey)
}

const recentFiltersKey = 'courses:recent-filters'
export function setRecentFilters(
	combos: Array<FilterComboType>,
): Promise<void> {
	return setItem(recentFiltersKey, combos)
}
export function getRecentFilters(): Promise<Array<FilterComboType>> {
	return getItemAsArray(recentFiltersKey)
}
