// @flow
import {loadLoginCredentials} from '../login'
import buildFormData from '../formdata'
import {OLECARD_AUTH_URL, OLECARD_DATA_ENDPOINT} from './urls'
import type {BalancesShapeType, OleCardBalancesType} from './types'
import isNil from 'lodash/isNil'

type BalancesOrErrorType =
	| {error: true, value: Error}
	| {error: false, value: BalancesShapeType}

export async function getBalances(): Promise<BalancesOrErrorType> {
	const {username, password} = await loadLoginCredentials()

	if (!username || !password) {
		return {error: true, value: new Error('Not logged in')}
	}

	const form = buildFormData({username, password})

	try {
		let loginResponse = await fetch(OLECARD_AUTH_URL, {
			method: 'POST',
			body: form,
		})

		if (loginResponse.url.includes('message=')) {
			return {error: true, value: new Error('Login failed')}
		}

		const resp: OleCardBalancesType = await fetchJson(OLECARD_DATA_ENDPOINT)

		if (resp.error != null) {
			return {
				error: true,
				value: new Error(resp.error),
			}
		}

		return getBalancesFromData(resp)
	} catch (error) {
		return {error: true, value: new Error('Could not fetch balances')}
	}
}

const accounts = {
	flex: 'STO Flex',
	ole: 'STO Ole Dollars',
	print: 'STO Student Printing',
}

function getBalancesFromData(resp: OleCardBalancesType): BalancesOrErrorType {
	const flex = resp.data.accounts.find(a => a.account === accounts.flex)
	const ole = resp.data.accounts.find(a => a.account === accounts.ole)
	const print = resp.data.accounts.find(a => a.account === accounts.print)

	const daily = resp.data.meals && resp.data.meals.leftDaily
	const weekly = resp.data.meals && resp.data.meals.leftWeekly
	const plan = resp.data.meals && resp.data.meals.plan

	return {
		error: false,
		value: {
			flex: flex || flex === 0 ? flex.formatted : null,
			ole: ole || ole === 0 ? ole.formatted : null,
			print: print || print === 0 ? print.formatted : null,
			daily: isNil(daily) ? null : daily,
			weekly: isNil(weekly) ? null : weekly,
			plan: isNil(plan) ? null : plan,
		},
	}
}
