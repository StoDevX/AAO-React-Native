import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {MESSENGER} from '../../source/campuses/edu-stolaf/paper'
import {StoryScreen} from '../../source/features/mess/story-screen'
import {PaperProvider} from '../../source/features/mess/paper-context'

export default function MessengerStoryPage(): React.ReactNode {
	let {id} = useLocalSearchParams<{id: string}>()
	return (
		<PaperProvider paper={MESSENGER}>
			<StoryScreen id={Number(id)} />
		</PaperProvider>
	)
}
