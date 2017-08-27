// @flow

import * as c from '../components/colors'
import type {HomescreenViewType, AppNavigationType} from '../app/types'

import {DictionaryView, DictionaryDetailView} from '../modules/dictionary'

export const navigation: AppNavigationType = {
  DictionaryView: {screen: DictionaryView},
  DictionaryDetailView: {screen: DictionaryDetailView},
}

export const view: HomescreenViewType = {
  type: 'view',
  view: 'DictionaryView',
  title: 'Campus Dictionary',
  icon: 'open-book',
  tint: c.olive,
  gradient: c.yellowToGoldLight,
}
