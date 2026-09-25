import * as React from 'react'
import {Button, Divider, Grid, HStack, Spacer, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityHidden,
	accessibilityLabel,
	background,
	buttonStyle,
	contentShape,
	font,
	foregroundStyle,
	frame,
	id,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import {RowAccessory} from '../../components/rows'
import {SIGN_DATES, SIGN_GLYPHS, SIGN_NAMES, SPOKEN_DATES} from './lib/horoscopes'
import {ZODIAC_SIGNS} from './lib/zodiac'
import {faded, ink, messRed, paper} from './palette'
import {useMessStore} from './store'
import {Paragraph} from './story-blocks'
import type {StoryLayout, ZodiacSign} from './types'

/** Apple's smallest comfortable tap target, in points. */
const TAP_TARGET = 44

const PROMPT = [font({textStyle: 'headline', design: 'serif'}), foregroundStyle(ink)]
const GLYPH_CELL = [
	font({textStyle: 'title2', design: 'serif'}),
	frame({minWidth: TAP_TARGET, minHeight: TAP_TARGET}),
	contentShape(shapes.rectangle()),
]
const GLYPH = [...GLYPH_CELL, foregroundStyle(ink)]
/** The chosen sign's glyph, filled Mess red. The frame comes first so the fill covers all of it. */
const CHOSEN_GLYPH = [...GLYPH_CELL, foregroundStyle(paper), background(messRed, shapes.circle())]
const LARGE_GLYPH = [
	font({size: 56, design: 'serif'}),
	foregroundStyle(messRed),
	// The name beneath says the same thing in words.
	accessibilityHidden(true),
]
const NAME = [font({textStyle: 'title3', design: 'serif', weight: 'bold'}), foregroundStyle(ink)]
const DATES = [font({textStyle: 'caption'}), foregroundStyle(faded)]
const ROW = [frame({minHeight: TAP_TARGET}), contentShape(shapes.rectangle())]
const ROW_GLYPH = [
	font({textStyle: 'title3', design: 'serif'}),
	foregroundStyle(ink),
	frame({width: 28}),
]
const ROW_NAME = [font({textStyle: 'body', design: 'serif'}), foregroundStyle(ink)]

/** The zodiac as two rows of six, for the grid of glyphs. */
const GRID_ROWS = [ZODIAC_SIGNS.slice(0, 6), ZODIAC_SIGNS.slice(6)]

type HoroscopesLayout = Extract<StoryLayout, {kind: 'horoscopes'}>

type Props = {
	layout: HoroscopesLayout
	/** Scrolls the page to the view carrying this id. */
	scrollTo: (target: string) => void
}

/**
 * A Horoscopes post, opened on the reader's own sign: the last one they read.
 * Until they have picked one, it lists all twelve to pick from.
 *
 * The parts are returned side by side, not in a stack, so each lands directly in
 * the page's scroll-target layout, where the chosen sign's `id` can be scrolled to.
 */
export function HoroscopesView({layout, scrollTo}: Props): React.ReactNode {
	let lastSign = useMessStore((state) => state.lastSign)
	let setSign = useMessStore((state) => state.setSign)
	// A sign the reader has just picked. Its section only carries the sign's id once it
	// has been drawn, so the scroll waits for the render that follows the pick.
	let pendingScroll = React.useRef<ZodiacSign | null>(null)

	React.useEffect(() => {
		if (pendingScroll.current === null) return
		scrollTo(pendingScroll.current)
		pendingScroll.current = null
	}, [lastSign, scrollTo])

	let choose = (sign: ZodiacSign) => {
		if (sign === lastSign) return
		pendingScroll.current = sign
		setSign(sign)
	}

	let intro = layout.intro.map((runs, index) => (
		// oxlint-disable-next-line react/no-array-index-key -- the intro is fixed, so its order is its identity
		<Paragraph key={`intro-${index}`} runs={runs} />
	))
	let chosen = layout.signs.find((entry) => entry.sign === lastSign)

	if (!chosen) {
		return (
			<>
				{intro}
				<Text modifiers={PROMPT}>Pick your sign</Text>
				<SignRows onChoose={choose} signs={ZODIAC_SIGNS} />
			</>
		)
	}

	return (
		<>
			{intro}
			<VStack alignment="leading" modifiers={[id(chosen.sign)]} spacing={10}>
				<GlyphGrid chosen={chosen.sign} onChoose={choose} />
				<Text modifiers={LARGE_GLYPH}>{SIGN_GLYPHS[chosen.sign]}</Text>
				<VStack alignment="leading" spacing={2}>
					<Text modifiers={NAME}>{SIGN_NAMES[chosen.sign]}</Text>
					<Text modifiers={[...DATES, accessibilityLabel(SPOKEN_DATES[chosen.sign])]}>
						{SIGN_DATES[chosen.sign]}
					</Text>
				</VStack>
				{chosen.reading.map((runs, index) => (
					// oxlint-disable-next-line react/no-array-index-key -- a reading is fixed, so its order is its identity
					<Paragraph key={index} runs={runs} />
				))}
			</VStack>
			<VStack spacing={2}>
				<Divider />
				<Divider />
			</VStack>
			<SignRows onChoose={choose} signs={ZODIAC_SIGNS.filter((sign) => sign !== chosen.sign)} />
		</>
	)
}

type GlyphGridProps = {
	chosen: ZodiacSign
	onChoose: (sign: ZodiacSign) => void
}

/** The twelve glyphs as buttons, six to a row, with the chosen one filled. */
function GlyphGrid({chosen, onChoose}: GlyphGridProps): React.ReactNode {
	return (
		<Grid horizontalSpacing={4} verticalSpacing={4}>
			{GRID_ROWS.map((row) => (
				<Grid.Row key={row[0]}>
					{row.map((sign) => {
						let isChosen = sign === chosen
						return (
							<Button
								key={sign}
								modifiers={[
									buttonStyle('plain'),
									accessibilityLabel(SIGN_NAMES[sign]),
									...(isChosen ? [accessibilityAddTraits(['isSelected'])] : []),
								]}
								onPress={() => onChoose(sign)}
							>
								<Text modifiers={isChosen ? CHOSEN_GLYPH : GLYPH}>{SIGN_GLYPHS[sign]}</Text>
							</Button>
						)
					})}
				</Grid.Row>
			))}
		</Grid>
	)
}

type SignRowsProps = {
	signs: readonly ZodiacSign[]
	onChoose: (sign: ZodiacSign) => void
}

/** A row for each sign: glyph, name and dates. */
function SignRows({signs, onChoose}: SignRowsProps): React.ReactNode {
	return (
		<VStack alignment="leading" spacing={0}>
			{signs.map((sign) => (
				<Button
					key={sign}
					modifiers={[
						buttonStyle('plain'),
						accessibilityLabel(`${SIGN_NAMES[sign]}, ${SPOKEN_DATES[sign]}`),
					]}
					onPress={() => onChoose(sign)}
				>
					<HStack modifiers={ROW} spacing={12}>
						<Text modifiers={ROW_GLYPH}>{SIGN_GLYPHS[sign]}</Text>
						<Text modifiers={ROW_NAME}>{SIGN_NAMES[sign]}</Text>
						<Spacer />
						<Text modifiers={DATES}>{SIGN_DATES[sign]}</Text>
						<RowAccessory destination="push" />
					</HStack>
				</Button>
			))}
		</VStack>
	)
}
