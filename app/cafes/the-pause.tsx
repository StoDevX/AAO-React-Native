import * as React from 'react'

import ThePausePage from '../menus/the-pause'
import {CafeScreen} from '../../source/features/menus/cafe-screen'

export default function ThePauseScreen(): React.ReactNode {
	return (
		<CafeScreen>
			<ThePausePage />
		</CafeScreen>
	)
}
