// @flow
import {
    api,
    loadLoginCredentials,
    sisLogin,
    isLoggedIn,
} from '../lib/login'
import { AsyncStorage, NetInfo } from 'react-native'

import buildFormData from './formdata'
import {parseHtml, cssSelect, getText} from './html'
import moment from 'moment'

// const FINANCIALS__CACHE__MEALS = 'financials:cache-time:meals'
const FINANCIALS__CACHE__BALANCES = 'financials:cache-time:balances'
const FINANCIALS__FLEX = 'financials:flex'
const FINANCIALS__OLE = 'financials:ole'
const FINANCIALS__PRINT = 'financials:print'

type FinancialDataShapeType = {flex: null|number, ole: null|number, print: null|number};

export async function getFinancialData(forceFromServer?: bool): Promise<FinancialDataShapeType> {
  let timeLastFetched = JSON.parse(await AsyncStorage.getItem(FINANCIALS__CACHE__BALANCES))
  let needsUpdate = moment(timeLastFetched).isBefore(moment().subtract(1, 'minute'))

  let isConnected = await NetInfo.isConnected.fetch()
  if (isConnected && (!timeLastFetched || needsUpdate || forceFromServer)) {
    return await getFinancialDataFromServer()
  }
  return await getFinancialDataFromStorage()
}


async function getFinancialDataFromStorage(): Promise<FinancialDataShapeType> {
  let vals = await Promise.all([
    AsyncStorage.getItem('financials:flex'),
    AsyncStorage.getItem('financials:ole'),
    AsyncStorage.getItem('financials:print'),
  ])

  let [flex, ole, print] = vals.map(v => JSON.parse(v))

  return {flex, ole, print}
}

async function getSisFinancialsPage() {
  try {
    return (await api.get('/sis/st-financials.cfm')).body
  } catch (err) {
    console.error(err)
    return null
  }
}

async function getFinancialDataFromServer(): Promise<FinancialDataShapeType> {
  // let {username, password} = await loadLoginCredentials()
  // let {result} = await sisLogin(username, password)
  let result = await isLoggedIn()
  if (!result) {
    return {flex: null, ole: null, print: null}
  }

  let page = await getSisFinancialsPage()
  if (!page) {
    return {flex: null, ole: null, print: null}
  }

  let dom = parseHtml(page)
  let data = cssSelect('.sis-money', dom).slice(-3)
    .map(getText)
    .map(s => s.replace('$', '').split('.').join(''))
    .map(s => parseInt(s, 10))
    .map(n => {
      return Number.isNaN(n) ? null : n
    })

  let [flex, ole, print] = data

  await Promise.all([
    AsyncStorage.setItem(FINANCIALS__FLEX, JSON.stringify(flex)),
    AsyncStorage.setItem(FINANCIALS__OLE, JSON.stringify(ole)),
    AsyncStorage.setItem(FINANCIALS__PRINT, JSON.stringify(print)),
    AsyncStorage.setItem(FINANCIALS__CACHE__BALANCES, JSON.stringify(new Date())),
  ])

  return {flex, ole, print}
}


export default async function getWeeklyMealsRemaining() {
  let {username, password} = await loadLoginCredentials()
  let form = buildFormData({
    username: username,
    password: password,
  })
  let loginResult = await api.post('/apps/olecard/checkbalance/authenticate.cfm', {body: form})
  return loginResult
}
