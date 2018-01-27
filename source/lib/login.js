// @flow
import {
	setInternetCredentials,
	getInternetCredentials,
	resetInternetCredentials,
} from 'react-native-keychain'

import * as storage from './storage'
import buildFormData from './formdata'
import {OLECARD_AUTH_URL} from './financials/urls'

const SIS_LOGIN_KEY = 'stolaf.edu'

const empty = () => ({})

type Credentials = {username?: string, password?: string}
export function saveLoginCredentials({username, password}: Credentials) {
	return setInternetCredentials(SIS_LOGIN_KEY, username, password).catch(empty)
}
export function loadLoginCredentials(): Promise<Credentials> {
	return getInternetCredentials(SIS_LOGIN_KEY).catch(empty)
}
export function clearLoginCredentials() {
	return resetInternetCredentials(SIS_LOGIN_KEY).catch(empty)
}

export async function isLoggedIn(): Promise<boolean> {
	const result = await Promise.all([
		storage.getTokenValid(),
		storage.getCredentialsValid(),
	])
	return result.every(result => result === true)
}

export async function performLogin(
	{username, password}: Credentials,
	{attempts = 3}: {attempts: number} = {},
): Promise<boolean> {
	if (!username || !password) {
		return false
	}

	const form = buildFormData({username, password})
	let loginResult = null
	try {
		loginResult = await fetch(OLECARD_AUTH_URL, {
			method: 'POST',
			body: form,
		})
	} catch (err) {
		const networkFailure = err.message === 'Network request failed'
		if (networkFailure && attempts > 0) {
			// console.log(`login failed; trying ${attempts - 1} more time(s)`)
			return performLogin({username, password}, {attempts: attempts - 1})
		}
		return false
	}

	const page = await loginResult.text()

	if (page.includes('Password')) {
		await storage.setCredentialsValid(false)
		return false
	}

	await Promise.all([
		saveLoginCredentials({username, password}),
		storage.setCredentialsValid(true),
	])

	return true
}
