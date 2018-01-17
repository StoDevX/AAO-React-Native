// @flow
import {AsyncStorage} from 'react-native'

export function clearAsyncStorage() {
	return AsyncStorage.clear()
}

/// MARK: Utilities

function setItem(key: string, value: mixed) {
	return AsyncStorage.setItem(`aao:${key}`, JSON.stringify(value))
}
function getItem(key: string): Promise<?any> {
	return AsyncStorage.getItem(`aao:${key}`).then(stored => JSON.parse(stored))
}
function removeItem(key: string): Promise<void> {
	return AsyncStorage.removeItem(`aao:${key}`)
}

/// MARK: Typed utility functions
// These simply cast the return value of getItem; they provide no runtime
// guarantees.

async function getItemAsBoolean(key: string): Promise<boolean> {
	return (await getItem(key)) || false
}
async function getItemAsArray(key: string): Promise<Array<*>> {
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

/// MARK: Credentials

const tokenValidKey = 'credentials:valid'
export function setTokenValid(valid: boolean) {
	return setItem(tokenValidKey, valid)
}
export function getTokenValid(): Promise<boolean> {
	return getItemAsBoolean(tokenValidKey)
}
export function clearTokenValid(): Promise<any> {
	return removeItem(tokenValidKey)
}

const credentialsValidKey = 'olafCredentials:valid'
export function setCredentialsValid(valid: boolean) {
	return setItem(credentialsValidKey, valid)
}
export function getCredentialsValid(): Promise<boolean> {
	return getItemAsBoolean(credentialsValidKey)
}

/// MARK: Favorite Buildings

const favoriteBuildingsKey = 'buildings:favorited'
export function setFavoriteBuildings(buildings: string[]) {
	return setItem(favoriteBuildingsKey, buildings)
}
export function getFavoriteBuildings(): Promise<Array<string>> {
	return getItemAsArray(favoriteBuildingsKey)
}
