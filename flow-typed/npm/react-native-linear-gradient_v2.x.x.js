// @flow

import * as $npm$react_native_linear_gradient$v2_x_x$React from 'react'
import { type ViewProps as $npm$react_native_linear_gradient$v2_x_x$ViewProps } from 'react-native'

declare module 'react-native-linear-gradient' {
  declare type ReactElement<T> = $npm$react_native_linear_gradient$v2_x_x$React.Element<T>;
  declare type ReactComponent<T> = $npm$react_native_linear_gradient$v2_x_x$React.Component<T>;
  declare type ReactNode = $npm$react_native_linear_gradient$v2_x_x$React.Node;
  declare type RNViewProps = $npm$react_native_linear_gradient$v2_x_x$ViewProps;
  declare type RNStyleProp = Object | number | Array<RNStyleProp>;

  declare type LinearGradientProps = {
    start?: Array<number> | {x: number, y: number};
    end?: Array<number> | {x: number, y: number};
    colors: Array<string>;
    locations?: Array<number>;
  } & RNViewProps;

  declare export default Class<ReactComponent<LinearGradientProps>>;
}

