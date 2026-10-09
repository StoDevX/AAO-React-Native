import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {MESSENGER} from '../../source/campuses/edu-stolaf/paper'
import {IssueScreen} from '../../source/features/mess/issue-screen'
import {PaperProvider} from '../../source/features/mess/paper-context'

export default function MessengerIssuePage(): React.ReactNode {
	let {key} = useLocalSearchParams<{key: string}>()
	return (
		<PaperProvider paper={MESSENGER}>
			<IssueScreen issueKey={key} />
		</PaperProvider>
	)
}
