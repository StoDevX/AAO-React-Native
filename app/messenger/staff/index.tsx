import * as React from 'react'

import {MESSENGER} from '../../../source/campuses/edu-stolaf/paper'
import {StaffScreen} from '../../../source/features/mess/staff-screen'
import {PaperProvider} from '../../../source/features/mess/paper-context'

export default function MessengerStaffPage(): React.ReactNode {
	return (
		<PaperProvider paper={MESSENGER}>
			<StaffScreen />
		</PaperProvider>
	)
}
