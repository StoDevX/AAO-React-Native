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
	| 'server-error'
	| 'other'

type Args = {attempts?: number}

export async function performLogin({
	attempts = 0,
}: Args = {}): Promise<LoginResultEnum> {
	let {username, password} = await loadLoginCredentials()
	if (!username || !password) {
		return 'no-credentials'
	}

	let form = buildFormData({username, password})

	try {
		let {status: statusCode} = await rawFetch(OLECARD_AUTH_URL, {
			method: 'POST',
			body: form,
			credentials: 'include',
		})

		if (statusCode >= 400 && statusCode < 500) {
			return 'bad-credentials'
		}

		if (statusCode >= 500 && statusCode < 600) {
			return 'server-error'
		}

		if (statusCode < 200 || statusCode >= 300) {
			return 'other'
		}

		return 'success'
	} catch (err) {
		let wasNetworkFailure = err.message === 'Network request failed'
		if (wasNetworkFailure && attempts > 0) {
			// console.log(`login failed; trying ${attempts - 1} more time(s)`)
			return performLogin({attempts: attempts - 1})
		}
		return 'network'
	}
}
