// @flow
import startsWith from 'lodash/startsWith'

import {parseHtml, cssSelect, getText} from '../html'
import * as cache from '../cache'
import {FINANCIALS_URL, LANDING_URL} from './urls'
import type {FinancialDataShapeType} from './types'

type PromisedDataType = Promise<{error: true, value: Error}|{error: false, value: FinancialDataShapeType}>;

export async function getFinancialData(isConnected: boolean, force?: bool): PromisedDataType {
  const [flex, ole, print] = await getBalances()

  const balancesExist = (!flex || !ole || !print)
  const isExpired = balancesExist && (flex.isExpired || ole.isExpired || print.isExpired)
  const isCached = balancesExist && (flex.isCached || ole.isCached || print.isCached)

  if (isConnected && (isExpired || !isCached || force)) {
    const balances = await fetchFinancialDataFromServer()

    // we don't want to cache error responses
    if (balances.error) {
      return balances
    }

    await Promise.all([
      cache.setFlexBalance(balances.value.flex),
      cache.setOleBalance(balances.value.ole),
      cache.setPrintBalance(balances.value.print),
    ])

    return balances
  }

  return {
    error: false,
    value: {
      flex: flex ? flex.value : null,
      ole: ole ? ole.value : null,
      print: print ? print.value : null,
    },
  }
}

function getBalances() {
  return Promise.all([
    cache.getFlexBalance(),
    cache.getOleBalance(),
    cache.getPrintBalance(),
  ])
}


async function fetchFinancialDataFromServer(): PromisedDataType {
  const resp = await fetch(FINANCIALS_URL)
  if (startsWith(resp.url, LANDING_URL)) {
    return {error: true, value: new Error('Authentication Error')}
  }
  const page = await resp.text()
  if (!page) {
    return {error: false, value: {flex: null, ole: null, print: null}}
  }

  const dom = parseHtml(page)

  return {error: false, value: parseBalancesFromDom(dom)}
}

function parseBalancesFromDom(dom: mixed): FinancialDataShapeType {
  const data: (number|null)[] = cssSelect('.sis-money', dom).slice(-3)
    .map(getText)
    // remove the /[$.]/, and put the numbers into big strings (eg, $3.14 -> '314')
    .map(s => s.replace('$', '').split('.').join(''))
    .map(s => parseInt(s, 10))
    .map(n => Number.isNaN(n) ? null : n)

  const [flex, ole, print] = data

  return {flex, ole, print}
}
