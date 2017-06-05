// @flow
import {clearAsyncStorage} from './storage'
import {clearLoginCredentials} from './login'

export async function refreshApp() {
  await clearAsyncStorage()
  await clearLoginCredentials()
}
