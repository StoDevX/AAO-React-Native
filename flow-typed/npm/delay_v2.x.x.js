// flow-typed signature: 19c9da0a594b41404287bce7069001d5
// flow-typed version: <<STUB>>/delay_v2.0.0/flow_v0.56.0

class $npm$delay$2_x_x$CancelError extends Error {};
class $npm$delay$2_x_x$Promise<T> extends Promise<T> {
    cancel: () => void;
};

declare module 'delay' {
  declare export default function delay<T>(time: number, value?: T): $npm$delay$2_x_x$Promise<T>;
  declare export function reject<T>(time: number, value: ?T): $npm$delay$2_x_x$Promise<T>;
  declare export var CancelError: $npm$delay$2_x_x$CancelError;
}
