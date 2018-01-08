// @flow
import {clearAsyncStorage} from './storage'
import restart from 'react-native-restart'
import {clearLoginCredentials} from './login'
import * as icons from '@hawkrives/react-native-alternate-icons'

export async function refreshApp() {
  await clearAsyncStorage()
  await clearLoginCredentials()
  if (await icons.getIconName() !== 'default') {
    await icons.reset()
  }
  restart.Restart()
}
