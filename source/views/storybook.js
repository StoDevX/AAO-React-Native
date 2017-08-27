// @flow

import * as c from '../components/colors'
import type {HomescreenViewType, AppNavigationType} from '../app/types'

import {StorybookView} from '../modules/storybook'

export const navigation: AppNavigationType = {
  StorybookView: {screen: StorybookView},
}

export const view: HomescreenViewType = {
  type: 'view',
  view: 'StorybookView',
  title: 'Storybook',
  icon: 'ionic',
  tint: c.periwinkle,
  gradient: c.lightBlueToBlueDark,
}
