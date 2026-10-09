import * as React from 'react'

import {MESSENGER} from '../../source/campuses/edu-stolaf/paper'
import {CrosswordsScreen} from '../../source/features/mess/crosswords-screen'
import {PaperProvider} from '../../source/features/mess/paper-context'

export default function MessengerCrosswordsPage(): React.ReactNode {
	return (
		<PaperProvider paper={MESSENGER}>
			<CrosswordsScreen />
		</PaperProvider>
	)
}
