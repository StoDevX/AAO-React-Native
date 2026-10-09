import * as React from 'react'

import {MESSENGER} from '../../source/campuses/edu-stolaf/paper'
import {FrontPageScreen} from '../../source/features/mess/front-page-screen'
import {PaperProvider} from '../../source/features/mess/paper-context'

export default function MessengerPage(): React.ReactNode {
	return (
		<PaperProvider paper={MESSENGER}>
			<FrontPageScreen />
		</PaperProvider>
	)
}
