import * as React from 'react'
import {GitHubHostedMenu} from '../../../source/features/menus/menu-github'

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
			name="The Pause"
		/>
	)
}
