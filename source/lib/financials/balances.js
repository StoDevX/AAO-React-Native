// @flow
import {loadLoginCredentials} from '../login'
import buildFormData from '../formdata'
import {OLECARD_AUTH_URL, OLECARD_DATA_ENDPOINT} from './urls'
import type {BalancesShapeType, OleCardBalancesType} from './types'
import isNil from 'lodash/isNil'
import * as cache from '../cache'

type BalancesOrErrorType =
  | {error: true, value: Error}
  | {error: false, value: BalancesShapeType}

export async function getBalances(
  isConnected: boolean,
  force?: boolean,
): Promise<BalancesOrErrorType> {
  const {
    flex,
    ole,
    print,
    daily,
    weekly,
    plan,
    _isExpired,
    _isCached,
  } = await cache.getBalances()

  if (isConnected && (_isExpired || !_isCached || force)) {
    const balances = await fetchBalancesFromServer()

    // we don't want to cache error responses
    if (balances.error) {
      return balances
    }

    await cache.setBalances(balances.value)
    return balances
  }

  return {
    error: false,
    value: {
      flex: flex.value,
      ole: ole.value,
      print: print.value,
      daily: daily.value,
      weekly: weekly.value,
      plan: plan.value,
    },
  }
}

async function fetchBalancesFromServer(): Promise<BalancesOrErrorType> {
  const {username, password} = await loadLoginCredentials()
  if (!username || !password) {
    return {error: true, value: new Error('not logged in!')}
  }

  const form = buildFormData({
    username: username,
    password: password,
  })
  await fetch(OLECARD_AUTH_URL, {method: 'POST', body: form})

  const resp: OleCardBalancesType = await fetchJson(OLECARD_DATA_ENDPOINT)

  return getBalancesFromData(resp)
}

const accounts = {
  flex: 'STO Flex',
  ole: 'STO Ole Dollars',
  print: 'STO Student Printing',
}

function getBalancesFromData(resp: OleCardBalancesType): BalancesOrErrorType {
  if (resp.error) {
    return {
      error: true,
      value: new Error(resp.error),
    }
  }

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
