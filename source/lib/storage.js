// @flow

import {
	setItem,
	clearAsyncStorage,
	removeItem,
	getItemAsBoolean,
	getItemAsArray,
	setStoragePrefix,
} from '@frogpond/storage'

export {clearAsyncStorage}

export {getAnalyticsOptOut, setAnalyticsOptOut} from '@frogpond/analytics'

setStoragePrefix('aao:')

/// MARK: Settings

const homescreenOrderKey = 'homescreen:view-order'
export function setHomescreenOrder(order: string[]) {
	return setItem(homescreenOrderKey, order)
}
export function getHomescreenOrder(): Promise<Array<string>> {
	return getItemAsArray(homescreenOrderKey)
}

const homescreenViewsKey = 'homescreen:disabled-views'
export function setDisabledViews(disabledViews: string[]) {
	return setItem(homescreenViewsKey, disabledViews)
}
export function getDisabledViews(): Promise<Array<string>> {
	return getItemAsArray(homescreenViewsKey)
}

const acknowledgementStatusKey = 'settings:ackd'
export function setAcknowledgementStatus(status: boolean) {
	return setItem(acknowledgementStatusKey, status)
}
export function getAcknowledgementStatus(): Promise<boolean> {
	return getItemAsBoolean(acknowledgementStatusKey)
}

/// MARK: Favorite Buildings

const favoriteBuildingsKey = 'buildings:favorited'
export function setFavoriteBuildings(buildings: string[]) {
	return setItem(favoriteBuildingsKey, buildings)
}
export function getFavoriteBuildings(): Promise<Array<string>> {
	return getItemAsArray(favoriteBuildingsKey)
}

/// MARK: SIS
import type {FilterComboType} from '../views/sis/course-search/lib/format-filter-combo'
import type {CourseType, TermType} from './course-search/types'

const courseDataKey = 'sis:course-data'
export function setTermCourseData(term: number, courseData: Array<CourseType>) {
	const key = courseDataKey + `:${term}:courses`
	return setItem(key, courseData)
}
export function getTermCourseData(term: number): Promise<Array<CourseType>> {
	const key = courseDataKey + `:${term}:courses`
	return getItemAsArray(key)
}
const termInfoKey = courseDataKey + ':term-info'
export function setTermInfo(termData: Array<TermType>) {
	return setItem(termInfoKey, termData)
}
export function getTermInfo(): Promise<Array<TermType>> {
	return getItemAsArray(termInfoKey)
}
const filterDataKey = courseDataKey + ':filter-data'
export function setCourseFilterOption(name: string, data: string[]) {
	const key = filterDataKey + `:${name}`
	return setItem(key, data)
}
export function getCourseFilterOption(name: string): Promise<Array<string>> {
	const key = filterDataKey + `:${name}`
	return getItemAsArray(key)
}

const recentSearchesKey = 'courses:recent-searches'
export function setRecentSearches(searches: string[]) {
	return setItem(recentSearchesKey, searches)
}
export function getRecentSearches(): Promise<Array<string>> {
	return getItemAsArray(recentSearchesKey)
}

const recentFiltersKey = 'courses:recent-filters'
export function setRecentFilters(combos: Array<FilterComboType>) {
	return setItem(recentFiltersKey, combos)
}
export function getRecentFilters(): Promise<Array<FilterComboType>> {
	return getItemAsArray(recentFiltersKey)
}
