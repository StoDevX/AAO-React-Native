import ky from 'ky'
import {
	queryOptions,
	useQuery,
	type UseQueryResult,
} from '@tanstack/react-query'
import * as SecureStore from 'expo-secure-store'
import {OLECARD_AUTH_URL} from './financials/urls'
import {queryClient} from '../init/tanstack-query'

export class NoCredentialsError extends Error {}
export class LoginFailedError extends Error {}

export const SIS_LOGIN_KEY = 'stolaf.edu'
export const SIS_USERNAME_KEY = `${SIS_LOGIN_KEY}::username`
export const SIS_PASSWORD_KEY = `${SIS_LOGIN_KEY}::password`

const queryKeys = {
	default: (server: string) => ['credentials', server] as const,
} as const

export function invalidateCredentials(): Promise<void> {
	return queryClient.invalidateQueries({
		queryKey: queryKeys.default(SIS_LOGIN_KEY),
	})
}

export interface Credentials {
	username: string
	password: string
}

async function loadCredentials(): Promise<null | Credentials> {
	let [username, password] = await Promise.all([
		SecureStore.getItemAsync(SIS_USERNAME_KEY),
		SecureStore.getItemAsync(SIS_PASSWORD_KEY),
	])
	return username != null && password != null ? {username, password} : null
}

export async function storeCredentials(
	credentials: Credentials,
): Promise<Credentials> {
	if (!credentials.username || !credentials.password) {
		throw new NoCredentialsError()
	}
	await Promise.all([
		SecureStore.setItemAsync(SIS_USERNAME_KEY, credentials.username),
		SecureStore.setItemAsync(SIS_PASSWORD_KEY, credentials.password),
	])
	return credentials
}

export async function resetCredentials(): Promise<void> {
	await Promise.all([
		SecureStore.deleteItemAsync(SIS_USERNAME_KEY),
		SecureStore.deleteItemAsync(SIS_PASSWORD_KEY),
	])
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
	let responseMessage = responseUrl.searchParams.get('error')
	if (responseMessage != null) {
		throw new LoginFailedError(`Login failed: ${responseMessage}`)
	}

	return {username, password}
}

function useCredentialsOptions() {
	return queryOptions({
		queryKey: queryKeys.default(SIS_LOGIN_KEY),
		queryFn: () => loadCredentials(),
		networkMode: 'always',
		gcTime: 0,
		staleTime: 0,
	})
}

export function useUsername(): UseQueryResult<string | undefined> {
	return useQuery({
		...useCredentialsOptions(),
		select: (data) => data?.username,
	})
}

export function useHasCredentials(): UseQueryResult<boolean> {
	return useQuery({
		...useCredentialsOptions(),
		select: (data) => Boolean(data),
	})
}
