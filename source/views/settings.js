// @flow

import type {HomescreenViewType, AppNavigationType} from '../app/types'

import {SettingsView} from '../modules/settings'
import {PrivacyView} from '../modules/privacy-notice'
import {LegalView} from '../modules/legal-notice'
import {CreditsView} from '../modules/app-credits'
import {FaqView} from '../modules/faqs'

export const navigation: AppNavigationType = {
  SettingsView: {screen: SettingsView},
  PrivacyView: {screen: PrivacyView},
  LegalView: {screen: LegalView},
  CreditsView: {screen: CreditsView},
  FaqView: {screen: FaqView},
}

export const view: HomescreenViewType = {
  type: 'hidden',
}
