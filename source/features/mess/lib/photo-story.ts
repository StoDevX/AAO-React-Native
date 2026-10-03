import type {MessStory} from '../types'

/**
 * Whether a story opens in Dark Mode whatever the system's appearance: a
 * Variety › Photo story does while the reader keeps that setting on, since a
 * photo essay reads better on a dark page.
 */
export function keepsDarkMode(
	story: Pick<MessStory, 'section' | 'column'>,
	keepPhotoStoriesDark: boolean,
): boolean {
	return keepPhotoStoriesDark && story.section === 'Variety' && story.column === 'Photo'
}
