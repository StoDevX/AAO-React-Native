import * as React from 'react'
import {LoadingView} from '@frogpond/notice'
import {useCafeDeferred} from '../../source/features/menus/use-cafe-deferred'
import {BonAppHostedMenu} from '../../source/features/menus/menu-bonapp'

export default function StavHallPage(): React.ReactNode {
	// A spinner rather than nothing: `useIsFocused` trails the native tab
	// switch by a render, so the tab is already on screen for a frame before
	// this flips. The menu below opens on a `LoadingView` of its own, so the
	// reader sees one continuous spinner instead of a blank flash.
	if (useCafeDeferred()) {
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
