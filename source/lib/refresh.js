// @flow
import {clearAsyncStorage} from './storage'
import codePush from 'react-native-code-push'

export async function refreshApp() {
  await clearAsyncStorage()
  codePush.restartApp()
}
