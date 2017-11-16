// flow-typed signature: d3169c342fd735d9f450565e2b9cf9d7
// flow-typed version: <<STUB>>/react-native-button_v2.1.0/flow_v0.56.0

import * as $npm$react_native_button$v2_x_x$React from 'react'

declare module 'react-native-button' {
  declare type ReactComponent<T> = $npm$react_native_button$v2_x_x$React.Component<T>;
  declare type ReactNode = $npm$react_native_button$v2_x_x$React.Node;
  declare type RNStyleProp = Object | number | Array<RNStyleProp>;

  declare type ButtonProps = {|
    children: ReactNode,
    onPress?: (e: any) => any,
    style: RNStyleProp,
    styleDisabled?: RNStyleProp,
    containerStyle?: RNStyleProp,
  |};

  declare export default Class<ReactComponent<ButtonProps>>;
}
