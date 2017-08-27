// @flow

import toPairs from 'lodash/toPairs'
import fromPairs from 'lodash/fromPairs'

import type {VisibleHomescreenViewType} from './types'

import * as appViews from '../views'

// export everything … just because we can
export const theExports = appViews

// We need to partition the exports based on the name:
// `ThingView` is a homescreen view, but `ThingNav` is a navigation item.
const isHomeDef = ([key, value]) =>
  key.endsWith('View') && value.type !== 'hidden'
const isNavDef = ([key]) => key.endsWith('Nav')

const viewDefs = toPairs(appViews)

// The homescreen views are expected to be an array, not an object, so we just
// need the second item in each pair.
export const homeViews: Array<VisibleHomescreenViewType> = viewDefs
  .filter(isHomeDef)
  .map(([_, value]) => value)

// The navigation views are expected to be an object, so we turn the pairs
// back into an object.
export const navViews = fromPairs(viewDefs.filter(isNavDef))
