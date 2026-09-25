import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {StoryScreen} from '../../../source/features/mess/story-screen'

export default function MessengerStoryPage(): React.ReactNode {
	let {id} = useLocalSearchParams<{id: string}>()
	return <StoryScreen id={Number(id)} />
}
