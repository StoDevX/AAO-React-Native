// flow-typed signature: edd59223bacb9f414e3a3c7c4d17fe2c
// flow-typed version: <<STUB>>/react-async_v6.2.0/flow_v0.92.1

declare module 'react-async' {
  declare export type Result<T> = {
    data: ?T,
    error: ?Error,
    value: ?T | Error,
    initialValue: T | Error,
    startedAt: Date,
    finishedAt: Date,
    isPending: boolean,
    isInitial: boolean,
    isFulfilled: boolean,
    isRejected: boolean,
    isSettled: boolean,
    status: 'initial' | 'pending' | 'fulfilled' | 'rejected',
    counter: number,
    cancel: () => void,
    run: (...Array<any>) => void,
    reload: () => void,
    setData: (T, cb?: () => void) => T,
    setError: (Error, cb?: () => void) => Error,
  }

  declare type PromiseFn<T> = (Object, {signal: window.AbortController}) => Promise<T>

  declare type KnownArgs<T> = {
    promise?: Promise<T>,
    promiseFn?: PromiseFn<T>,
    deferFn?: () => Promise<T>,
    watch?: any,
    watchFn?: () => any,
    initialValue?: T | Error,
    onResolve?: () => mixed,
    onReject?: () => mixed,
  }

  declare type PromiseArgs = {
    [string]: any,
  }

  declare type Args<T> = $Rest<KnownArgs<T>, PromiseArgs>

  declare export function useAsync<T>(args: Args<T> | PromiseFn<T>, args2?: Args<T>): Result<T>;
}
