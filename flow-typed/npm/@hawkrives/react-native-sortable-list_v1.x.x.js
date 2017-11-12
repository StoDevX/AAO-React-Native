// flow-typed signature: 97189969f4a706c26facceb2dd49db3c
// flow-typed version: <<STUB>>/@hawkrives/react-native-sortable-list_v1.0.1/flow_v0.56.0

import * as $npm$react_native_sortable_list$v2_x_x$React from 'react'

declare module '@hawkrives/react-native-sortable-list' {
  declare type ReactNode = $npm$react_native_sortable_list$v2_x_x$React.Node;
  declare type RNStyleProp = Object | number | Array<RNStyleProp>;

  declare type RenderRowArgs = {
    key: any,
    index: number,
    data: any,
    disabled: boolean,
    active: boolean,
  };

  declare type SortableListProps = {|
    data: {[key: string]: any},
    order: Array<string>,
    sortingEnabled: boolean,
    scrollEnabled: boolean,
    style: RNStyleProp,
    contentContainerStyle: RNStyleProp,
    renderRow: (RenderRowArgs) => ReactNode,
    onChangeOrder: (newOrder: Array<string>) => any,
    onActivateRow: (key: string) => any,
    onReleaseRow: (key: string) => any,
  |};

  declare export default class SortableList extends $npm$react_native_sortable_list$v2_x_x$React.Component<SortableListProps> {
    scrollBy: (dy?: number, animated?: boolean) => any;
    scrollTo: (y?: number, animated?: boolean) => any;
    scrollToRowKey: (key?: string, animated?: boolean) => any;
  }
}
