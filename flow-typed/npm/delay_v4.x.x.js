// flow-typed signature: 19c9da0a594b41404287bce7069001d5
// flow-typed version: <<STUB>>/delay_v2.0.0/flow_v0.56.0

declare module 'delay' {
  declare class CancellablePromise<T> extends Promise<T> {
    cancel: () => void;
  }

  declare export default function delay<T>(time: number, value?: T): CancellablePromise<T>;
  declare export function reject<T>(time: number, value: ?T): CancellablePromise<T>;
  declare export class CancelError extends Error {}
}
