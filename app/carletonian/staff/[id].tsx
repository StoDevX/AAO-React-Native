import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {CARLETONIAN_PAPER} from '../../../source/features/mess/paper'
import {PaperProvider} from '../../../source/features/mess/paper-context'
import {StaffMemberScreen} from '../../../source/features/mess/staff-screen'

export default function CarletonianStaffMemberPage(): React.ReactNode {
	let {id} = useLocalSearchParams<{id: string}>()
	return (
		<PaperProvider paper={CARLETONIAN_PAPER}>
			<StaffMemberScreen id={id} />
		</PaperProvider>
	)
}
