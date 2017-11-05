// flow-typed signature: d3169c342fd735d9f450565e2b9cf9d7
// flow-typed version: <<STUB>>/react-native-button_v2.1.0/flow_v0.56.0

import * as React from 'react'

type $npm$react_native_button$v2_x_x$Style = Object | number | Array<$npm$react_native_button$v2_x_x$Style>;

type $npm$react_native_button$v2_x_x$Props = {|
  children: React.Node,
  onPress?: (e: any) => any,
  style: $npm$react_native_button$v2_x_x$Style,
  styleDisabled: $npm$react_native_button$v2_x_x$Style,
  containerStyle: $npm$react_native_button$v2_x_x$Style,
|};

declare module 'react-native-button' {
  declare export default Class<React.Component<$npm$react_native_button$v2_x_x$Props>>;
}
