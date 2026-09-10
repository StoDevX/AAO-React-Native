import ky from 'ky'
import {isUITesting} from '@frogpond/launch-arguments'
import {OLECARD_DATA_ENDPOINT} from './urls'
import type {BalancesShapeType, OleCardBalancesType} from './types'
import {UITEST_BALANCES} from './__fixtures__/balances'
import {performLogin} from '../login'
import {queryOptions} from '@tanstack/react-query'

export const queryKeys = {
	default: (username: string | undefined) => ['balances', username] as const,
} as const

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const balancesOptions = (username: string | undefined) =>
	queryOptions({
		queryKey: queryKeys.default(username),
		// A mocked run needs no account, so it must not wait for one -- with no
		// credentials the username is empty and the query would never run at all.
		enabled: isUITesting || Boolean(username),
		queryFn: () => getBalances(),
	})

export async function getBalances(): Promise<BalancesShapeType> {
	// Ahead of `performLogin`, which a UI-test run has no account for -- and
	// which St. Olaf now answers with a Google sign-in the app cannot complete.
	if (isUITesting) {
		return UITEST_BALANCES
	}

	await performLogin()

	const url = OLECARD_DATA_ENDPOINT
	const resp: OleCardBalancesType = await ky.get(url, {credentials: 'include'}).json()

	return getBalancesFromData(resp)
}

const accounts = {
	flex: 'STO Flex',
	ole: 'STO Ole Dollars',
	print: 'STO Student Printing',
}

function getBalancesFromData(resp: OleCardBalancesType): BalancesShapeType {
	const flex = resp.data.accounts.find((a) => a.account === accounts.flex)
	const ole = resp.data.accounts.find((a) => a.account === accounts.ole)
	const print = resp.data.accounts.find((a) => a.account === accounts.print)

	const daily = resp.data.meals?.leftDaily
	const weekly = resp.data.meals?.leftWeekly
	const plan = resp.data.meals?.plan

	return {
		flex: flex?.formatted,
		ole: ole?.formatted,
		print: print?.formatted,
		daily: daily ?? undefined,
		weekly: weekly ?? undefined,
		plan: plan ?? undefined,
	}
}
