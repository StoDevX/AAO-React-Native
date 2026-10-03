import * as React from 'react'
import * as storage from '../../lib/storage'

/** Where a tapped link opens. */
export type LinkTarget = 'app' | 'safari'

/**
 * The Open Links choice, kept in the boolean `@frogpond/open-url` reads:
 * true is In App. Shows In App until the saved value loads, matching the
 * storage default.
 */
export function useOpenLinksIn(): [LinkTarget, (target: LinkTarget) => Promise<void>] {
	let [target, setTarget] = React.useState<LinkTarget>('app')

	React.useEffect(() => {
		let cancelled = false
		storage.getInAppLinkPreference().then((inApp) => {
			if (!cancelled) {
				setTarget(inApp ? 'app' : 'safari')
			}
		})
		return () => {
			cancelled = true
		}
	}, [])

	let choose = React.useCallback(async (next: LinkTarget) => {
		await storage.setLinkPreference(next === 'app')
		setTarget(next)
	}, [])

	return [target, choose]
}
