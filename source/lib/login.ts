import ky from 'ky'
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import {
	getInternetCredentials,
	SharedWebCredentials,
} from 'react-native-keychain'
import {OLECARD_AUTH_URL} from './financials/urls'
import {identity} from 'lodash'

export class NoCredentialsError extends Error {}
export class LoginFailedError extends Error {}

export const SIS_LOGIN_KEY = 'stolaf.edu' as const

const queryKeys = {
	default: ['credentials'] as const,
	username: ['credentials', 'username'] as const,
} as const

export async function performLogin(credentials: {
	username: string
	password: string
}): Promise<{username: string; password: string}> {
	const {username, password} = credentials
	if (!username || !password) {
		throw new NoCredentialsError()
	}

	let formData = new FormData()
	formData.append('username', credentials.username)
	formData.append('password', credentials.password)

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

	return credentials
}

export function useCredentials<T = false | SharedWebCredentials>(
	selector: (
		data: Awaited<ReturnType<typeof getInternetCredentials>>,
	) => T = identity,
): UseQueryResult<T, unknown> {
	return useQuery({
		queryKey: queryKeys.default,
		queryFn: () => getInternetCredentials(SIS_LOGIN_KEY),
		select: selector,
		networkMode: 'always',
	})
}

export function useUsername(): UseQueryResult<
	false | Pick<SharedWebCredentials, 'username'>,
	unknown
> {
	return useCredentials((data) => (data ? {username: data.username} : false))
}

export function useHasCredentials(): UseQueryResult<boolean, unknown> {
	return useCredentials((data) => Boolean(data))
}
