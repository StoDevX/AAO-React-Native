// @flow
import Keychain from 'react-native-keychain'

const SIS_LOGIN_CREDENTIAL_KEY = 'stolaf.edu'
export function saveLoginCredentials(username: string, password: string) {
  return Keychain.setInternetCredentials(SIS_LOGIN_CREDENTIAL_KEY, username, password)
}

export function loadLoginCredentials() {
  return Keychain.getInternetCredentials(SIS_LOGIN_CREDENTIAL_KEY)
    .catch(() => {})
}

export function clearLoginCredentials() {
  return Keychain.resetInternetCredentials(SIS_LOGIN_CREDENTIAL_KEY)
}
