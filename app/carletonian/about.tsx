import * as React from 'react'

import {AboutScreen} from '../../source/features/mess/about-screen'
import {CARLETONIAN} from '../../source/campuses/edu-carleton/paper'
import {PaperProvider} from '../../source/features/mess/paper-context'

export default function CarletonianAboutPage(): React.ReactNode {
	return (
		<PaperProvider paper={CARLETONIAN}>
			<AboutScreen />
		</PaperProvider>
	)
}
