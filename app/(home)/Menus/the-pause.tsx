import * as React from 'react'
import {GitHubHostedMenu} from '../../../source/features/menus/menu-github'
import {PAUSE_VENUE} from '../../../source/features/menus/lib/cafe-hours'

export default function ThePausePage(): React.ReactNode {
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
