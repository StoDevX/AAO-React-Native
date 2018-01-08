// @flow
import {clearAsyncStorage} from './storage'
import restart from 'react-native-restart'
import {clearLoginCredentials} from './login'
import {reset as resetAppIcon} from '@hawkrives/react-native-alternate-icons'

export async function refreshApp() {
  await clearAsyncStorage()
  await clearLoginCredentials()
  await resetAppIcon()
  restart.Restart()
}
