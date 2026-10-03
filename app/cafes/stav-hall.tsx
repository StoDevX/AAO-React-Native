import * as React from 'react'

import StavHallPage from '../menus/index'
import {CafeScreen} from '../../source/features/menus/cafe-screen'

export default function StavHallScreen(): React.ReactNode {
	return (
		<CafeScreen>
			<StavHallPage />
		</CafeScreen>
	)
}
