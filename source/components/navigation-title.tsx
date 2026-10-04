import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Stack} from 'expo-router'
import {Host, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityElement,
	accessibilityIdentifier,
	accessibilityLabel,
	font,
	foregroundStyle,
	lineLimit,
	minimumScaleFactor,
} from '@expo/ui/swift-ui/modifiers'
import type {ModifierConfig} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

/** Names a two-line title, for a test. Mirrored by `TestIdentifiers.Navigation.title`. */
export const NAVIGATION_TITLE_ID = 'navigation-title'

// A navigation title reads as the screen's name, not as a link, so the name
// keeps the label colour a plain title would have.
//
// One line, and it shrinks a little rather than wrapping: a navigation bar
// keeps its height whatever it is asked to hold, so a name that wraps pushes
// the line beneath it out of the bar entirely. It stops shrinking well short of
// the subtitle's floor -- a name is the one thing on the screen a reader has to
// be able to read.
//
// No `dynamicTypeSize` ceiling over the pair: photographed at
// `accessibility-extra-extra-extra-large`, the largest size there is, the name
// and the line under it both still sit inside the bar. A ceiling would hold
// every accessibility size down to a non-accessibility one, which is a cost
// paid by the readers who asked for the larger text in the first place.
export const TITLE_MODIFIERS = [
	font({textStyle: 'headline'}),
	foregroundStyle(c.label),
	lineLimit(1),
	minimumScaleFactor(0.85),
]
// The subtitle shrinks rather than truncates: it can carry several facts at the
// largest accessibility type sizes, and a clipped one reads as a different
// fact rather than as a missing one.
export const SUBTITLE_MODIFIERS = [
	font({textStyle: 'caption'}),
	foregroundStyle(c.secondaryLabel),
	lineLimit(1),
	minimumScaleFactor(0.7),
]

/**
 * A screen's name over whatever it has to say beneath, which is the whole of a two-line title.
 * `titleModifiers` sets the name in a screen's own type in place of the system headline.
 */
export function TitleStack(props: {
	name: string
	subtitle: React.ReactNode
	titleModifiers?: ModifierConfig[]
}): React.ReactNode {
	return (
		<VStack spacing={0}>
			<Text modifiers={props.titleModifiers ?? TITLE_MODIFIERS}>{props.name}</Text>
			{props.subtitle}
		</VStack>
	)
}

/**
 * The title as VoiceOver meets it: one element reading the name and the line
 * under it together, rather than two the reader has to swipe between.
 *
 * A button already announces itself as one, and a control announced as a
 * button *and* a heading is a control VoiceOver describes inconsistently -- so
 * the heading trait goes only on a title that cannot be tapped.
 */
export function readAsOneTitle(spoken: string, opts: {isButton: boolean}): ModifierConfig[] {
	return [
		accessibilityElement('combine'),
		accessibilityLabel(spoken),
		...(opts.isButton ? [] : [accessibilityAddTraits(['isHeader'])]),
	]
}

type Props = {
	title: string
	/** A quieter line under the title, or none. */
	subtitle?: string | null
	/** What the next screen's Back button reads; the title by default. */
	backTitle?: string
	/** Sets the title in a screen's own type in place of the system headline. */
	titleModifiers?: ModifierConfig[]
}

/**
 * A screen's title in its navigation bar as two lines: the screen's name in a
 * headline, over a caption saying which part of what it is showing. Must be
 * rendered by the route's own screen, since Expo Router keys a title by the
 * nearest route.
 */
export function NavigationTitle({
	title,
	subtitle,
	backTitle = title,
	titleModifiers,
}: Props): React.ReactNode {
	let spoken = subtitle ? `${title}, ${subtitle}` : title

	return (
		<>
			{/* `Stack.Title asChild` sets only `headerTitle`; the plain string
			    is what the back button and VoiceOver's fallback read. */}
			<Stack.Screen options={{title: backTitle}} />
			<Stack.Title asChild={true}>
				{/* An explicit size rather than `matchContents`: a navigation bar
				    gives its title view no size to match, so a self-sizing host
				    collapses and takes the title with it. */}
				<Host style={TITLE_HOST_STYLE}>
					<VStack
						modifiers={[
							...readAsOneTitle(spoken, {isButton: false}),
							accessibilityIdentifier(NAVIGATION_TITLE_ID),
						]}
					>
						<TitleStack
							name={title}
							titleModifiers={titleModifiers}
							subtitle={subtitle ? <Text modifiers={SUBTITLE_MODIFIERS}>{subtitle}</Text> : null}
						/>
					</VStack>
				</Host>
			</Stack.Title>
		</>
	)
}

const styles = StyleSheet.create({
	// The widest the bar can give a title without crowding a back button on one
	// side and a button or two on the other. Past this the subtitle scales
	// itself down (see `SUBTITLE_MODIFIERS`); the name still clips rather than
	// shrinks, since a navigation bar keeps its height whatever it is asked to
	// hold.
	host: {
		width: 260,
		height: 44,
	},
})

/** The size of a two-line title's host, for a title drawn by hand around `TitleStack`. */
export const TITLE_HOST_STYLE = styles.host
