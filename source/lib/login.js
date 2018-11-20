// @flow
import {
	setInternetCredentials,
	getInternetCredentials,
	resetInternetCredentials,
} from 'react-native-keychain'
import {trackLogOut, trackLogIn, trackLoginFailure} from '@frogpond/analytics'
import {Alert} from 'react-native'

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

type Args = {username: string, password: string, attempts?: number}

export async function performLogin({
	username,
	password,
	attempts = 0,
}: Args = {}): Promise<LoginResultEnum> {
	if (!username || !password) {
		trackLoginFailure('No credentials')
		showUnknownLoginMessage()
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
			return performLogin({username, password, attempts: attempts - 1})
		}
		trackLoginFailure('No network')
		showNetworkFailureMessage()
		return 'network'
	}

	const page = await loginResult.text()

	if (page.includes('Password')) {
		trackLoginFailure('Bad credentials')
		clearLoginCredentials()
		showInvalidLoginMessage()
		return 'bad-credentials'
	}
	trackLogIn()
	await saveLoginCredentials({username, password})
	return 'success'
}

export async function performLogout() {
	trackLogOut()
	await clearLoginCredentials()
}

const showNetworkFailureMessage = () =>
	Alert.alert(
		'Network Failure',
		'You are not connected to the internet. Please connect if you want to access this feature.',
		[{text: 'OK'}],
	)

const showInvalidLoginMessage = () =>
	Alert.alert(
		'Invalid Login',
		'The username and password you provided do not match a valid account. Please try again.',
		[{text: 'OK'}],
	)

const showUnknownLoginMessage = () =>
	Alert.alert(
		'Unknown Login',
		'No username and password were provided. Please try again.',
		[{text: 'OK'}],
	)
