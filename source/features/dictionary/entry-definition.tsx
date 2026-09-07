import * as React from 'react'
import {Button, HStack, Image, ScrollView, Spacer, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	bold,
	buttonStyle,
	font,
	foregroundStyle,
	italic,
	lineSpacing,
	padding,
	textSelection,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import type {NormalizedEntry} from './types'

/// Matches the glyph Apple's sheets close with, and the size building-info uses.
const CLOSE_GLYPH_SIZE = 26
/// Apple's dictionary sets its body with noticeably open leading.
const BODY_LINE_SPACING = 4
const CONTENT_PADDING = 20

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
	let numbered = entry.senses.length > 1

	return (
		<ScrollView>
			<VStack alignment="leading" spacing={12} modifiers={[padding({all: CONTENT_PADDING})]}>
				<HStack alignment="center">
					<Text modifiers={[font({textStyle: 'headline'})]}>Dictionary</Text>
					<Spacer />
					<Button modifiers={[accessibilityLabel('Close'), buttonStyle('plain')]} onPress={onClose}>
						<Image
							modifiers={[foregroundStyle({type: 'hierarchical', style: 'secondary'})]}
							size={CLOSE_GLYPH_SIZE}
							systemName="xmark.circle.fill"
						/>
					</Button>
				</HStack>

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
							font({textStyle: 'body', design: 'serif'}),
							foregroundStyle(c.secondaryLabel),
						]}
					>
						{`| ${entry.pronunciation} |`}
					</Text>
				) : null}

				{entry.partOfSpeech ? (
					<Text modifiers={[font({textStyle: 'subheadline', design: 'serif'})]}>
						{entry.partOfSpeech}
					</Text>
				) : null}

				{entry.senses.map((sense, index) => (
					<HStack alignment="top" key={index} spacing={8}>
						{numbered ? (
							<Text modifiers={[font({textStyle: 'body', design: 'serif'}), bold()]}>
								{String(index + 1)}
							</Text>
						) : null}
						<VStack alignment="leading" spacing={6}>
							<Text
								modifiers={[
									font({textStyle: 'body', design: 'serif'}),
									lineSpacing(BODY_LINE_SPACING),
									textSelection(true),
								]}
							>
								{sense.definition}
							</Text>
							{sense.example ? (
								<Text
									modifiers={[
										font({textStyle: 'body', design: 'serif'}),
										italic(),
										foregroundStyle(c.secondaryLabel),
									]}
								>
									{sense.example}
								</Text>
							) : null}
						</VStack>
					</HStack>
				))}

				<Button label="Suggest an Edit" onPress={onEdit} />

				<Text modifiers={[font({textStyle: 'footnote'}), foregroundStyle(c.tertiaryLabel)]}>
					Collected by the humans of All About Olaf
				</Text>
			</VStack>
		</ScrollView>
	)
}
