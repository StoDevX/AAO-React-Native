import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {IssueScreen} from '../../source/features/mess/issue-screen'
import {CARLETONIAN} from '../../source/campuses/edu-carleton/paper'
import {PaperProvider} from '../../source/features/mess/paper-context'

export default function CarletonianIssuePage(): React.ReactNode {
	let {key} = useLocalSearchParams<{key: string}>()
	return (
		<PaperProvider paper={CARLETONIAN}>
			<IssueScreen issueKey={key} />
		</PaperProvider>
	)
}
