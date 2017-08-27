// @flow

import type {HomescreenViewType, AppNavigationType} from '../app/types'

import {EditHomeView} from '../modules/homescreen-edit'

export const navigation: AppNavigationType = {
  EditHomeView: {screen: EditHomeView},
}

export const view: HomescreenViewType = {
  type: 'hidden',
}
