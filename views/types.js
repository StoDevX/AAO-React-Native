// @flow
import {PropTypes} from 'react'
import {Navigator} from 'react-native'

export type TopLevelViewPropsType = {
  navigator: typeof Navigator,
  route: {
    index: number,
  },
};

export const TopLevelViewPropTypes = {
  navigator: PropTypes.instanceOf(Navigator).isRequired,
  route: PropTypes.object.isRequired,
}
