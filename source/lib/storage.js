// @flow
import {AsyncStorage} from 'react-native'

export function clearAsyncStorage() {
	return AsyncStorage.clear()
}

/// MARK: Utilities

// eslint-disable-next-line no-unused-vars
function setItem(key: string, value: mixed) {
	return AsyncStorage.setItem(`aao:${key}`, JSON.stringify(value))
}
// eslint-disable-next-line no-unused-vars
function getItem(key: string): Promise<?any> {
	return AsyncStorage.getItem(`aao:${key}`).then(stored => JSON.parse(stored))
}
// eslint-disable-next-line no-unused-vars
function removeItem(key: string): Promise<void> {
	return AsyncStorage.removeItem(`aao:${key}`)
}

/// MARK: Typed utility functions
// These simply cast the return value of getItem; they provide no runtime
// guarantees.

async function getItemAsBoolean(key: string): Promise<boolean> {
	return (await getItem(key)) || false
}
async function getItemAsArray<T>(key: string): Promise<Array<T>> {
	return (await getItem(key)) || []
}

/// MARK: Settings

const analyticsOptOutKey = 'settings:opt-out'
export function setAnalyticsOptOut(status: boolean) {
	return setItem(analyticsOptOutKey, status)
}
export function getAnalyticsOptOut(): Promise<boolean> {
	return getItemAsBoolean(analyticsOptOutKey)
}

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
