import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {MESSENGER} from '../../source/campuses/edu-stolaf/paper'
import {IssueSectionScreen} from '../../source/features/mess/issue-section-screen'
import {PaperProvider} from '../../source/features/mess/paper-context'

export default function MessengerIssueSectionPage(): React.ReactNode {
	let {key, section} = useLocalSearchParams<{key: string; section: string}>()
	return (
		<PaperProvider paper={MESSENGER}>
			<IssueSectionScreen issueKey={key} section={section} />
		</PaperProvider>
	)
}
