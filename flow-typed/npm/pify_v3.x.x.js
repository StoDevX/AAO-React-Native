// flow-typed signature: c90996cf992c6684e783673c3d9e1e84
// flow-typed version: <<STUB>>/pify_v3.0.0/flow_v0.56.0

type $npm$pify$3_x_x$options = {|
    multiArgs: boolean,
    include: Array<string|RegExp>,
    exclude: Array<string|RegExp>,
    excludeMain: boolean,
    errorFirst: boolean,
    promiseModule: Function,
|}

declare module 'pify' {
  declare export default function pify<T: Function | Object>(input: T, options?: $npm$pify$3_x_x$options): T;
}
