// flow-typed signature: d916d5f731b562dc8f43492510e541f5
// flow-typed version: <<STUB>>/react-native-tableview-simple_v0.x.x/flow_v0.35.0

import * as $npm$react_native_tableview_simple$v0_x_x$React from 'react'
import {Image as $npm$react_native_tableview_simple$v0_x_x$Image} from 'react-native'

declare module 'react-native-tableview-simple' {
  declare type ReactElement<T> = $npm$react_native_tableview_simple$v0_x_x$React.Element<T>;
  declare type ReactComponent<T> = $npm$react_native_tableview_simple$v0_x_x$React.Component<T>;
  declare type ReactNode = $npm$react_native_tableview_simple$v0_x_x$React.Node;
  declare type RNImage = $npm$react_native_tableview_simple$v0_x_x$Image;
  declare type RNStyleProp = Object | number | Array<RNStyleProp>;

  declare type TableviewProps = {|
    children: ReactNode,
  |};

  declare type SectionProps = {|
    allowFontScaling?: boolean,
    children: ReactNode,
    footerComponent?: ReactElement<ReactComponent<*>>,
    headerComponent?: ReactElement<ReactComponent<*>>,
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

  declare type CellProps = {|
    accessory?: 'DisclosureIndicator' | 'Detail' | 'DetailDisclosure' | 'Checkmark',
    accessoryColor?: string,
    allowFontScaling?: boolean,
    backgroundColor?: string,
    cellStyle?: 'Basic' | 'RightDetail' | 'LeftDetail' | 'Subtitle',
    cellAccessoryView?: ReactElement<ReactComponent<*>>,
    cellContentView?: ReactElement<ReactComponent<*>>,
    cellImageView?: ReactElement<ReactComponent<*>>,
    contentContainerStyle?: RNStyleProp,
    detail?: ReactNode,
    detailTextStyle?: RNStyleProp,
    disableImageResize?: boolean,
    highlightActiveOpacity?: number,
    highlightUnderlayColor?: string,
    isDisabled?: boolean,
    image?: RNImage,
    leftDetailColor?: string,
    rightDetailColor?: string,
    title?: ReactNode,
    titleTextColor?: string,
    titleTextStyle?: RNStyleProp,
    titleTextStyleDisabled?: RNStyleProp,
    onPress?: (e: any) => any,
  |};

  declare export var TableView: Class<ReactComponent<TableviewProps>>;
  declare export var Section: Class<ReactComponent<SectionProps>>;
  declare export var Cell: Class<ReactComponent<CellProps>>;
}
