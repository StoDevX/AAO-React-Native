import * as React from 'react'

import {StaffScreen} from '../../../source/features/newspaper/staff-screen'
import {newspaperRoute} from '../../../source/features/newspaper/newspaper-route'

function NewspaperStaffPage(): React.ReactNode {
	return <StaffScreen />
}

export default newspaperRoute(NewspaperStaffPage)
