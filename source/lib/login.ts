import {
	setInternetCredentials,
	getInternetCredentials,
	resetInternetCredentials,
	type Result as RNKeychainResult,
} from 'react-native-keychain'

import {OLECARD_AUTH_URL} from './financials/urls'
import ky from 'ky'

const SIS_LOGIN_KEY = 'stolaf.edu'

const EMPTY_CREDENTIALS: MaybeCredentials = {}

export type Credentials = {username: string; password: string}
export type MaybeCredentials = {username?: string; password?: string}

export function saveLoginCredentials(
	creds: Credentials,
): Promise<false | RNKeychainResult> {
	return setInternetCredentials(SIS_LOGIN_KEY, creds.username, creds.password)
}

export async function loadLoginCredentials(): Promise<MaybeCredentials> {
	let result = await getInternetCredentials(SIS_LOGIN_KEY)
	return result || EMPTY_CREDENTIALS
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

export async function performLogin({
	attempts = 0,
}: {attempts?: number} = {}): Promise<LoginResultEnum> {
	const {username, password} = await loadLoginCredentials()
	if (!username || !password) {
		return 'no-credentials'
	}

	let formData = new FormData()
	formData.set('username', username)
	formData.set('password', password)

	try {
		const {status: statusCode} = await ky.post(OLECARD_AUTH_URL, {
			body: formData,
			credentials: 'include',
			cache: 'no-store',
			throwHttpErrors: false,
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
