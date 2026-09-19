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

import {FILL_WIDTH} from '../../components/tile-layout'

import {pronunciationText, senseText} from './lib/entry-text'
import {
	BODY_LINE_SPACING,
	HEADING_SPACING,
	HEADING_TOP_SPACE,
	HEADWORD_SIZE,
	PART_OF_SPEECH_SIZE,
	PRONUNCIATION_SIZE,
	SENSE_INDENT,
	SENSE_NUMBER_WIDTH,
	SHEET_PADDING,
	SHEET_TOP_PADDING,
	SUBSENSE_MARKER,
	TEXT_INDENT,
} from './lib/metrics'
import type {NormalizedEntry, Sense} from './types'

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
	let text = senseText(sense)

	return (
		<>
			<HStack alignment="firstTextBaseline" modifiers={[padding({leading: indent})]} spacing={0}>
				{marker ? (
					<Text
						modifiers={[
							font({textStyle: 'body', design: 'serif'}),
							bold(),
							frame({width: SENSE_NUMBER_WIDTH, alignment: 'leading'}),
						]}
					>
						{marker}
					</Text>
				) : null}
				{/* Grammar, definition and citations are one paragraph: a dictionary
				    runs them together rather than breaking a line between them. */}
				<Text
					modifiers={[
						font({textStyle: 'body', design: 'serif'}),
						lineSpacing(BODY_LINE_SPACING),
						textSelection(true),
					]}
				>
					{text.grammar ? <Text modifiers={[italic()]}>{text.grammar}</Text> : null}
					<Text>{text.definition}</Text>
					{text.citations ? (
						<Text modifiers={[italic(), foregroundStyle(c.secondaryLabel)]}>{text.citations}</Text>
					) : null}
				</Text>
			</HStack>

			{sense.subsenses?.map((subsense) => (
				<SenseRow
					indent={indent + SENSE_NUMBER_WIDTH}
					key={subsense.definition}
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
	let pronunciation = pronunciationText(entry.pronunciation)
	let hasSeveralSenses = entry.senses.length > 1

	return (
		// FILL_WIDTH is the usual SwiftUI trick for a view with no "fill the
		// available space" constant of its own: the route's Host wraps this in
		// `flex: 1`, and this frame is what lets the ScrollView actually grow
		// into that space rather than shrinking to its content.
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

						{pronunciation ? (
							<Text
								modifiers={[
									font({size: PRONUNCIATION_SIZE, design: 'serif'}),
									foregroundStyle(c.secondaryLabel),
									textSelection(true),
								]}
							>
								{pronunciation}
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
					{/* A lone sense has no number to hang in a gutter, so it sits
					    flush with the headword instead of stepping in past it. */}
					{entry.senses.map((sense, index) => (
						<SenseRow
							indent={hasSeveralSenses ? SENSE_INDENT : TEXT_INDENT}
							key={sense.definition}
							marker={hasSeveralSenses ? String(index + 1) : ''}
							sense={sense}
						/>
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
