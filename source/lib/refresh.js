// @flow
import {clearAsyncStorage} from './storage'
import restart from 'react-native-restart'
import {clearLoginCredentials} from './login'

export async function refreshApp() {
  await clearAsyncStorage()
  await clearLoginCredentials()
  restart.Restart()
}
