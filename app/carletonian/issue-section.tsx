import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {IssueSectionScreen} from '../../source/features/mess/issue-section-screen'
import {CARLETONIAN} from '../../source/campuses/edu-carleton/paper'
import {PaperProvider} from '../../source/features/mess/paper-context'

export default function CarletonianIssueSectionPage(): React.ReactNode {
	let {key, section} = useLocalSearchParams<{key: string; section: string}>()
	return (
		<PaperProvider paper={CARLETONIAN}>
			<IssueSectionScreen issueKey={key} section={section} />
		</PaperProvider>
	)
}
