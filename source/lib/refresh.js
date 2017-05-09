// @flow
import {clearAsyncStorage} from './storage'
import codePush from 'react-native-code-push'
import {clearLoginCredentials} from './login'

export async function refreshApp() {
  await clearAsyncStorage()
  await clearLoginCredentials()
  codePush.restartApp()
}
