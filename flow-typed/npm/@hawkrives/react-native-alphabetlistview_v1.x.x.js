// flow-typed signature: cb8ee3baf068177aca4e54c8011db765
// flow-typed version: <<STUB>>/@hawkrives/react-native-alphabetlistview_v1.0.0/flow_v0.56.0

import * as $npm$react_native_alv$v2_x_x$React from 'react'

declare module '@hawkrives/react-native-alphabetlistview' {
  declare type ReactElement<T> = $npm$react_native_alv$v2_x_x$React.Element<T>;
  declare type ReactComponent<T> = $npm$react_native_alv$v2_x_x$React.Component<T>;
  declare type ReactNode = $npm$react_native_alv$v2_x_x$React.Node;
  declare type RNStyleProp = Object | number | Array<RNStyleProp>;

  declare type AlphabetListViewProps = {|
    data: Array<any> | {[key: string]: any},
    hideSectionList?: boolean,
    getSectionTitle?: (string) => string,
    getSectionListTitle?: (string) => string,
    compareFunction?: <T, U>(T, U) => -1 | 0 | 1,
    onCellSelect?: () => any,
    onScrollToSection?: (any) => any,
    cell: ReactNode,
    sectionListItem?: ReactNode,
    sectionHeader?: ReactNode,
    footer?: ReactNode,
    header?: ReactNode,
    headerHeight?: number,
    renderHeader?: ReactNode,
    renderFooter?: ReactNode,
    cellProps?: {[key: string]: any},
    sectionHeaderHeight: number,
    cellHeight: number,
    useDynamicHeights?: boolean,
    updateScrollState?: boolean,
    style: RNStyleProp,
    sectionListStyle: RNStyleProp,
    sectionListFontStyle: RNStyleProp,
  |};

  declare export default Class<ReactComponent<AlphabetListViewProps>>;
}
