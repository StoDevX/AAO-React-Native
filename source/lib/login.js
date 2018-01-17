// @flow
import * as Keychain from 'react-native-keychain'

import * as storage from './storage'
import buildFormData from './formdata'
import {OLECARD_AUTH_URL} from './financials/urls'

const SIS_LOGIN_CREDENTIAL_KEY = 'stolaf.edu'

export function saveLoginCredentials(username: string, password: string) {
	return Keychain.setInternetCredentials(
		SIS_LOGIN_CREDENTIAL_KEY,
		username,
		password,
	).catch(() => ({}))
}
export function loadLoginCredentials(): Promise<{
	username?: string,
	password?: string,
}> {
	return Keychain.getInternetCredentials(SIS_LOGIN_CREDENTIAL_KEY).catch(
		() => ({}),
	)
}
export function clearLoginCredentials() {
	return Keychain.resetInternetCredentials(SIS_LOGIN_CREDENTIAL_KEY).catch(
		() => ({}),
	)
}

export async function isLoggedIn(): Promise<boolean> {
	const result = await Promise.all([
		storage.getTokenValid(),
		storage.getCredentialsValid(),
	])
	return result.every(result => result === true)
}

export async function performLogin(
	username?: string,
	password?: string,
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
		return false
	}

	const page = await loginResult.text()

	if (page.includes('Password')) {
		await storage.setCredentialsValid(false)
		return false
	}

	await Promise.all([
		saveLoginCredentials(username, password),
		storage.setCredentialsValid(true),
	])

	return true
}
