import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {IssueScreen} from '../../source/features/mess/issue-screen'
import {newspaperRoute} from '../../source/features/mess/newspaper-route'

function NewspaperIssuePage(): React.ReactNode {
	let {key} = useLocalSearchParams<{key: string}>()
	return <IssueScreen issueKey={key} />
}

export default newspaperRoute(NewspaperIssuePage)
