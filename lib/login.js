// @flow
import buildFormData from './formdata'
import Keychain from 'react-native-keychain'
import Frisbee from 'frisbee'

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
  return sisLogin({username, password})
}


async function sisLogin(credentials: {username: string, password: string}): Promise<boolean> {
  let {username, password} = credentials

  let form = buildFormData({
    login: username,
    passwd: password,
  })
  let loginResult = await api.post('/sis/login.cfm', {body: form})
  if (loginResult.body.includes('Password')) {
    return false
  }
  return true
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
