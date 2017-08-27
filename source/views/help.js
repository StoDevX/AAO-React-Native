// @flow

import * as c from '../components/colors'
import type {HomescreenViewType, AppNavigationType} from '../app/types'

import {HelpView} from '../modules/help'

export const navigation: AppNavigationType = {
  HelpView: {screen: HelpView},
}

export const view: HomescreenViewType = {
  type: 'view',
  view: 'HelpView',
  title: 'Report A Problem',
  icon: 'help',
  tint: c.lavender,
  gradient: c.purpleToIndigo,
}
