import ky from 'ky'
import {queryOptions} from '@tanstack/react-query'
import * as SecureStore from 'expo-secure-store'
import {OLECARD_AUTH_URL} from './financials/urls'
import {queryClient} from '../init/tanstack-query'

export class NoCredentialsError extends Error {}
export class LoginFailedError extends Error {}

export const SIS_LOGIN_KEY = 'stolaf.edu' as const

const queryKeys = {
	default: <T extends string>(server: T) => ['credentials', server] as const,
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

type StoredCredentials = Credentials

async function loadCredentials(): Promise<null | StoredCredentials> {
	try {
		const credentialsJson = await SecureStore.getItemAsync(SIS_LOGIN_KEY)
		return credentialsJson
			? (JSON.parse(credentialsJson) as StoredCredentials)
			: null
	} catch {
		return null
	}
}

export async function storeCredentials(
	credentials: Credentials,
): Promise<Credentials> {
	await SecureStore.setItemAsync(SIS_LOGIN_KEY, JSON.stringify(credentials))
	return credentials
}

export async function resetCredentials(): Promise<void> {
	await SecureStore.deleteItemAsync(SIS_LOGIN_KEY)
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
		body: formData,
		credentials: 'include',
		cache: 'no-store',
	})

	let responseUrl = new URL(loginResponse.url)
	// URLSearchParams.get requires a polyfill in react native
	let responseMessage = responseUrl.href.includes('error=')
	if (responseMessage) {
		throw new LoginFailedError(`Login failed: ${responseMessage}`)
	}

	return {username, password}
}

export const credentialsQuery = queryOptions({
	networkMode: 'always',
	gcTime: 0,
	staleTime: 0,
	queryKey: queryKeys.default(SIS_LOGIN_KEY),
	queryFn: () => loadCredentials(),
})

export const usernameQuery = queryOptions({
	...credentialsQuery,
	select: (data) => data?.username,
})

export const hasCredentialsQuery = queryOptions({
	...credentialsQuery,
	select: (data) => Boolean(data),
})
