import * as React from 'react'
import {Button, HStack, Image, Menu, ScrollView, Spacer, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	background,
	bold,
	buttonStyle,
	font,
	foregroundStyle,
	frame,
	italic,
	lineSpacing,
	menuIndicator,
	padding,
	shapes,
	textSelection,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import {FILL_WIDTH} from '../home/button'

import type {NormalizedEntry} from './types'

/// The xmark glyph, and the disc it sits on. The ellipsis rides the same disc
/// so the two ends of the title row balance.
const CLOSE_GLYPH_SIZE = 13
const MENU_GLYPH_SIZE = 15
const CLOSE_GLYPH_DIAMETER = 30
/// Apple's dictionary sets its body with noticeably open leading.
const BODY_LINE_SPACING = 4
const CONTENT_PADDING = 20
/// The headword, its phonetics and its part of speech read as one block, so
/// they sit closer together than the gaps between blocks.
const HEADING_SPACING = 4
/// Apple hangs the sense number in the margin and indents the sense body past
/// it, so wrapped lines align with the first rather than with the number.
const SENSE_NUMBER_WIDTH = 18
const SENSE_GUTTER = 8

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
	onEdit: () => void
	onClose: () => void
}

/**
 * One dictionary entry, set the way the iOS Look Up popup sets one: a serif
 * headword, bracketed phonetics, and numbered senses with italic examples.
 *
 * Presentational — the sheet that presents it belongs to the list screen.
 */
export function EntryDefinition({entry, onEdit, onClose}: Props): React.ReactNode {
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
					padding({all: CONTENT_PADDING}),
					accessibilityIdentifier('dictionary-definition-sheet'),
				]}
			>
				{/* Actions at one end, Close at the other, both on discs of the
				    same size -- so the title sits centred on the sheet rather than
				    on whatever space the buttons leave over. */}
				<HStack alignment="center">
					{/* The sheet's actions live behind one glyph, the way a system
					    sheet keeps everything but Close out of the title row. */}
					<Menu
						label={
							<Image
								modifiers={[
									font({size: MENU_GLYPH_SIZE, weight: 'bold'}),
									foregroundStyle(c.secondaryLabel),
									frame({width: CLOSE_GLYPH_DIAMETER, height: CLOSE_GLYPH_DIAMETER}),
									background(c.quaternarySystemFill, shapes.circle()),
								]}
								systemName="ellipsis"
							/>
						}
						modifiers={[accessibilityLabel('More actions'), menuIndicator('hidden')]}
					>
						<Button label="Suggest an Edit" onPress={onEdit} systemImage="pencil" />
					</Menu>
					<Spacer />
					<Text modifiers={[font({textStyle: 'headline'})]}>Dictionary</Text>
					<Spacer />
					{/* A dark glyph on a light disc, which is how the system draws a
					    sheet's close button -- rather than `xmark.circle.fill`,
					    whose disc is the tinted part and reads inverted here. */}
					<Button modifiers={[accessibilityLabel('Close'), buttonStyle('plain')]} onPress={onClose}>
						<Image
							modifiers={[
								font({size: CLOSE_GLYPH_SIZE, weight: 'bold'}),
								foregroundStyle(c.secondaryLabel),
								frame({width: CLOSE_GLYPH_DIAMETER, height: CLOSE_GLYPH_DIAMETER}),
								background(c.quaternarySystemFill, shapes.circle()),
							]}
							systemName="xmark"
						/>
					</Button>
				</HStack>

				<VStack alignment="leading" spacing={HEADING_SPACING}>
					{/* Headword and phonetics share a line, sitting on a common
					    baseline so the smaller phonetics do not ride high. */}
					<HStack alignment="firstTextBaseline" spacing={SENSE_GUTTER}>
						{/* `textStyle` rather than a fixed `size`, so the headword still
						    scales with Dynamic Type -- a bare `size` does not. */}
						<Text
							modifiers={[
								font({textStyle: 'largeTitle', design: 'serif', weight: 'bold'}),
								textSelection(true),
							]}
						>
							{entry.word}
						</Text>

						{entry.pronunciation ? (
							<Text
								modifiers={[
									font({textStyle: 'title3', design: 'serif'}),
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
						<Text modifiers={[font({textStyle: 'body'})]}>{entry.partOfSpeech}</Text>
					) : null}
				</VStack>

				{entry.senses.map((sense, index) => (
					<HStack alignment="firstTextBaseline" key={index} spacing={SENSE_GUTTER}>
						{/* Numbered even when there is only one, so a single-sense entry
						    still reads as a dictionary entry rather than a paragraph. */}
						<Text
							modifiers={[
								font({textStyle: 'body', design: 'serif'}),
								bold(),
								frame({width: SENSE_NUMBER_WIDTH, alignment: 'leading'}),
							]}
						>
							{String(index + 1)}
						</Text>
						{/* The example runs on from its definition after a colon, set
						    in italic, the way a dictionary sets a citation -- rather
						    than breaking to its own line. */}
						<Text
							modifiers={[
								font({textStyle: 'body', design: 'serif'}),
								lineSpacing(BODY_LINE_SPACING),
								textSelection(true),
							]}
						>
							<Text>{sense.example ? withoutFullStop(sense.definition) : sense.definition}</Text>
							{sense.example ? (
								<Text modifiers={[italic(), foregroundStyle(c.secondaryLabel)]}>
									{`: ${sense.example}`}
								</Text>
							) : null}
						</Text>
					</HStack>
				))}

				<Text modifiers={[font({textStyle: 'footnote'}), foregroundStyle(c.tertiaryLabel)]}>
					Collected by the humans of All About Olaf
				</Text>
			</VStack>
		</ScrollView>
	)
}
