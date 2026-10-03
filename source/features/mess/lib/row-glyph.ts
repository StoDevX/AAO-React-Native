import type {SFSymbol} from 'sf-symbols-typescript'
import type {MessStory} from '../types'
import {puzzleIcon} from './puzzle'

/** The glyph for each Variety column whose posts often come with no photo. */
const COLUMN_GLYPHS: Record<string, SFSymbol> = {
	Playlist: 'music.note.list',
	'Short Story': 'book.pages',
	Poetry: 'quote.opening',
	Horoscopes: 'moon.stars',
}

/**
 * The glyph a story's row draws in place of a photo it lacks, naming what kind of story it is:
 * a puzzle by its game, or one of the columns above. Null for any other story, whose row keeps
 * a plain tinted square.
 */
export function rowGlyph(story: MessStory): SFSymbol | null {
	if (story.layout.kind === 'puzzle') return puzzleIcon(story.layout.puzzle)
	return (story.column && COLUMN_GLYPHS[story.column]) || null
}
