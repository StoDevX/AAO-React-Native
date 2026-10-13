import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {StaffMemberScreen} from '../../../source/features/newspaper/staff-screen'
import {newspaperRoute} from '../../../source/features/newspaper/newspaper-route'

function NewspaperStaffMemberPage(): React.ReactNode {
	let {id} = useLocalSearchParams<{id: string}>()
	return <StaffMemberScreen id={id} />
}

export default newspaperRoute(NewspaperStaffMemberPage)
