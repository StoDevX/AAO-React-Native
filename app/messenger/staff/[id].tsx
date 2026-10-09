import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {MESSENGER} from '../../../source/campuses/edu-stolaf/paper'
import {StaffMemberScreen} from '../../../source/features/mess/staff-screen'
import {PaperProvider} from '../../../source/features/mess/paper-context'

export default function MessengerStaffMemberPage(): React.ReactNode {
	let {id} = useLocalSearchParams<{id: string}>()
	return (
		<PaperProvider paper={MESSENGER}>
			<StaffMemberScreen id={id} />
		</PaperProvider>
	)
}
