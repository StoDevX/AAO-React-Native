// @flow

import * as c from '../components/colors'
import type {HomescreenViewType, AppNavigationType} from '../app/types'

import {
  BuildingHoursView,
  BuildingHoursDetailView,
} from '../modules/building-hours'
import {
  BuildingHoursProblemReportView,
  BuildingHoursScheduleEditorView,
} from '../modules/building-hours-editor'

export const navigation: AppNavigationType = {
  BuildingHoursDetailView: {screen: BuildingHoursDetailView},
  BuildingHoursView: {screen: BuildingHoursView},
  BuildingHoursProblemReportView: {screen: BuildingHoursProblemReportView},
  BuildingHoursScheduleEditorView: {screen: BuildingHoursScheduleEditorView},
}

export const view: HomescreenViewType = {
  type: 'view',
  view: 'BuildingHoursView',
  title: 'Building Hours',
  icon: 'clock',
  tint: c.wave,
  gradient: c.lightBlueToBlueDark,
}
