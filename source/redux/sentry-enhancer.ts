import * as Sentry from '@sentry/react-native'
import type {StoreEnhancer} from '@reduxjs/toolkit'

// Minimal shape needed to redact sensitive slices. Kept local so the enhancer
// module doesn't create a circular import with `store.ts`.
type ReduxStateShape = {
	courses?: {recentSearches?: unknown}
	[key: string]: unknown
}

type ReduxAction = {type: string; payload?: unknown; [key: string]: unknown}

// Action types whose payloads may contain user-entered text and should be
// redacted before being sent as Sentry breadcrumbs.
const REDACTED_ACTION_TYPES = new Set<string>(['courses/updateRecentSearches'])

export const sentryReduxEnhancer = Sentry.createReduxEnhancer({
	// Redact slices that may contain user-entered text.
	stateTransformer: (state: ReduxStateShape | undefined) => {
		if (!state) {
			return state
		}

		return {
			...state,
			courses: state.courses
				? {...state.courses, recentSearches: '[Redacted]'}
				: state.courses,
		}
	},

	// Preserve the action type (so breadcrumbs stay useful) but drop any
	// payload that could contain user-entered text.
	actionTransformer: (action: ReduxAction) => {
		if (REDACTED_ACTION_TYPES.has(action.type)) {
			return {...action, payload: '[Redacted]'}
		}
		return action
	},
}) as unknown as StoreEnhancer
