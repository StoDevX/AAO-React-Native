// @flow
import {
	setInternetCredentials,
	getInternetCredentials,
	resetInternetCredentials,
} from 'react-native-keychain'

import buildFormData from './formdata'
import {OLECARD_AUTH_URL} from './financials/urls'

const SIS_LOGIN_KEY = 'stolaf.edu'

const empty = () => ({})

export type Credentials = {username: string, password: string}
export type MaybeCredentials = {username?: string, password?: string}

export function saveLoginCredentials({username, password}: Credentials) {
	return setInternetCredentials(SIS_LOGIN_KEY, username, password).catch(empty)
}
export function loadLoginCredentials(): Promise<MaybeCredentials> {
	return getInternetCredentials(SIS_LOGIN_KEY).catch(empty)
}
export function clearLoginCredentials() {
	return resetInternetCredentials(SIS_LOGIN_KEY).catch(empty)
}

export type LoginResultEnum =
	| 'success'
	| 'network'
	| 'bad-credentials'
	| 'no-credentials'

type Args = {attempts?: number}

export async function performLogin({attempts = 0}: Args = {}): Promise<
	LoginResultEnum,
> {
	let {username, password} = await loadLoginCredentials()
	if (!username || !password) {
		return 'no-credentials'
	}

	const form = buildFormData({username, password})
	let loginResult = null
	try {
		loginResult = await fetch(OLECARD_AUTH_URL, {
			method: 'POST',
			body: form,
		})
	} catch (err) {
		let wasNetworkFailure = err.message === 'Network request failed'
		if (wasNetworkFailure && attempts > 0) {
			// console.log(`login failed; trying ${attempts - 1} more time(s)`)
			return performLogin({attempts: attempts - 1})
		}
		return 'network'
	}

	const page = await loginResult.text()

	if (page.includes('Password')) {
		return 'bad-credentials'
	}

	return 'success'
}
