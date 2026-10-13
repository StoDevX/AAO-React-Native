import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {StoryScreen} from '../../source/features/newspaper/story-screen'
import {newspaperRoute} from '../../source/features/newspaper/newspaper-route'

function NewspaperStoryPage(): React.ReactNode {
	let {id} = useLocalSearchParams<{id: string}>()
	return <StoryScreen id={Number(id)} />
}

export default newspaperRoute(NewspaperStoryPage)
