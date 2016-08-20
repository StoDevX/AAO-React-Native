// @flow
import { AsyncStorage } from 'react-native'
import buildFormData from './formdata'
import Keychain from 'react-native-keychain'
import Frisbee from 'frisbee'
import htmlparser from 'htmlparser2'
import cssSelect from 'css-select'

// class AuthError extends Error {}

// let financials = 'https://www.stolaf.edu/sis/st-financials.cfm'
// let sis = 'https://www.stolaf.edu/sis/login.cfm'
// let olecard = 'https://www.stolaf.edu/apps/olecard/checkbalance/authenticate.cfm'


const api = new Frisbee({baseURI: 'https://www.stolaf.edu'})
const SIS_LOGIN_CREDENTIAL_KEY = 'stolaf.edu'

export function saveLoginCredentials(username: string, password: string): Promise<any> {
  return Keychain.setInternetCredentials(SIS_LOGIN_CREDENTIAL_KEY, username, password)
}

export function loadLoginCredentials(): Promise<{username: string, password: string}> {
  return Keychain.getInternetCredentials(SIS_LOGIN_CREDENTIAL_KEY)
    .catch(() => {})
}

export function clearLoginCredentials(): Promise<any> {
  return Keychain.resetInternetCredentials(SIS_LOGIN_CREDENTIAL_KEY)
}



export function checkLogin(username: string, password: string): Promise<boolean> {
  return sisLogin(username, password).then(res => res.result)
}

function parseHtml(string) {
  return htmlparser.parseDOM(string, {
    withDomLvl1: true,
    normalizeWhitespace: false,
    xmlMode: false,
    decodeEntities: true,
  })
}

async function getSisFinancialsPage() {
  return (await api.get('/sis/st-financials.cfm')).body
}

// from https://github.com/fb55/domutils/blob/master/lib/stringify.js
function getText(elem){
  if (Array.isArray(elem)) return elem.map(getText).join('')
  if (elem.type === 'tag') return getText(elem.children)
  if (elem.type === 'text') return elem.data
  return ''
}

export async function getFinancialData(): Promise<any> {
  let {username, password} = await loadLoginCredentials()
  let {result} = await sisLogin(username, password)
  if (!result) {
    return
  }

  let page
  try {
    page = await getSisFinancialsPage()
  } catch (err) {
    console.error(err)
  }

  let dom = parseHtml(page)
  let data = cssSelect('.sis-money', dom).slice(-3).map(getText)
  let [flex, ole, print] = data

  await Promise.all([
    AsyncStorage.setItem('financials:flex', flex),
    AsyncStorage.setItem('financials:ole', ole),
    AsyncStorage.setItem('financials:print', print),
  ])

  return {flex, ole, print}
}

export async function performLogin(username: string, password: string): Promise<{result: boolean, message?: string}> {
  let {result, message} = await sisLogin(username, password)
  if (!result) {
    await AsyncStorage.setItem('credentials:valid', JSON.stringify(false))
    return {result, message}
  }

  await Promise.all([
    saveLoginCredentials(username, password),
    AsyncStorage.setItem('credentials:valid', JSON.stringify(true)),
  ])

  return {result}
}


async function sisLogin(username: string, password: string): Promise<{result: boolean, message?: string}> {
  let form = buildFormData({
    login: username,
    passwd: password,
  })
  let loginResult = await api.post('/sis/login.cfm', {body: form})
  if (loginResult.body.includes('Password')) {
    return {result: false, message: ''}
  }
  return {result: true}
}

// type CourseType = {department: string[]};

// export async function getCourseList(term: number): Promise<CourseType[]> {
//   let loggedIn = await sisLogin()
//   if (!loggedIn) {
//     throw new AuthError('invalid username or password')
//   }
//   let coursesPage = await api.get('/sis/courses.cfm')
// }


// export async function getMealPlandetails(username: string, password: string) {
//
// }
