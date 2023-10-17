import {
	clearAsyncStorage,
	getItemAsArray,
	getItemAsBoolean,
	getItemAsString,
	setItem,
	setStoragePrefix,
} from '@frogpond/storage'
import {AppConfigKey} from '@frogpond/app-config'
import type {FilterComboType} from '../views/sis/course-search/lib/format-filter-combo'
import type {CourseType, TermType} from './course-search/types'

export {clearAsyncStorage}

setStoragePrefix('aao:')

/// MARK: Feature flags

const featureFlagsKey = 'app:feature-flag'
export function setFeatureFlag(
	name: AppConfigKey,
	value: boolean,
): Promise<void> {
	const key = `${featureFlagsKey}:${name}`
	return setItem(key, value)
}
export function getFeatureFlag(name: AppConfigKey): Promise<boolean> {
	const key = `${featureFlagsKey}:${name}`
	return getItemAsBoolean(key)
}

/// MARK: Settings

const homescreenOrderKey = 'homescreen:view-order'
type homescreenOrderType = string[]
export function setHomescreenOrder(order: homescreenOrderType): Promise<void> {
	return setItem(homescreenOrderKey, order)
}
export function getHomescreenOrder(): Promise<homescreenOrderType> {
	return getItemAsArray(homescreenOrderKey)
}

const homescreenViewsKey = 'homescreen:disabled-views'
type homescreenViewsType = string[]
export function setDisabledViews(
	disabledViews: homescreenViewsType,
): Promise<void> {
	return setItem(homescreenViewsKey, disabledViews)
}
export function getDisabledViews(): Promise<homescreenViewsType> {
	return getItemAsArray(homescreenViewsKey)
}

const acknowledgementStatusKey = 'settings:ackd'
type acknowledgementStatusType = boolean
export function setAcknowledgementStatus(
	status: acknowledgementStatusType,
): Promise<void> {
	return setItem(acknowledgementStatusKey, status)
}
export function getAcknowledgementStatus(): Promise<acknowledgementStatusType> {
	return getItemAsBoolean(acknowledgementStatusKey)
}

const openLinksInAppKey = 'settings:open-links-in-app'
type openLinksInAppType = boolean
export function setLinkPreference(
	preference: openLinksInAppType,
): Promise<void> {
	return setItem(openLinksInAppKey, preference)
}
export function getInAppLinkPreference(): Promise<openLinksInAppType> {
	return getItemAsBoolean(openLinksInAppKey, true)
}

const serverAddressKey = 'settings:server-address'
type serverAddressType = string
export function setServerAddress(address: serverAddressType): Promise<void> {
	return setItem(serverAddressKey, address)
}
export function getServerAddress(): Promise<serverAddressType> {
	return getItemAsString(serverAddressKey)
}

/// MARK: Favorite Buildings

const favoriteBuildingsKey = 'buildings:favorited'
type favoriteBuildingsType = string[]
export function setFavoriteBuildings(
	buildings: favoriteBuildingsType,
): Promise<void> {
	return setItem(favoriteBuildingsKey, buildings)
}
export function getFavoriteBuildings(): Promise<favoriteBuildingsType> {
	return getItemAsArray(favoriteBuildingsKey)
}

const courseDataKey = 'sis:course-data'
type courseDataType = Array<CourseType>
export function setTermCourseData(
	term: number,
	courseData: courseDataType,
): Promise<void> {
	const key = courseDataKey + `:${term}:courses`
	return setItem(key, courseData)
}
export function getTermCourseData(term: number): Promise<courseDataType> {
	const key = courseDataKey + `:${term}:courses`
	return getItemAsArray(key)
}

const termInfoKey = courseDataKey + ':term-info'
type termInfoType = Array<TermType>
export function setTermInfo(termData: termInfoType): Promise<void> {
	return setItem(termInfoKey, termData)
}
export function getTermInfo(): Promise<termInfoType> {
	return getItemAsArray(termInfoKey)
}

const filterDataKey = courseDataKey + ':filter-data'
type filterDataType = string[]
export function setCourseFilterOption(
	name: string,
	data: filterDataType,
): Promise<void> {
	const key = filterDataKey + `:${name}`
	return setItem(key, data)
}
export function getCourseFilterOption(name: string): Promise<string[]> {
	const key = filterDataKey + `:${name}`
	return getItemAsArray(key)
}

const recentSearchesKey = 'courses:recent-searches'
type recentSearchesType = string[]
export function setRecentSearches(searches: recentSearchesType): Promise<void> {
	return setItem(recentSearchesKey, searches)
}
export function getRecentSearches(): Promise<recentSearchesType> {
	return getItemAsArray(recentSearchesKey)
}

const recentFiltersKey = 'courses:recent-filters'
type recentFiltersType = Array<FilterComboType>
export function setRecentFilters(combos: recentFiltersType): Promise<void> {
	return setItem(recentFiltersKey, combos)
}
export function getRecentFilters(): Promise<recentFiltersType> {
	return getItemAsArray(recentFiltersKey)
}
