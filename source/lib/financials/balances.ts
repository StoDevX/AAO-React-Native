import {OLECARD_DATA_ENDPOINT} from './urls'
import type {BalancesShapeType, OleCardBalancesType} from './types'
import ky from 'ky'
import {performLogin} from '../login'
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import {SharedWebCredentials} from 'react-native-keychain'
import {useDemoAccount} from '../stoprint'

export const queryKeys = {
	default: ['balances'] as const,
} as const

export function useBalances(
	credentials: SharedWebCredentials | false | undefined,
): UseQueryResult<BalancesShapeType, unknown> {
	let isDemoAccount = useDemoAccount()

	return useQuery({
		queryKey: queryKeys.default,
		enabled: Boolean(credentials),
		// query will only be run once `credentials` is not `false`
		queryFn: () => {
			return getBalances(credentials as SharedWebCredentials, isDemoAccount)
		},
	})
}

export async function getBalances(
	credentials: SharedWebCredentials,
	isDemoAccount: boolean,
): Promise<BalancesShapeType> {
	await performLogin(credentials)

	if (isDemoAccount) {
		return {
			flex: '$125',
			ole: '$40',
			print: '$35',
			daily: '2',
			weekly: '15',
			plan: '14 meals/week - $205 Flex/semester',
		}
	}

	const url = OLECARD_DATA_ENDPOINT
	const resp = (await ky
		.get(url, {credentials: 'include'})
		.json()) as OleCardBalancesType

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

	const daily = resp.data.meals && resp.data.meals.leftDaily
	const weekly = resp.data.meals && resp.data.meals.leftWeekly
	const plan = resp.data.meals && resp.data.meals.plan

	return {
		flex: flex ? flex.formatted : null,
		ole: ole ? ole.formatted : null,
		print: print ? print.formatted : null,
		daily: daily == null ? null : daily,
		weekly: weekly == null ? null : weekly,
		plan: plan == null ? null : plan,
	}
}
