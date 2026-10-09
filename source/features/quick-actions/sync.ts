import * as Sentry from '@sentry/react-native'
import {setQuickActions} from '@frogpond/quick-actions'
import type {QuickAction} from '@frogpond/quick-actions'

import {campusById} from '../../campuses'
import {useCampusStore} from '../campus/store'
import {iconImage} from '../views'
import {resolveQuickActions} from './destinations'
import type {QuickActionDestination} from './destinations'
import {pickedFor, useQuickActionsStore} from './store'

/** The module's items for `destinations`. Routes are percent-encoded, since Swift's URL(string:) rejects a character such as a space. */
export function toQuickActions(destinations: QuickActionDestination[]): QuickAction[] {
	return destinations.map((d) => ({
		id: d.id,
		title: d.title,
		...iconImage(d.icon),
		href: encodeURI(d.href),
	}))
}

function pushQuickActions(): void {
	let id = useCampusStore.getState().campus
	// Nothing to offer until someone picks a campus.
	if (id === null) {
		return
	}
	let campus = campusById(id)
	let destinations = resolveQuickActions(pickedFor(useQuickActionsStore.getState(), campus), campus)
	// The menu is a convenience; a failure is worth knowing about, not showing.
	setQuickActions(toQuickActions(destinations)).catch((error: unknown) => {
		Sentry.captureException(error)
	})
}

/**
 * Keep the app icon's quick actions in step with the store and the campus:
 * once each has loaded, then on every change. Pushing on each launch also
 * replaces items an older version left pointing at a route that has since
 * moved.
 *
 * Returns a function that stops it.
 */
export function startQuickActionSync(): () => void {
	let stopOnHydration = useQuickActionsStore.persist.onFinishHydration(pushQuickActions)
	let stopOnCampusHydration = useCampusStore.persist.onFinishHydration(pushQuickActions)
	let stopOnChange = useQuickActionsStore.subscribe((state, previous) => {
		if (
			state.quickActions !== previous.quickActions ||
			state.carletonQuickActions !== previous.carletonQuickActions
		) {
			pushQuickActions()
		}
	})
	let stopOnCampusChange = useCampusStore.subscribe((state, previous) => {
		if (state.campus !== previous.campus) {
			pushQuickActions()
		}
	})
	if (useQuickActionsStore.persist.hasHydrated()) {
		pushQuickActions()
	}

	return () => {
		stopOnHydration()
		stopOnCampusHydration()
		stopOnChange()
		stopOnCampusChange()
	}
}
