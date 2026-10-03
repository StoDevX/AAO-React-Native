import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {StaffMemberScreen} from '../../../source/features/mess/staff-screen'

export default function MessengerStaffMemberPage(): React.ReactNode {
	let {id} = useLocalSearchParams<{id: string}>()
	return <StaffMemberScreen id={id} />
}
