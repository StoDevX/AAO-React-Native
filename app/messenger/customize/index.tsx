import * as React from 'react'

import {MESSENGER} from '../../../source/campuses/edu-stolaf/paper'
import {CustomizeScreen} from '../../../source/features/mess/customize-screen'
import {PaperProvider} from '../../../source/features/mess/paper-context'

export default function MessengerCustomizePage(): React.ReactNode {
	return (
		<PaperProvider paper={MESSENGER}>
			<CustomizeScreen />
		</PaperProvider>
	)
}
