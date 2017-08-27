// @flow

import * as c from '../components/colors'
import type {HomescreenViewType, AppNavigationType} from '../app/types'

export const navigation: AppNavigationType = {}

export const view: HomescreenViewType = {
  type: 'url',
  url: 'https://www.stolaf.edu/directory/search',
  view: 'DirectoryView',
  title: 'Directory',
  icon: 'v-card',
  tint: c.indianRed,
  gradient: c.redToPurple,
}
