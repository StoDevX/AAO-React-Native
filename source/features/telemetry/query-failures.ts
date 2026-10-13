import {isHTTPError, isNetworkError, isTimeoutError} from 'ky'
import {SourceFetchError} from '@frogpond/data-sources'
import type {QueryCache} from '@tanstack/react-query'

import type {QueryKeyHead, TelemetryEvent} from './catalog'

type ApiFailure = Extract<TelemetryEvent, {name: 'api.failure'}>

/**
 * The first element of a query key, which by convention names the feature
 * (`'news'`, `'directory'`). Anything else there, such as an object of
 * search parameters, is replaced with `'unknown'` rather than sent.
 */
export function queryKeyHead(queryKey: readonly unknown[]): QueryKeyHead {
	let [head] = queryKey
	return (typeof head === 'string' ? head : 'unknown') as QueryKeyHead
}

/** Turns a failed query into an `api.failure` event, keeping only its kind and status. */
export function describeQueryFailure(queryKey: readonly unknown[], error: unknown): ApiFailure {
	let source = queryKeyHead(queryKey)

	if (error instanceof SourceFetchError) {
		return {name: 'api.failure', attributes: {source, kind: 'http', status: error.status}}
	}
	if (isHTTPError(error)) {
		return {name: 'api.failure', attributes: {source, kind: 'http', status: error.response.status}}
	}
	if (isTimeoutError(error)) {
		return {name: 'api.failure', attributes: {source, kind: 'timeout', status: 0}}
	}
	if (isNetworkError(error)) {
		return {name: 'api.failure', attributes: {source, kind: 'network', status: 0}}
	}
	return {name: 'api.failure', attributes: {source, kind: 'other', status: 0}}
}

/**
 * Reports every query that ends in an error, after React Query's retries.
 * Returns the function that stops watching.
 */
export function watchQueryFailures(
	queryCache: QueryCache,
	report: (event: ApiFailure) => void,
): () => void {
	return queryCache.subscribe((event) => {
		if (event.type === 'updated' && event.action.type === 'error') {
			report(describeQueryFailure(event.query.queryKey, event.action.error))
		}
	})
}
