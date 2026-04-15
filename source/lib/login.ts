import ky from 'ky'
import {queryOptions} from '@tanstack/react-query'
import {
	getInternetCredentials,
	resetInternetCredentials,
	setInternetCredentials,
	UserCredentials,
} from 'react-native-keychain'
import {OLECARD_AUTH_URL} from './financials/urls'
import {queryClient} from '../init/tanstack-query'

export class NoCredentialsError extends Error {}
export class LoginFailedError extends Error {}

export const SIS_LOGIN_KEY = 'stolaf.edu' as const

const queryKeys = {
	default: (server: string) => ['credentials', server] as const,
} as const

export function invalidateCredentials(): Promise<void> {
	return queryClient.invalidateQueries({
		queryKey: queryKeys.default(SIS_LOGIN_KEY),
	})
}

type Credentials = {
	username: string
	password: string
}

async function loadCredentials(): Promise<null | UserCredentials> {
	let credentials = await getInternetCredentials(SIS_LOGIN_KEY)
	return credentials ? credentials : null
}

export async function storeCredentials(
	credentials: Credentials,
): Promise<Credentials> {
	let saved = await setInternetCredentials(
		SIS_LOGIN_KEY,
		credentials.username,
		credentials.password,
	)
	if (saved === false) {
		throw new NoCredentialsError()
	}
	return credentials
}

export function resetCredentials(): Promise<void> {
	return resetInternetCredentials({server: SIS_LOGIN_KEY})
}

export async function performLogin(
	credentials: Credentials | null = null,
): Promise<Credentials> {
	const saved = credentials ?? (await loadCredentials())
	if (!saved) {
		throw new NoCredentialsError()
	}
	const {username, password} = saved

	let formData = new FormData()
	formData.append('username', username)
	formData.append('password', password)

	const loginResponse = await ky.post(OLECARD_AUTH_URL, {
		// React Native's global FormData class differs from the DOM/Node FormData
		// shape that ky's RequestInit.body expects. The runtime is RN's FormData
		// (via fetch polyfill); the cast reconciles the mismatched type layers.
		body: formData as unknown as BodyInit_,
		credentials: 'include',
	})

	let responseUrl = new URL(loginResponse.url)
	// URLSearchParams.get requires a polyfill in react native
	let responseMessage = responseUrl.href.includes('error=')
	if (responseMessage) {
		throw new LoginFailedError(`Login failed: ${responseMessage}`)
	}

	return {username, password}
}

export const credentialsOptions = queryOptions({
	queryKey: queryKeys.default(SIS_LOGIN_KEY),
	queryFn: () => loadCredentials(),
	networkMode: 'always' as const,
	gcTime: 0,
	staleTime: 0,
})
