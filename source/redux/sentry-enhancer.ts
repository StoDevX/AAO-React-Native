import * as Sentry from '@sentry/react-native'
import type {StoreEnhancer} from '@reduxjs/toolkit'

type ReduxAction = {type: string; payload?: unknown; [key: string]: unknown}

export const sentryReduxEnhancer = Sentry.createReduxEnhancer({
	// No app state goes with an error. It holds favorite buildings, recent
	// course filters and searches; tied to a device ID, that is a profile.
	stateTransformer: () => null,

	// The action type says what happened; a payload can carry a building, a
	// search or a filter, so none is sent.
	actionTransformer: (action: ReduxAction) => ({type: action.type}),
}) as unknown as StoreEnhancer
