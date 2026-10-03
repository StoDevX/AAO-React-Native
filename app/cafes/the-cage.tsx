import * as React from 'react'

import TheCagePage from '../menus/the-cage'
import {CafeScreen} from '../../source/features/menus/cafe-screen'

export default function TheCageScreen(): React.ReactNode {
	return (
		<CafeScreen>
			<TheCagePage />
		</CafeScreen>
	)
}
