import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {IssueSectionScreen} from '../../source/features/newspaper/issue-section-screen'
import {newspaperRoute} from '../../source/features/newspaper/newspaper-route'

function NewspaperIssueSectionPage(): React.ReactNode {
	let {key, section} = useLocalSearchParams<{key: string; section: string}>()
	return <IssueSectionScreen issueKey={key} section={section} />
}

export default newspaperRoute(NewspaperIssueSectionPage)
