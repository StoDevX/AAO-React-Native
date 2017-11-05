// flow-typed signature: 5826e9e5d0a2cd094907edb6ed550328
// flow-typed version: <<STUB>>/get-urls_v7.0.0/flow_v0.56.0

type $npm$getUrls$7_x_x$normalizeUrlOptions = {|
    normalizeProtocol: boolean,
    normalizeHttps: boolean,
    stripFragment: boolean,
    stripWWW: boolean,
    removeQueryParameters: boolean|Array<RegExp|string>,
    removeTrailingSlash: boolean,
    removeDirectoryIndex: boolean|Array<RegExp|string>,
|};

declare module 'get-urls' {
  declare export default function getUrls(
    text: string,
    options?: $npm$getUrls$7_x_x$normalizeUrlOptions,
  ): Set<string>;
}
