// flow-typed signature: 2f2e6af1aaf8e772b7edee7d6819adca
// flow-typed version: <<STUB>>/react-async_v3.8.2/flow_v0.78.0

declare module 'react-async' {
  import type {Node as ReactNode} from 'react'

  declare type AsyncChildren<T> = ((state: AsyncState<T>) => ReactNode) | ReactNode

  declare export type Props<T> = {
    promiseFn?: (props: {[string]: any}) => Promise<T>,
    deferFn?: (...args: any[]) => Promise<T>,
    watch?: any,
    initialValue?: T,
    onResolve?: (data: T) => void,
    onError?: (error: Error) => void,
    children?: AsyncChildren<T>,
  }

  declare export type AsyncState<T> = {
    initialValue?: T,
    data?: T,
    error?: Error,
    isLoading: boolean,
    startedAt?: Date,
    finishedAt?: Date,
    cancel: () => void,
    run: (...args: any[]) => Promise<T>,
    reload: () => void,
    setData: (data: T, callback?: () => void) => T,
    setError: (error: Error, callback?: () => void) => Error,
  }

  declare class Async<T> extends React$Component<Props<T>, AsyncState<T>> {
    Pending<T>(props: { children?: AsyncChildren<T>; persist?: boolean }): ReactNode;
    Loading<T>(props: { children?: AsyncChildren<T>; initial?: boolean }): ReactNode;
    Resolved<T>(props: { children?: AsyncChildren<T>; persist?: boolean }): ReactNode;
    Rejected<T>(props: { children?: AsyncChildren<T>; persist?: boolean }): ReactNode;
  }

  declare function createInstance<T>(defaultProps?: Props<T>): Async<T>

  declare export default createInstance<*>
}
