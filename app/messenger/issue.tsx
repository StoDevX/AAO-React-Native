import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {IssueScreen} from '../../source/features/mess/issue-screen'

export default function MessengerIssuePage(): React.ReactNode {
	let {key} = useLocalSearchParams<{key: string}>()
	return <IssueScreen issueKey={key} />
}
