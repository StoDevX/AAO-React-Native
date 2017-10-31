// flow-typed signature: d916d5f731b562dc8f43492510e541f5
// flow-typed version: <<STUB>>/react-native-tableview-simple_v0.13.0/flow_v0.35.0

import * as React from 'react'
import {Image} from 'react-native'

type Style = Object | number | Array<Style>;

type TableviewProps = {|
  children: React.Node,
|};

type SectionProps = {|
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

type CellProps = {|
  accessory?: 'DisclosureIndicator' | 'Detail' | 'DetailDisclosure' | 'Checkmark',
  accessoryColor?: string,
  allowFontScaling?: boolean,
  backgroundColor?: string,
  cellStyle?: 'Basic' | 'RightDetail' | 'LeftDetail' | 'Subtitle',
  cellAccessoryView?: React.Element<typeof React.Component>,
  cellContentView?: React.Element<typeof React.Component>,
  cellImageView?: React.Element<typeof React.Component>,
  contentContainerStyle?: Style,
  detail?: React.Node,
  detailTextStyle?: Style,
  disableImageResize?: boolean,
  highlightActiveOpacity?: number,
  highlightUnderlayColor?: string,
  isDisabled?: boolean,
  image?: Image,
  leftDetailColor?: string,
  rightDetailColor?: string,
  title?: React.Node,
  titleTextColor?: string,
  titleTextStyle?: Style,
  titleTextStyleDisabled?: Style,
  onPress?: (e: any) => any,
|};

declare module 'react-native-tableview-simple' {
  declare export var TableView: Class<React.Component<TableviewProps>>;
  declare export var Section: Class<React.Component<SectionProps>>;
  declare export var Cell: Class<React.Component<CellProps>>;
}
