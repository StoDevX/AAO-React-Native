import * as React from 'react'

import {FrontPageScreen} from '../../source/features/mess/front-page-screen'
import {CARLETONIAN} from '../../source/campuses/edu-carleton/paper'
import {PaperProvider} from '../../source/features/mess/paper-context'

export default function CarletonianPage(): React.ReactNode {
	return (
		<PaperProvider paper={CARLETONIAN}>
			<FrontPageScreen />
		</PaperProvider>
	)
}
