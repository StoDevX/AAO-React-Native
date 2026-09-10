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
 * One `<Text>` per run, styled the way the preview marks an insertion or a
 * deletion: green and underlined for an addition, red and struck through for
 * a deletion, plain for a run the reader left untouched.
 *
 * A plain function, not a component. SwiftUI's `Text` concatenation walks its
 * children and keeps only a string/number or an element whose type is
 * literally `Text` -- everything else, a custom component or a `Fragment`
 * included, is dropped with no warning. A `<MarkedRuns runs={…}/>` between
 * this and its parent `<Text>` would therefore render nothing on device; an
 * array of real `<Text>` elements, spread straight into the parent's
 * children, is the one shape that survives. `expo-ui-mock`'s `Text` enforces
 * the same filter under Jest, so getting this wrong now fails a test instead
 * of shipping a blank sentence.
 *
 * `keyPrefix` distinguishes one call's keys from another's when several
 * calls' results are concatenated into one array -- the citations below join
 * one `markedRuns` call per example, and each starts counting from zero on
 * its own.
 */
function markedRuns(runs: Run[], keyPrefix = ''): React.ReactNode[] {
	return runs.map((run, index) => {
		let key = `${keyPrefix}${index}`

		if (run.mark === 'added') {
			return (
				<Text
					key={key}
					modifiers={[
						foregroundStyle(c.systemGreen),
						underline({isActive: true, pattern: 'solid'}),
					]}
				>
					{run.text}
				</Text>
			)
		}

		if (run.mark === 'removed') {
			return (
				<Text
					key={key}
					modifiers={[
						foregroundStyle(c.systemRed),
						strikethrough({isActive: true, pattern: 'solid'}),
					]}
				>
					{run.text}
				</Text>
			)
		}

		return <Text key={key}>{run.text}</Text>
	})
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

/// The pre-edit text a run array stood for, reconstructed from every run
/// that was already there before the edit -- `same` and `removed` runs, in
/// order, skipping only what the edit itself inserted.
function beforeText(runs: Run[]): string {
	return runs
		.filter((run) => run.mark !== 'added')
		.map((run) => run.text)
		.join('')
}

/**
 * Mirrors `withoutFullStop` in `EntryDefinition`, widened for marked runs: a
 * definition's own last word is exactly what an edit is most likely to touch,
 * which puts its trailing full stop inside a marked run more often than not.
 *
 * Trimmed only when the full stop survived the edit unremarked -- the last
 * run ends in `.` *and* the pre-edit text already ended in `.` too, so the
 * character carries no information about what changed. `"modify"` →
 * `"modify."` fails that second test and keeps its full stop, since there the
 * period *is* the edit. `"modify."` → `"change."` passes it: the removed run
 * keeps its own trailing `.` (it is exactly what was struck through), and
 * only the last run's redundant one -- the one that would otherwise collide
 * with the colon ahead of a citation -- is dropped.
 */
export function withoutTrailingFullStop(runs: Run[]): Run[] {
	let last = runs[runs.length - 1]
	if (!last || !last.text.endsWith('.') || !beforeText(runs).endsWith('.')) {
		return runs
	}
	return [...runs.slice(0, -1), {...last, text: last.text.slice(0, -1)}]
}

/// A sense and everything under it, marked up the way `SenseRow` draws one
/// plainly -- same gutter, same run-on paragraph, marked runs standing in for
/// plain strings. `marker` is supplied by the caller, exactly as in
/// `SenseRow`: the top level reads its own position number, a sub-sense
/// always reads `SUBSENSE_MARKER` -- a bullet carries no position, so unlike
/// a number it cannot collide, and a removed sub-sense keeps it. The top
/// level's own marker goes blank only there, when `sense.number` is absent --
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

	/// A citation whose own text held still but whose position did not gets a
	/// caption of its own, the same as a sense that moved -- otherwise a
	/// reorder with no other edit would preview as no edit at all. Named
	/// distinctly from the sense's own caption so the two are never read as
	/// the same move.
	let movedCitations = sense.examples.filter((example) => example.movedFrom !== undefined)

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
							[{markedRuns(sense.grammar)}
							{'] '}
						</Text>
					) : null}
					{markedRuns(definition)}
					{hasCitations ? (
						<Text modifiers={[italic(), foregroundStyle(c.secondaryLabel)]}>
							{': '}
							{sense.examples.flatMap((example, index) => [
								index > 0 ? EXAMPLE_SEPARATOR : null,
								...markedRuns(example.runs, `${index}-`),
							])}
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

			{movedCitations.map((example, index) => (
				<Text
					key={index}
					modifiers={[
						font({textStyle: 'footnote'}),
						foregroundStyle(c.secondaryLabel),
						padding({leading: indent + SENSE_NUMBER_WIDTH}),
					]}
				>
					{`citation moved from ${example.movedFrom}`}
				</Text>
			))}

			{sense.subsenses.map((subsense, index) => (
				<DiffSenseRow
					indent={indent + SENSE_NUMBER_WIDTH}
					key={index}
					marker={SUBSENSE_MARKER}
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
								// Size and style together: the size is the measurement, the
								// style is the curve it scales along with Dynamic Type.
								font({size: HEADWORD_SIZE, design: 'serif', weight: 'bold'}),
								textSelection(true),
							]}
						>
							{markedRuns(diff.word)}
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
								{markedRuns(diff.pronunciation)}
								{' |'}
							</Text>
						) : null}
					</HStack>

					{diff.partOfSpeech.length > 0 ? (
						<Text modifiers={[font({size: PART_OF_SPEECH_SIZE})]}>
							{markedRuns(diff.partOfSpeech)}
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
