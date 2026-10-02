import {useRouter} from 'expo-router'
import type {MessStory} from './types'

/** Opens a story in the reader. */
export function useOpenStory(): (story: MessStory) => void {
	let router = useRouter()
	return (story) => router.navigate({pathname: '/messenger/story', params: {id: String(story.id)}})
}
