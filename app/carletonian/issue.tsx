import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {IssueScreen} from '../../source/features/mess/issue-screen'
import {CARLETONIAN_PAPER} from '../../source/features/mess/paper'
import {PaperProvider} from '../../source/features/mess/paper-context'

export default function CarletonianIssuePage(): React.ReactNode {
	let {key} = useLocalSearchParams<{key: string}>()
	return (
		<PaperProvider paper={CARLETONIAN_PAPER}>
			<IssueScreen issueKey={key} />
		</PaperProvider>
	)
}
