import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {IssueScreen} from '../../source/features/newspaper/issue-screen'
import {newspaperRoute} from '../../source/features/newspaper/newspaper-route'

function NewspaperIssuePage(): React.ReactNode {
	let {key} = useLocalSearchParams<{key: string}>()
	return <IssueScreen issueKey={key} />
}

export default newspaperRoute(NewspaperIssuePage)
