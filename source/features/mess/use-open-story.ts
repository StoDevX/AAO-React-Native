import {useRouter} from 'expo-router'
import {openUrl} from '@frogpond/open-url'
import {puzzleUrl} from './lib/puzzle'
import {useMessStore} from './store'
import {usePaper} from './paper-context'
import type {MessStory} from './types'

/**
 * Opens a story in the reader, or a crossword or other puzzle straight to its game, since playing
 * it is all its page is for.
 */
export function useOpenStory(): (story: MessStory) => void {
	let router = useRouter()
	let {routes} = usePaper()
	let recordOpened = useMessStore((state) => state.recordOpened)
	return (story) => {
		if (story.layout.kind === 'puzzle') {
			// Opening a story counts towards its issue's stains, however it is opened.
			recordOpened(story.id)
			openUrl(puzzleUrl(story.layout.puzzle, story.link))
			return
		}
		router.navigate({pathname: routes.story, params: {id: String(story.id)}})
	}
}
