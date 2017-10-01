// @flow
import {AsyncStorage} from 'react-native'

export function clearAsyncStorage() {
  return AsyncStorage.clear()
}

/// MARK: Utilities

function setItem(key: string, value: any) {
  return AsyncStorage.setItem(`aao:${key}`, JSON.stringify(value))
}
function getItem(key: string): Promise<any> {
  return AsyncStorage.getItem(`aao:${key}`).then(stored => JSON.parse(stored))
}
function removeItem(key: string): Promise<any> {
  return AsyncStorage.removeItem(`aao:${key}`)
}

/// MARK: Settings

const analyticsOptOutKey = 'settings:opt-out'
export function setAnalyticsOptOut(status: boolean) {
  return setItem(analyticsOptOutKey, status)
}
export function getAnalyticsOptOut(): Promise<boolean> {
  return getItem(analyticsOptOutKey)
}

const homescreenOrderKey = 'homescreen:view-order'
export function setHomescreenOrder(order: string[]) {
  return setItem(homescreenOrderKey, order)
}
export function getHomescreenOrder(): Promise<string[]> {
  return getItem(homescreenOrderKey)
}

const acknowledgementStatusKey = 'settings:ackd'
export function setAcknowledgementStatus(status: boolean) {
  return setItem(acknowledgementStatusKey, status)
}
export function getAcknowledgementStatus(): Promise<?boolean> {
  return getItem(acknowledgementStatusKey)
}

/// MARK: Credentials

const tokenValidKey = 'credentials:valid'
export function setTokenValid(valid: boolean) {
  return setItem(tokenValidKey, valid)
}
export function getTokenValid(): Promise<boolean> {
  return getItem(tokenValidKey)
}
export function clearTokenValid(): Promise<any> {
  return removeItem(tokenValidKey)
}

const credentialsValidKey = 'olafCredentials:valid'
export function setCredentialsValid(valid: boolean) {
  return setItem(credentialsValidKey, valid)
}
export function getCredentialsValid(): Promise<boolean> {
  return getItem(credentialsValidKey)
}
