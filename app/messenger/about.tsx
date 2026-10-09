import * as React from 'react'

import {MESSENGER} from '../../source/campuses/edu-stolaf/paper'
import {AboutScreen} from '../../source/features/mess/about-screen'
import {PaperProvider} from '../../source/features/mess/paper-context'

export default function MessengerAboutPage(): React.ReactNode {
	return (
		<PaperProvider paper={MESSENGER}>
			<AboutScreen />
		</PaperProvider>
	)
}
