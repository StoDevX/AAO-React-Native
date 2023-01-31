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

async function loadCredentials(): Promise<SharedWebCredentials> {
	let credentials = await getInternetCredentials(SIS_LOGIN_KEY)
	if (credentials === false) {
		throw new NoCredentialsError()
	}
	return credentials
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
	const {username, password} = credentials ?? (await loadCredentials())
	if (!username || !password) {
		throw new NoCredentialsError()
	}

	let formData = new FormData()
	formData.append('username', username)
	formData.append('password', password)

	const loginResponse = await ky.post(OLECARD_AUTH_URL, {
		body: formData,
		credentials: 'include',
		cache: 'no-store',
	})

	let responseUrl = new URL(loginResponse.url)
	let responseMessage = responseUrl.searchParams.get('message')
	if (responseMessage) {
		throw new LoginFailedError(`Login failed: ${responseMessage}`)
	}

	return {username, password}
}

type QueryFnData = SharedWebCredentials
type DefaultError = null | unknown
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

export function useUsername(): QueryT<
	false | Pick<SharedWebCredentials, 'username'>
> {
	return useCredentials({
		select: (data) => (data ? {username: data.username} : false),
	})
}

export function useHasCredentials(): QueryT<boolean> {
	return useCredentials({select: (data) => Boolean(data)})
}
