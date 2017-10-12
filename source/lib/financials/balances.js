// @flow
import {loadLoginCredentials} from '../login'
import {AAO_USER_AGENT} from '../../user-agent'
import buildFormData from '../formdata'
import {parseHtml, cssSelect, getTrimmedTextWithSpaces} from '../html'
import {OLECARD_AUTH_URL} from './urls'
import type {BalancesShapeType} from './types'
import fromPairs from 'lodash/fromPairs'
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
  const result = await fetch(OLECARD_AUTH_URL, {
    method: 'POST',
    body: form,
    headers: new Headers({'User-Agent': AAO_USER_AGENT}),
  })
  const page = await result.text()
  const dom = parseHtml(page)

  return parseBalancesFromDom(dom)
}

function parseBalancesFromDom(dom: mixed): BalancesOrErrorType {
  // .accountrow is the name of the row, and it's immediate sibling is a cell with id=value
  const elements = cssSelect('.accountrow', dom)
    .map(el => el.parent)
    .map(getTrimmedTextWithSpaces)
    .map(rowIntoNamedAmount)
    .filter(Boolean)

  const namedValues = fromPairs(elements)

  const flex = dollarAmountToInteger(namedValues.flex)
  const ole = dollarAmountToInteger(namedValues.ole)
  const print = dollarAmountToInteger(namedValues.print)
  const daily = namedValues.daily
  const weekly = namedValues.weekly

  return {
    error: false,
    value: {
      flex: isNil(flex) ? null : flex,
      ole: isNil(ole) ? null : ole,
      print: isNil(print) ? null : print,
      daily: isNil(daily) ? null : daily,
      weekly: isNil(weekly) ? null : weekly,
    },
  }
}

const lookupHash: Map<RegExp, string> = new Map([
  [/sto flex/i, 'flex'],
  [/ole/i, 'ole'],
  [/print/i, 'print'],
  [/meals.*day/i, 'daily'],
  [/meals.*week/i, 'weekly'],
])

function rowIntoNamedAmount(row: string): ?[string, string] {
  const chunks = row.split(' ')
  const name = chunks.slice(0, -1).join(' ')
  const amount = chunks[chunks.length - 1]

  // We have a list of regexes that check the row names for keywords.
  // Those keywords are associated with the actual key names.
  for (const [lookup, key] of lookupHash.entries()) {
    if (lookup.test(name)) {
      return [key, amount]
    }
  }
}

function dollarAmountToInteger(amount: ?string): ?number {
  const amountString = amount || ''
  // remove the /[$.]/, and put the numbers into big strings (eg, $3.14 -> '314')
  const nonDenominationalAmount = amountString
    .replace('$', '')
    .split('.')
    .join('')
  const num = parseInt(nonDenominationalAmount, 10)
  return Number.isNaN(num) ? null : num
}
