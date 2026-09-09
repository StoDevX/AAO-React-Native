import * as React from 'react'
import {HStack, ScrollView, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	background,
	bold,
	font,
	foregroundStyle,
	frame,
	italic,
	lineSpacing,
	padding,
	strikethrough,
	textSelection,
	underline,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import {FILL_WIDTH} from '../home/button'

import type {DiffedEntry, DiffedSense, DiffStatus, Run} from './lib/diff'
import {
	BODY_LINE_SPACING,
	EXAMPLE_SEPARATOR,
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

/**
 * `@expo/ui` does not re-export `ModifierConfig` from its public entry, and its
 * deeper path is not in the package's `exports`, so the type is derived from a
 * modifier that is public.
 */
type Modifier = ReturnType<typeof foregroundStyle>

/**
 * One marked run, styled the way the preview marks an insertion or a
 * deletion: green and underlined for an addition, red and struck through for
 * a deletion, plain for a run the reader left untouched.
 *
 * Only six modifiers survive SwiftUI's `Text` concatenation --
 * `foregroundStyle`, `bold`, `italic`, `monospacedDigit`, `font`, plus the
 * `strikethrough`/`underline` this package patches in -- so a run's own mark
 * can only ever be colour and decoration, never a background.
 */
function MarkedRun({run}: {run: Run}): React.ReactNode {
	if (run.mark === 'added') {
		return (
			<Text
				modifiers={[foregroundStyle(c.systemGreen), underline({isActive: true, pattern: 'solid'})]}
			>
				{run.text}
			</Text>
		)
	}

	if (run.mark === 'removed') {
		return (
			<Text
				modifiers={[
					foregroundStyle(c.systemRed),
					strikethrough({isActive: true, pattern: 'solid'}),
				]}
			>
				{run.text}
			</Text>
		)
	}

	return <Text>{run.text}</Text>
}

/** A field's runs, laid end to end as a sequence of `MarkedRun`s. */
function Marked({runs}: {runs: Run[]}): React.ReactNode {
	return (
		<>
			{runs.map((run, index) => (
				<MarkedRun key={index} run={run} />
			))}
		</>
	)
}

/**
 * The wash behind a whole sense a suggestion adds or removes -- at the row,
 * not the run, because `background` returns a View and only a `Text`-returning
 * modifier survives inline concatenation. A sense that merely changed carries
 * no wash: its word-level marks already say what happened.
 */
function washFor(status: DiffStatus): Modifier[] {
	if (status === 'added') {
		return [background(c.diffAdditionFill)]
	}
	if (status === 'removed') {
		return [background(c.diffDeletionFill)]
	}
	return []
}

/**
 * Mirrors `withoutFullStop` in `EntryDefinition`: dropped only when the
 * trailing run is untouched, since trimming a period out of an added or
 * removed run would misstate what that run's mark is reporting.
 */
function withoutTrailingFullStop(runs: Run[]): Run[] {
	let last = runs[runs.length - 1]
	if (!last || last.mark !== 'same' || !last.text.endsWith('.')) {
		return runs
	}
	return [...runs.slice(0, -1), {...last, text: last.text.slice(0, -1)}]
}

/// A sense and everything under it, marked up the way `SenseRow` draws one
/// plainly -- same gutter, same run-on paragraph, marked runs standing in for
/// plain strings. `marker` is supplied by the caller, exactly as in
/// `SenseRow`: the top level reads its own position number, a sub-sense reads
/// `SUBSENSE_MARKER`, and either goes blank when `sense.number` is absent,
/// which happens only for a sense the reader's edit removed.
function DiffSenseRow({
	sense,
	marker,
	indent,
}: {
	sense: DiffedSense
	marker: string
	indent: number
}): React.ReactNode {
	let hasCitations = sense.examples.length > 0
	let definition = hasCitations ? withoutTrailingFullStop(sense.definition) : sense.definition

	return (
		<>
			<HStack
				alignment="firstTextBaseline"
				modifiers={[padding({leading: indent}), ...washFor(sense.status)]}
				spacing={0}
			>
				<Text
					modifiers={[
						font({textStyle: 'body', design: 'serif'}),
						bold(),
						frame({width: SENSE_NUMBER_WIDTH, alignment: 'leading'}),
					]}
				>
					{marker}
				</Text>
				{/* Grammar, definition and citations are one paragraph, same as
				    `SenseRow` -- a dictionary runs them together rather than
				    breaking a line between them. */}
				<Text
					modifiers={[
						font({textStyle: 'body', design: 'serif'}),
						lineSpacing(BODY_LINE_SPACING),
						textSelection(true),
					]}
				>
					{sense.grammar.length > 0 ? (
						<Text modifiers={[italic()]}>
							[
							<Marked runs={sense.grammar} />
							{'] '}
						</Text>
					) : null}
					<Marked runs={definition} />
					{hasCitations ? (
						<Text modifiers={[italic(), foregroundStyle(c.secondaryLabel)]}>
							{': '}
							{sense.examples.map((example, index) => (
								<React.Fragment key={index}>
									{index > 0 ? EXAMPLE_SEPARATOR : null}
									<Marked runs={example.runs} />
								</React.Fragment>
							))}
						</Text>
					) : null}
				</Text>
			</HStack>

			{sense.movedFrom !== undefined ? (
				<Text
					modifiers={[
						font({textStyle: 'footnote'}),
						foregroundStyle(c.secondaryLabel),
						padding({leading: indent + SENSE_NUMBER_WIDTH}),
					]}
				>
					{`moved from ${sense.movedFrom}`}
				</Text>
			) : null}

			{sense.subsenses.map((subsense, index) => (
				<DiffSenseRow
					indent={indent + SENSE_NUMBER_WIDTH}
					key={index}
					marker={subsense.number === undefined ? '' : SUBSENSE_MARKER}
					sense={subsense}
				/>
			))}
		</>
	)
}

type Props = {
	diff: DiffedEntry
}

/**
 * A suggested edit, set the way `EntryDefinition` sets the entry itself, with
 * every changed word marked and every added or removed sense washed.
 *
 * Presentational -- the route that hosts it owns the title and the toolbar.
 */
export function EntryDiff({diff}: Props): React.ReactNode {
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
					accessibilityIdentifier('dictionary-preview-sheet'),
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
						<Text
							modifiers={[
								font({size: HEADWORD_SIZE, design: 'serif', weight: 'bold'}),
								textSelection(true),
							]}
						>
							<Marked runs={diff.word} />
						</Text>

						{diff.pronunciation.length > 0 ? (
							<Text
								modifiers={[
									font({size: PRONUNCIATION_SIZE, design: 'serif'}),
									foregroundStyle(c.secondaryLabel),
									textSelection(true),
								]}
							>
								{'| '}
								<Marked runs={diff.pronunciation} />
								{' |'}
							</Text>
						) : null}
					</HStack>

					{diff.partOfSpeech.length > 0 ? (
						<Text modifiers={[font({size: PART_OF_SPEECH_SIZE})]}>
							<Marked runs={diff.partOfSpeech} />
						</Text>
					) : null}
				</VStack>

				{/* One block, so consecutive senses read on with the same leading
				    as the lines inside them rather than a paragraph gap. */}
				<VStack alignment="leading" spacing={0}>
					{diff.senses.map((sense, index) => (
						<DiffSenseRow
							indent={SENSE_INDENT}
							key={index}
							marker={sense.number === undefined ? '' : String(sense.number)}
							sense={sense}
						/>
					))}
				</VStack>
			</VStack>
		</ScrollView>
	)
}
