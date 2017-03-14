// @flow

import {Platform, Linking, StatusBar} from 'react-native'

import {tracker} from '../../analytics'
import SafariView from 'react-native-safari-view'
import {CustomTabs} from 'react-native-custom-tabs'

let iosOnShowListener = null
let iosOnDismissListener = null
function startStatusBarColorChanger() {
  SafariView.isAvailable()
    .then(() => {
      iosOnShowListener = SafariView.addEventListener('onShow', () =>
        StatusBar.setBarStyle('dark-content'))

      iosOnDismissListener = SafariView.addEventListener('onDismiss', () =>
        StatusBar.setBarStyle('light-content'))
    })
    .catch(() => {})
}
startStatusBarColorChanger()

// eslint-disable-next-line no-unused-vars
function stopStatusBarColorChanger() {
  SafariView.isAvailable()
    .then(() => {
      SafariView.removeEventListener('onShow', iosOnShowListener)
      SafariView.removeEventListener('onDismiss', iosOnDismissListener)
    })
    .catch(() => {})
}

function genericOpen(url: string) {
  return Linking.canOpenURL(url)
    .then(isSupported => {
      if (!isSupported) {
        console.warn('cannot handle', url)
      }
      return Linking.openURL(url)
    })
    .catch(err => {
      tracker.trackException(err)
      console.error(err)
    })
}

function iosOpen(url: string) {
  return (
    SafariView.isAvailable()
      // if it's around, open in safari
      .then(() => SafariView.show({url}))
      // fall back to opening in default browser
      .catch(() => genericOpen(url))
  )
}

function androidOpen(url: string) {
  return CustomTabs.openURL(url, {
    showPageTitle: true,
    enableUrlBarHiding: true,
    enableDefaultShare: true,
  }).catch(() => genericOpen(url)) // fall back to opening in Chrome / Browser / platform default
}

export default function openUrl(url: string) {
  switch (Platform.OS) {
    case 'android':
      return androidOpen(url)
    case 'ios':
      return iosOpen(url)
    default:
      return genericOpen(url)
  }
}

export function trackedOpenUrl({url, id}: {url: string, id?: string}) {
  tracker.trackScreenView(id || url)
  return openUrl(url)
}

export function canOpenUrl(url: string) {
  // iOS navigates to about:blank when you provide raw HTML to a webview.
  // Android navigates to data:text/html;$stuff (that is, the document you passed) instead.
  if (/^(?:about|data):/.test(url)) {
    return false
  }
  return true
}
