// flow-typed signature: 7f974b1c8a2ea78feb0a02284c1c118b
// flow-typed version: d0330bd3a2/directory-tree_v2.x.x/flow_>=v0.71.x

declare module 'directory-tree' {
  import typeof pathType from 'path';

  declare type directoryNodeType = {|
    path: string,
    name: string,
    size: number,
    type: 'directory' | 'file',
    extension?: string,
    children?: $ReadOnlyArray<directoryNodeType>,
  |};

  declare type directoryTreeType = (
    path: string,
    options?: {|
      normalizePath?: (path: string) => boolean,
      exclude?: (RegExp | $ReadOnlyArray<RegExp>),
      extensions?: RegExp,
    |} | null,
    onEachFile?: (
      item: {|
        path: string,
        name: string,
      |},
      PATH: pathType,
    ) => void,
  ) => directoryNodeType;

  declare module.exports: directoryTreeType;
}
