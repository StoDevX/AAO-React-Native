// @flow

import * as c from '../components/colors'
import type {HomescreenViewType, AppNavigationType} from '../app/types'

import {StudentOrgsView, StudentOrgsDetailView} from '../modules/student-orgs'

export const navigation: AppNavigationType = {
  StudentOrgsView: {screen: StudentOrgsView},
  StudentOrgsDetailView: {screen: StudentOrgsDetailView},
}

export const view: HomescreenViewType = {
  type: 'view',
  view: 'StudentOrgsView',
  title: 'Student Orgs',
  icon: 'globe',
  tint: c.periwinkle,
  gradient: c.lightBlueToBlueDark,
}
