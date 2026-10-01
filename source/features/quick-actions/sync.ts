import * as Sentry from '@sentry/react-native'
import {setQuickActions} from '@frogpond/quick-actions'
import type {QuickAction} from '@frogpond/quick-actions'

import {resolveQuickActions} from './destinations'
import type {QuickActionDestination} from './destinations'
import {useQuickActionsStore} from './store'

/** The module's items for `destinations`. Routes are percent-encoded, since Swift's URL(string:) rejects a character such as a space. */
export function toQuickActions(destinations: QuickActionDestination[]): QuickAction[] {
	return destinations.map((d) => ({
		id: d.id,
		title: d.title,
		symbol: d.icon,
		href: encodeURI(d.href),
	}))
}

function pushQuickActions(): void {
	let destinations = resolveQuickActions(useQuickActionsStore.getState().quickActions)
	// The menu is a convenience; a failure is worth knowing about, not showing.
	setQuickActions(toQuickActions(destinations)).catch((error: unknown) => {
		Sentry.captureException(error)
	})
}

/**
 * Keep the app icon's quick actions in step with the store: once it has
 * loaded, then on every change. Pushing on each launch also replaces items an
 * older version left pointing at a route that has since moved.
 *
 * Returns a function that stops it.
 */
export function startQuickActionSync(): () => void {
	let stopOnHydration = useQuickActionsStore.persist.onFinishHydration(pushQuickActions)
	let stopOnChange = useQuickActionsStore.subscribe((state, previous) => {
		if (state.quickActions !== previous.quickActions) {
			pushQuickActions()
		}
	})
	if (useQuickActionsStore.persist.hasHydrated()) {
		pushQuickActions()
	}

	return () => {
		stopOnHydration()
		stopOnChange()
	}
}
