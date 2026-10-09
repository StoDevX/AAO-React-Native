import * as React from 'react'

import {CARLETONIAN} from '../../../source/campuses/edu-carleton/paper'
import {PaperProvider} from '../../../source/features/mess/paper-context'
import {StaffScreen} from '../../../source/features/mess/staff-screen'

export default function CarletonianStaffPage(): React.ReactNode {
	return (
		<PaperProvider paper={CARLETONIAN}>
			<StaffScreen />
		</PaperProvider>
	)
}
