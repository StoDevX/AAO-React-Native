// @flow

import * as React from 'react'
import type { ViewProps } from 'react-native'

type Props = {
  start?: Array<number> | {x: number, y: number};
  end?: Array<number> | {x: number, y: number};
  colors: Array<string>;
  locations?: Array<number>;
} & ViewProps;

declare module 'react-native-linear-gradient' {
  declare export default Class<React.Component<Props>>;
}

