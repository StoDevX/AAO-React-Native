// @flow

import * as c from '../components/colors'
import type {HomescreenViewType, AppNavigationType} from '../app/types'

import {ContactsView, ContactsDetailView} from '../modules/contacts'

export const navigation: AppNavigationType = {
  ContactsView: {screen: ContactsView},
  ContactsDetailView: {screen: ContactsDetailView},
}

export const view: HomescreenViewType = {
  type: 'view',
  view: 'ContactsView',
  title: 'Important Contacts',
  icon: 'phone',
  tint: c.crimson,
  gradient: c.orangeToRed,
}
