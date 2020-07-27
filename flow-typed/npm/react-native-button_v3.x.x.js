// flow-typed signature: b8f67e8d05abcec934172461e628ce59
// flow-typed version: <<STUB>>/react-native-button_v3.0.1/flow_v0.122.0

import * as $npm$react_native_button$v3_x_x$React from 'react-native'

declare module 'react-native-button' {
  declare type ReactComponent<T> = $npm$react_native_button$v3_x_x$React.Component<T>;
  declare type ReactNode = $npm$react_native_button$v3_x_x$React.Node;
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
