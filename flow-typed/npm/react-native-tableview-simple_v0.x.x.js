// flow-typed signature: d916d5f731b562dc8f43492510e541f5
// flow-typed version: <<STUB>>/react-native-tableview-simple_v0.13.0/flow_v0.35.0

import * as React from 'react'
import {Image} from 'react-native'

type $npm$react_native_tableview_simple$v0_x_x$Style = Object | number | Array<$npm$react_native_tableview_simple$v0_x_x$Style>;

type $npm$react_native_tableview_simple$v0_x_x$TableviewProps = {|
  children: React.Node,
|};

type $npm$react_native_tableview_simple$v0_x_x$SectionProps = {|
  allowFontScaling?: boolean,
  children: React.Node,
  footerComponent?: React.Element<typeof React.Component>,
  headerComponent?: React.Element<typeof React.Component>,
  footer?: string,
  footerTextColor?: string,
  header?: string,
  headerTextColor?: string,
  hideSeparator?: boolean,
  sectionTintColor?: string,
  separatorInsetLeft?: number,
  separatorInsetRight?: number,
  separatorTintColor?: string,
|};

type $npm$react_native_tableview_simple$v0_x_x$CellProps = {|
  accessory?: 'DisclosureIndicator' | 'Detail' | 'DetailDisclosure' | 'Checkmark',
  accessoryColor?: string,
  allowFontScaling?: boolean,
  backgroundColor?: string,
  cellStyle?: 'Basic' | 'RightDetail' | 'LeftDetail' | 'Subtitle',
  cellAccessoryView?: React.Element<typeof React.Component>,
  cellContentView?: React.Element<typeof React.Component>,
  cellImageView?: React.Element<typeof React.Component>,
  contentContainerStyle?: $npm$react_native_tableview_simple$v0_x_x$Style,
  detail?: React.Node,
  detailTextStyle?: $npm$react_native_tableview_simple$v0_x_x$Style,
  disableImageResize?: boolean,
  highlightActiveOpacity?: number,
  highlightUnderlayColor?: string,
  isDisabled?: boolean,
  image?: Image,
  leftDetailColor?: string,
  rightDetailColor?: string,
  title?: React.Node,
  titleTextColor?: string,
  titleTextStyle?: $npm$react_native_tableview_simple$v0_x_x$Style,
  titleTextStyleDisabled?: $npm$react_native_tableview_simple$v0_x_x$Style,
  onPress?: (e: any) => any,
|};

declare module 'react-native-tableview-simple' {
  declare export var TableView: Class<React.Component<$npm$react_native_tableview_simple$v0_x_x$TableviewProps>>;
  declare export var Section: Class<React.Component<$npm$react_native_tableview_simple$v0_x_x$SectionProps>>;
  declare export var Cell: Class<React.Component<$npm$react_native_tableview_simple$v0_x_x$CellProps>>;
}
