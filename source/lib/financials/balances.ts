import {loadLoginCredentials} from '../login'
import {OLECARD_AUTH_URL, OLECARD_DATA_ENDPOINT} from './urls'
import type {BalancesShapeType, OleCardBalancesType} from './types'
import ky from 'ky'

export class NoCredentialsError extends Error {}
export class LoginFailedError extends Error {}

export async function getBalances(): Promise<BalancesShapeType> {
	const {username, password} = await loadLoginCredentials()

	if (!username || !password) {
		throw new NoCredentialsError()
	}

	let formData = new FormData()
	formData.set('username', username)
	formData.set('password', password)

	const loginResponse = await ky.post(OLECARD_AUTH_URL, {
		body: formData,
		credentials: 'include',
	})

	let responseUrl = new URL(loginResponse.url)
	let responseMessage = responseUrl.searchParams.get('message')
	if (responseMessage) {
		throw new LoginFailedError(`Login failed: ${responseMessage}`)
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
