// flow-typed signature: edd59223bacb9f414e3a3c7c4d17fe2c
// flow-typed version: <<STUB>>/react-async_v6.2.0/flow_v0.92.1

declare module 'react-async' {
  import type {Node} from 'react'

  declare export type PromiseFn<T> = (props: Object, controller: AbortController) => Promise<T>
  declare export type DeferFn<T> = (args: any[], props: Object, controller: AbortController) => Promise<T>

  declare export type AsyncOptions<T> = {
    promise?: Promise<T>,
    promiseFn?: PromiseFn<T>,
    deferFn?: DeferFn<T>,
    watch?: any,
    watchFn?: (props: Object, prevProps: Object) => any,
    initialValue?: T,
    onResolve?: (data: T) => void,
    onReject?: (error: Error) => void,
    [prop: string]: any,
  }

  declare type AbstractState<T> = {
    initialValue?: T | Error,
    counter: number,
    cancel: () => void,
    run: (...args: any[]) => Promise<T>,
    reload: () => void,
    setData: (data: T, callback?: () => void) => T,
    setError: (error: Error, callback?: () => void) => Error,
  }

  declare export type AsyncState<T> = AbstractState<T> & {
    initialValue?: ?T,
    data: ?T,
    error: ?Error,
    value: ?(T | Error),
    startedAt: ?Date,
    finishedAt: ?Date,
    status: "initial" | "pending" | "fulfilled" | "rejected",
    isInitial: boolean,
    isPending: boolean,
    isLoading: boolean,
    isFulfilled: boolean,
    isResolved: boolean,
    isRejected: boolean,
    isSettled: boolean,
  }

  declare export function useAsync<T>(
    arg1: AsyncOptions<T> | PromiseFn<T>,
    arg2?: AsyncOptions<T>,
  ): AsyncState<T>
}
