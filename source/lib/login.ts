import {
	setInternetCredentials,
	getInternetCredentials,
	resetInternetCredentials,
} from 'react-native-keychain'

import type {
	Result as RNKeychainResult,
	SharedWebCredentials as RNKeychainCredentials,
} from 'react-native-keychain'

import buildFormData from './formdata'
import {OLECARD_AUTH_URL} from './financials/urls'
import {ExpandedFetchArgs} from '@frogpond/fetch'

const SIS_LOGIN_KEY = 'stolaf.edu'

const EMPTY_CREDENTIALS: MaybeCredentials = {}

export type Credentials = {username: string; password: string}
export type MaybeCredentials = {username?: string; password?: string}

export function saveLoginCredentials({
	username,
	password,
}: Credentials): Promise<false | RNKeychainResult> {
	return setInternetCredentials(SIS_LOGIN_KEY, username, password)
}

export function loadLoginCredentials(): Promise<MaybeCredentials> {
	return getInternetCredentials(SIS_LOGIN_KEY).then(
		(result: false | RNKeychainCredentials): MaybeCredentials =>
			result ? result : EMPTY_CREDENTIALS,
	)
}

export function clearLoginCredentials(): Promise<void> {
	return resetInternetCredentials(SIS_LOGIN_KEY)
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
	const {username, password} = await loadLoginCredentials()
	if (!username || !password) {
		return 'no-credentials'
	}

	const form = buildFormData({username, password})

	try {
		const fetchParams: ExpandedFetchArgs = {
			method: 'POST',
			body: form,
			credentials: 'include',
			cache: 'no-store',
			throwHttpErrors: false,
		}

		const {status: statusCode} = await fetch(OLECARD_AUTH_URL, fetchParams)

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
		if (err instanceof Error) {
			const wasNetworkFailure = err.message === 'Network request failed'
			if (wasNetworkFailure) {
				if (attempts > 0) {
					// console.log(`login failed; trying ${attempts - 1} more time(s)`)
					return performLogin({attempts: attempts - 1})
				}

				return 'network'
			}
		}

		return 'other'
	}
}
