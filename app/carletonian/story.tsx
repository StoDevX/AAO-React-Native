import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {CARLETONIAN} from '../../source/campuses/edu-carleton/paper'
import {PaperProvider} from '../../source/features/mess/paper-context'
import {StoryScreen} from '../../source/features/mess/story-screen'

export default function CarletonianStoryPage(): React.ReactNode {
	let {id} = useLocalSearchParams<{id: string}>()
	return (
		<PaperProvider paper={CARLETONIAN}>
			<StoryScreen id={Number(id)} />
		</PaperProvider>
	)
}
