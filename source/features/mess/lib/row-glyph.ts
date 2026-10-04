import type {SFSymbol} from 'sf-symbols-typescript'
import type {MessStory} from '../types'
import {puzzleIcon} from './puzzle'

/** The glyph for each of the paper's columns, as its chip draws it. */
const COLUMN_GLYPHS: Record<string, SFSymbol> = {
	// Arts & Entertainment
	Heartbeat: 'waveform.path.ecg',
	StoReview: 'star.bubble',
	// Sports
	'Club Sport Spotlight': 'sportscourt',
	'Ole Athlete Spotlight': 'figure.run',
	'Ole Athletics Commentary and Suggestion Box': 'envelope.open',
	// News
	'2024 Elections': 'checkmark.seal',
	'Good Questions': 'questionmark.bubble',
	'Local Finds': 'mappin.and.ellipse',
	// Opinions
	'Messenger Wars': 'flag.2.crossed',
	// Variety
	Artwork: 'paintpalette',
	Comic: 'bubble.left.and.bubble.right',
	Crossword: 'square.grid.3x3',
	Horoscopes: 'moon.stars',
	Photo: 'camera',
	Playlist: 'music.note.list',
	Poetry: 'quote.opening',
	Puzzle: 'puzzlepiece',
	Recipes: 'fork.knife',
	'Short Story': 'book.pages',
}

/** The glyph for a column the paper has added since the list above was written. */
const FALLBACK_COLUMN_GLYPH: SFSymbol = 'newspaper'

/** The Variety columns whose posts often come with no photo, whose rows draw the column's glyph. */
const PHOTOLESS_COLUMNS: ReadonlySet<string> = new Set([
	'Playlist',
	'Short Story',
	'Poetry',
	'Horoscopes',
])

/** The glyph a column's chip draws beside its name. */
export function columnGlyph(column: string): SFSymbol {
	return COLUMN_GLYPHS[column] ?? FALLBACK_COLUMN_GLYPH
}

/**
 * The glyph a story's row draws in place of a photo it lacks, naming what kind of story it is:
 * a puzzle by its game, or one of the photoless columns above. Null for any other story, whose
 * row keeps a plain tinted square.
 */
export function rowGlyph(story: MessStory): SFSymbol | null {
	if (story.layout.kind === 'puzzle') return puzzleIcon(story.layout.puzzle)
	if (story.column && PHOTOLESS_COLUMNS.has(story.column)) return columnGlyph(story.column)
	return null
}
