import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {IssueSectionScreen} from '../../source/features/mess/issue-section-screen'

export default function MessengerIssueSectionPage(): React.ReactNode {
	let {key, section} = useLocalSearchParams<{key: string; section: string}>()
	return <IssueSectionScreen issueKey={key} section={section} />
}
