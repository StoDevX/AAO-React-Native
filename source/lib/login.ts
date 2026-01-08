import ky from 'ky'
import {
	QueryObserverOptions,
	useQuery,
	UseQueryResult,
} from '@tanstack/react-query'
import {
	getInternetCredentials,
	resetInternetCredentials,
	setInternetCredentials,
	SharedWebCredentials,
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

async function loadCredentials(): Promise<null | SharedWebCredentials> {
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
	return resetInternetCredentials(SIS_LOGIN_KEY)
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
	})

	let responseUrl = new URL(loginResponse.url)
	// URLSearchParams.get requires a polyfill in react native
	let responseMessage = responseUrl.href.includes('error=')
	if (responseMessage) {
		throw new LoginFailedError(`Login failed: ${responseMessage}`)
	}

	return {username, password}
}

type QueryFnData = null | SharedWebCredentials
type DefaultError = unknown
type QueryT<Select> = ReturnType<typeof useCredentials<Select>>

export function useCredentials<TData = QueryFnData, TError = DefaultError>(
	options: QueryObserverOptions<QueryFnData, TError, TData> = {},
): UseQueryResult<TData, TError> {
	return useQuery({
		queryKey: queryKeys.default(SIS_LOGIN_KEY),
		queryFn: () => loadCredentials(),
		networkMode: 'always',
		cacheTime: 0,
		staleTime: 0,
		...options,
	})
}

export function useUsername(): QueryT<string | undefined> {
	return useCredentials({
		select: (data) => data?.username,
	})
}

export function useHasCredentials(): QueryT<boolean> {
	return useCredentials({select: (data) => Boolean(data)})
}
