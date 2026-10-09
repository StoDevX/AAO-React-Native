import * as React from 'react'

import {StaffScreen} from '../../../source/features/mess/staff-screen'
import {newspaperRoute} from '../../../source/features/mess/newspaper-route'

function NewspaperStaffPage(): React.ReactNode {
	return <StaffScreen />
}

export default newspaperRoute(NewspaperStaffPage)
