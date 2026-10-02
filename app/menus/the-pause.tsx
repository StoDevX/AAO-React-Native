import * as React from 'react'
import {LoadingView} from '@frogpond/notice'
import {useCafeDeferred} from '../../source/features/menus/use-cafe-deferred'
import {GitHubHostedMenu} from '../../source/features/menus/menu-github'
import {PAUSE_VENUE} from '../../source/features/menus/lib/cafe-hours'

export default function ThePausePage(): React.ReactNode {
	// A spinner rather than nothing: `useIsFocused` trails the native tab
	// switch by a render, so the tab is already on screen for a frame before
	// this flips. The menu below opens on a `LoadingView` of its own, so the
	// reader sees one continuous spinner instead of a blank flash.
	if (useCafeDeferred()) {
		return <LoadingView />
	}

	return (
		<GitHubHostedMenu
			loadingMessage={[
				'Mixing up a shake…',
				'Spinning up pizzas…',
				'Turning up the music…',
				'Putting ice cream on the cookies…',
				'Fixing the oven…',
			]}
			// Titled by the venue whose hours sit under the name, rather than by the
			// home tile's shorter label.
			name={PAUSE_VENUE}
			venue={PAUSE_VENUE}
		/>
	)
}
