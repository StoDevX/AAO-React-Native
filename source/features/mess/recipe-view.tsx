import * as React from 'react'
import {Button, HStack, Image, Spacer, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityIdentifier,
	accessibilityLabel,
	buttonStyle,
	contentShape,
	font,
	foregroundStyle,
	frame,
	shapes,
	tint,
} from '@expo/ui/swift-ui/modifiers'
import {useKeepAwake} from 'expo-keep-awake'
import {TAP_TARGET} from './lib/glyph-grid'
import {runsToMarkdown} from './lib/markdown'
import {faded, ink, messRed} from './palette'
import {SECTION_HEADING, StoryBlocks} from './story-blocks'
import type {MessStory, Run, StoryLayout} from './types'

/** Names each ingredient row, for a UI test. */
export const RECIPE_INGREDIENT_ID = 'mess-recipe-ingredient'
/** Names each step row, for a UI test. */
export const RECIPE_STEP_ID = 'mess-recipe-step'

/** The whole row takes a tap, blank space and all, and is never shorter than a comfortable target. */
const ROW = [frame({minHeight: TAP_TARGET}), contentShape(shapes.rectangle())]
const ITEM = [font({textStyle: 'body', design: 'serif'}), foregroundStyle(ink), tint(messRed)]
/** A ticked item's text, faded back so what is left to do stands out. */
const TICKED_ITEM = [
	font({textStyle: 'body', design: 'serif'}),
	foregroundStyle(faded),
	tint(messRed),
]
const CIRCLE = [font({textStyle: 'title3'}), foregroundStyle(faded)]
const TICKED_CIRCLE = [font({textStyle: 'title3'}), foregroundStyle(messRed)]
/** A step's number, set large; the frame keeps each step's text in line whatever its number's width. */
const NUMBER = [
	font({textStyle: 'title2', design: 'serif', weight: 'bold'}),
	foregroundStyle(messRed),
	frame({minWidth: 32, alignment: 'leading'}),
]
const TICKED_NUMBER = [
	font({textStyle: 'title2', weight: 'bold'}),
	foregroundStyle(messRed),
	frame({minWidth: 32, alignment: 'leading'}),
]

type RowProps = {
	runs: Run[]
	/** A step's number, counted from one in its section; null for an ingredient */
	number: number | null
	ticked: boolean
	onToggle: () => void
}

/** One ingredient or step, which the cook taps to tick off and taps again to untick. */
function RecipeRow({runs, number, ticked, onToggle}: RowProps): React.ReactNode {
	let text = runs.map((run) => run.text).join('')
	let mark: React.ReactNode
	if (number === null) {
		mark = (
			<Image
				modifiers={ticked ? TICKED_CIRCLE : CIRCLE}
				systemName={ticked ? 'checkmark.circle.fill' : 'circle'}
			/>
		)
	} else {
		mark = ticked ? (
			<Image modifiers={TICKED_NUMBER} systemName="checkmark" />
		) : (
			<Text modifiers={NUMBER}>{String(number)}</Text>
		)
	}

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				// A step's number is drawn apart from its text, so VoiceOver is told it here.
				accessibilityLabel(number === null ? text : `Step ${number}, ${text}`),
				accessibilityIdentifier(number === null ? RECIPE_INGREDIENT_ID : RECIPE_STEP_ID),
				...(ticked ? [accessibilityAddTraits(['isSelected'])] : []),
			]}
			onPress={onToggle}
		>
			{/* contentShape belongs on the label, not the Button: SwiftUI takes a button's
			    tappable region from its label, so this makes the whole row take the tap. */}
			<HStack alignment="firstTextBaseline" modifiers={ROW} spacing={12}>
				{mark}
				<Text markdownEnabled={true} modifiers={ticked ? TICKED_ITEM : ITEM}>
					{runsToMarkdown(runs)}
				</Text>
				<Spacer />
			</HStack>
		</Button>
	)
}

type Props = {
	story: MessStory
	layout: Extract<StoryLayout, {kind: 'recipe'}>
	columnWidth: number
}

/**
 * A recipe: its introduction, then each section of ingredients or steps as rows a cook
 * ticks off, then whatever follows. The ticks last only while the page is open, and the
 * screen stays awake meanwhile, since a cook's hands are busy. Returned side by side, to
 * land in the page's column.
 */
export function RecipeView({story, layout, columnWidth}: Props): React.ReactNode {
	// Released when the page goes, so only an open recipe holds the screen awake.
	useKeepAwake()
	// Each row by its section and its place there, so rows in the same place in two sections differ.
	let [ticked, setTicked] = React.useState<ReadonlySet<string>>(() => new Set())
	let toggle = (key: string) =>
		setTicked((previous) => {
			let next = new Set(previous)
			if (!next.delete(key)) next.add(key)
			return next
		})

	return (
		<>
			<StoryBlocks blocks={layout.intro} columnWidth={columnWidth} story={story} />
			{layout.sections.map((section, sectionIndex) => (
				// oxlint-disable-next-line react/no-array-index-key -- a recipe is fixed, so its order is its identity
				<VStack alignment="leading" key={sectionIndex} spacing={0}>
					<Text modifiers={SECTION_HEADING}>{section.label}</Text>
					{section.items.map((runs, itemIndex) => {
						let key = `${sectionIndex}:${itemIndex}`
						return (
							<RecipeRow
								key={key}
								number={section.kind === 'steps' ? itemIndex + 1 : null}
								onToggle={() => toggle(key)}
								runs={runs}
								ticked={ticked.has(key)}
							/>
						)
					})}
				</VStack>
			))}
			<StoryBlocks blocks={layout.after} columnWidth={columnWidth} opens={false} story={story} />
		</>
	)
}
