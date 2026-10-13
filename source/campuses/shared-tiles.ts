import * as c from '@frogpond/colors'

import type {ViewType} from '../features/views'

/** The tile every campus's Home ends on, shown in dev mode only. */
export const developerTile: ViewType = {
	type: 'view',
	view: '/developer',
	title: 'Developer',
	icon: 'hammer.fill',
	gradient: c.grayGradient,
	devOnly: true,
}
