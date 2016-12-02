// @flow
import {
  api,
  loadLoginCredentials,
  isLoggedIn,
} from '../lib/login'
import { AsyncStorage, NetInfo } from 'react-native'

const ERROR_URL = 'https://www.stolaf.edu/sis/landing-page.cfm'
import {SisAuthenticationError} from './errors'
import buildFormData from './formdata'
import {parseHtml, cssSelect, getText} from './html'
import moment from 'moment'
import isNil from 'lodash/isNil'
import isError from 'lodash/isError'
import startsWith from 'lodash/startsWith'

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
    return getFinancialDataFromServer()
  }
  return getFinancialDataFromStorage()
}

function tryParse(val) {
  try {
    return JSON.parse(val)
  } catch (err) {
    return null
  }
}

async function getFinancialDataFromStorage(): Promise<FinancialDataShapeType> {
  let vals = await Promise.all([
    AsyncStorage.getItem(FINANCIALS__FLEX),
    AsyncStorage.getItem(FINANCIALS__OLE),
    AsyncStorage.getItem(FINANCIALS__PRINT),
  ])

  let [flex, ole, print] = vals.map(v => tryParse(v))

  return {flex, ole, print}
}

async function getSisFinancialsPage(): Promise<string|null|SisAuthenticationError> {
  try {
    let resp = await api.get('/sis/st-financials.cfm')
    if (startsWith(resp.url, ERROR_URL)) {
      await AsyncStorage.setItem('credentials:valid', JSON.stringify(false))
      return new Error('Authentication Error')
    }
    return resp.body
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
  if (isError(page)) {
    return {flex: null, ole: null, print: null}
  }

  let dom = parseHtml(page)

  let data = cssSelect('.sis-money', dom).slice(-3)
    .map(getText)
    // remove the /[$.]/, and put the numbers into big strings (eg, $3.14 -> '314')
    .map(s => s.replace('$', '').split('.').join(''))
    .map(s => parseInt(s, 10))
    .map(n => {
      return Number.isNaN(n) ? null : n
    })

  let [flex, ole, print] = data

  await Promise.all([
    AsyncStorage.setItem(FINANCIALS__FLEX, JSON.stringify(isNil(flex) ? null : flex)),
    AsyncStorage.setItem(FINANCIALS__OLE, JSON.stringify(isNil(ole) ? null : ole)),
    AsyncStorage.setItem(FINANCIALS__PRINT, JSON.stringify(isNil(print) ? null : print)),
    AsyncStorage.setItem(FINANCIALS__CACHE__BALANCES, JSON.stringify(new Date())),
  ])

  return {flex, ole, print}
}


// TODO: come up with a better story around auth for olecard
export async function getWeeklyMealsRemaining() {
  let {username, password} = await loadLoginCredentials()
  let form = buildFormData({
    username: username,
    password: password,
  })
  let fetchResult = await api.post('/apps/olecard/checkbalance/authenticate.cfm', {body: form})

  try {
    let dom = parseHtml(fetchResult.body)
    let data = cssSelect('.accountrow', dom)
    let values = data.map((item) => {
      return item.next.next.children[0].data
    })
    return({'weeklyMeals': values[4], 'dailyMeals': values[3]})
  } catch (error) {
    console.log('error in fetching meal data')
    return({'weeklyMeals': null, 'dailyMeals': null})
  }

}
