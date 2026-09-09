import * as React from 'react'
import {HStack, ScrollView, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	bold,
	font,
	foregroundStyle,
	frame,
	italic,
	lineSpacing,
	padding,
	textSelection,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import {FILL_WIDTH} from '../home/button'

import type {NormalizedEntry, Sense} from './types'

/// Measured off a screenshot of the iOS dictionary sheet, in points: the
/// system sets its entries with a wide margin, a headword a little larger than
/// `title`, and senses stepped in again from the headword.
const BODY_LINE_SPACING = 0
const HEADWORD_SIZE = 24
const PRONUNCIATION_SIZE = 19
/// The part of speech is set smaller than the entry's own text.
const PART_OF_SPEECH_SIZE = 15
/// The sheet pads to the route's own title and toolbar, so the entry's text
/// steps in by the same margin.
const SHEET_PADDING = 23
/// The gap above the headword, below whatever chrome the route above draws.
const SHEET_TOP_PADDING = 13
const TEXT_INDENT = 10
/// Senses step in again, with the number hung in the gutter so wrapped lines
/// align under the first rather than under the number.
const SENSE_INDENT = 26
const SENSE_NUMBER_WIDTH = 15
/// A dictionary divides several citations for one sense with a vertical bar.
const EXAMPLE_SEPARATOR = ' | '
const SUBSENSE_MARKER = '•'
/// The entry starts well below the sheet's own top edge.
const HEADING_TOP_SPACE = 30
/// The headword, its phonetics and its part of speech read as one block, so
/// they sit closer together than the gaps between blocks.
const HEADING_SPACING = 13

/**
 * Drops a single trailing full stop, so a definition written as a sentence can
 * still be followed by `: example` without reading as `modify.: both parties`.
 * Question and exclamation marks stay: they carry meaning a colon does not
 * replace.
 */
function withoutFullStop(definition: string): string {
	return definition.endsWith('.') ? definition.slice(0, -1) : definition
}

type Props = {
	entry: NormalizedEntry
}

/// A sense and everything under it. Sub-senses take a bullet rather than a
/// number and step in by one gutter, so the hierarchy reads off the left edge.
function SenseRow({
	sense,
	marker,
	indent,
}: {
	sense: Sense
	marker: string
	indent: number
}): React.ReactNode {
	let citations = sense.examples?.length ? sense.examples.join(EXAMPLE_SEPARATOR) : undefined

	return (
		<>
			<HStack alignment="firstTextBaseline" modifiers={[padding({leading: indent})]} spacing={0}>
				<Text
					modifiers={[
						font({textStyle: 'body', design: 'serif'}),
						bold(),
						frame({width: SENSE_NUMBER_WIDTH, alignment: 'leading'}),
					]}
				>
					{marker}
				</Text>
				{/* Grammar, definition and citations are one paragraph: a dictionary
				    runs them together rather than breaking a line between them. */}
				<Text
					modifiers={[
						font({textStyle: 'body', design: 'serif'}),
						lineSpacing(BODY_LINE_SPACING),
						textSelection(true),
					]}
				>
					{sense.grammar ? <Text modifiers={[italic()]}>{`[${sense.grammar}] `}</Text> : null}
					<Text>{citations ? withoutFullStop(sense.definition) : sense.definition}</Text>
					{citations ? (
						<Text modifiers={[italic(), foregroundStyle(c.secondaryLabel)]}>
							{`: ${citations}`}
						</Text>
					) : null}
				</Text>
			</HStack>

			{sense.subsenses?.map((subsense, index) => (
				<SenseRow
					indent={indent + SENSE_NUMBER_WIDTH}
					key={index}
					marker={SUBSENSE_MARKER}
					sense={subsense}
				/>
			))}
		</>
	)
}

/**
 * One dictionary entry, set the way the iOS Look Up popup sets one: a serif
 * headword, bracketed phonetics, and numbered senses with italic examples.
 *
 * Presentational — the route that hosts it owns the title and the toolbar.
 */
export function EntryDefinition({entry}: Props): React.ReactNode {
	return (
		// The sheet hands its content a Group holding both this view and the
		// editor sheet's anchor, so this one does not fill the sheet on its
		// own. The sheet's own chrome is a translucent material, which shows
		// through as a grey band anywhere the content does not reach.
		<ScrollView modifiers={[frame({maxWidth: FILL_WIDTH, maxHeight: FILL_WIDTH})]}>
			<VStack
				alignment="leading"
				spacing={12}
				modifiers={[
					padding({horizontal: SHEET_PADDING, top: SHEET_TOP_PADDING, bottom: 32}),
					accessibilityIdentifier('dictionary-definition-sheet'),
				]}
			>
				<VStack
					alignment="leading"
					modifiers={[padding({leading: TEXT_INDENT, top: HEADING_TOP_SPACE})]}
					spacing={HEADING_SPACING}
				>
					{/* Headword and phonetics share a line, sitting on a common
					    baseline so the smaller phonetics do not ride high. */}
					<HStack alignment="firstTextBaseline" spacing={6}>
						{/* `textStyle` rather than a fixed `size`, so the headword still
						    scales with Dynamic Type -- a bare `size` does not. */}
						<Text
							modifiers={[
								// Size and style together: the size is the measurement, the
								// style is the curve it scales along with Dynamic Type.
								font({size: HEADWORD_SIZE, design: 'serif', weight: 'bold'}),
								textSelection(true),
							]}
						>
							{entry.word}
						</Text>

						{entry.pronunciation ? (
							<Text
								modifiers={[
									font({size: PRONUNCIATION_SIZE, design: 'serif'}),
									foregroundStyle(c.secondaryLabel),
									textSelection(true),
								]}
							>
								{`| ${entry.pronunciation} |`}
							</Text>
						) : null}
					</HStack>

					{/* The one line set in the system face: it is a label about the
					    entry rather than part of the entry's own text. */}
					{entry.partOfSpeech ? (
						<Text modifiers={[font({size: PART_OF_SPEECH_SIZE})]}>{entry.partOfSpeech}</Text>
					) : null}
				</VStack>

				{/* One block, so consecutive senses read on with the same leading
				    as the lines inside them rather than a paragraph gap. */}
				<VStack alignment="leading" spacing={0}>
					{entry.senses.map((sense, index) => (
						<SenseRow indent={SENSE_INDENT} key={index} marker={String(index + 1)} sense={sense} />
					))}
				</VStack>

				<Text
					modifiers={[
						font({textStyle: 'footnote'}),
						foregroundStyle(c.tertiaryLabel),
						padding({leading: TEXT_INDENT}),
					]}
				>
					Collected by the humans of All About Olaf
				</Text>
			</VStack>
		</ScrollView>
	)
}
