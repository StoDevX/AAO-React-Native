import * as React from 'react'
import {BonAppHostedMenu} from '../../../source/features/menus/menu-bonapp'
import {LoadingView} from '@frogpond/notice'
import {useHasEverBeenFocused} from '../../../source/lib/use-has-ever-been-focused'

export default function StavHallPage(): React.ReactNode {
	// `NativeTabs` builds every tab the moment Menus opens, so a reader who
	// only wants one cafe pays for all of them. Defer this one until it is
	// actually asked for.
	let hasBeenFocused = useHasEverBeenFocused()

	if (!hasBeenFocused) {
		// A spinner rather than nothing: `useIsFocused` trails the native tab
		// switch by a render, so the tab is already on screen for a frame before
		// this flips. The menu below opens on a `LoadingView` of its own, so the
		// reader sees one continuous spinner instead of a blank flash.
		return <LoadingView />
	}

	return (
		<BonAppHostedMenu
			cafe="stav-hall"
			loadingMessage={[
				'Hunting Ferndale Turkey…',
				'Tracking wild vegan burgers…',
				'"Cooking" some lutefisk…',
				'Finding more mugs…',
				'Waiting for omelets…',
				'Putting out more cookies…',
			]}
			name="Stav Hall"
		/>
	)
}
