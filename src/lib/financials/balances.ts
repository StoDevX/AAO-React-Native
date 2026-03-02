import ky from 'ky'
import {OLECARD_DATA_ENDPOINT} from './urls'
import type {BalancesShapeType, OleCardBalancesType} from './types'
import {performLogin} from '../login'
import {useQuery, UseQueryResult} from '@tanstack/react-query'

export const queryKeys = {
	default: (username: string | undefined) => ['balances', username] as const,
} as const

export function useBalances(
	username: string | undefined,
): UseQueryResult<BalancesShapeType, unknown> {
	return useQuery({
		queryKey: queryKeys.default(username),
		enabled: Boolean(username),
		queryFn: () => getBalances(),
	})
}

export async function getBalances(): Promise<BalancesShapeType> {
	await performLogin()

	const url = OLECARD_DATA_ENDPOINT
	const resp: OleCardBalancesType = await ky
		.get(url, {credentials: 'include'})
		.json()

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
