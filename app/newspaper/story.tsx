import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {StoryScreen} from '../../source/features/mess/story-screen'
import {newspaperRoute} from '../../source/features/mess/newspaper-route'

function NewspaperStoryPage(): React.ReactNode {
	let {id} = useLocalSearchParams<{id: string}>()
	return <StoryScreen id={Number(id)} />
}

export default newspaperRoute(NewspaperStoryPage)
