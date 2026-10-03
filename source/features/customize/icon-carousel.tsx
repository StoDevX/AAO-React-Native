import * as React from 'react'
import {Image as RNImage, StyleSheet, View, useColorScheme} from 'react-native'
import {
	Button,
	HStack,
	RNHostView,
	ScrollView,
	Spacer,
	Text,
	VStack,
	useNativeState,
} from '@expo/ui/swift-ui'
import {
	Animation,
	accessibilityAddTraits,
	accessibilityLabel,
	animation,
	buttonStyle,
	containerRelativeFrame,
	font,
	foregroundStyle,
	frame,
	id,
	opacity,
	scaleEffect,
	scrollPosition,
	scrollTargetBehavior,
	scrollTargetLayout,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import {type AppIconName, previewsFor} from '../../../images/icons'
import {ICONS, type IconEntry} from './icons'

/// The centred preview's side: the Credits logo's own size, so its 300px
/// render is sharp at @3x.
const LARGE = 100
/// How far the neighbours shrink, and how much they fade.
const NEIGHBOUR_SCALE = 0.6
const NEIGHBOUR_OPACITY = 0.5
/// Each cell takes a third of the row, so the middle third always holds one.
const CELLS_ACROSS = 3

const styles = StyleSheet.create({
	large: {
		width: LARGE,
		height: LARGE,
	},
})

type Props = {
	current: IconEntry
	onApply: (type: AppIconName) => void
}

/**
 * The icons as a row of large previews, one centred with its neighbours
 * smaller beside it. Swiping, or tapping a neighbour, moves the centre; Use
 * This Icon applies whichever icon is there.
 *
 * View-aligned snapping lines a cell up with the row's leading edge. With
 * every cell a third of the row, the cell after that one is always in the
 * middle, and an empty cell at each end lets the first and last icons get
 * there too.
 */
export function IconCarousel({current, onApply}: Props): React.ReactNode {
	let scheme = useColorScheme()
	let centred = useNativeState<string | null>(current.type)
	let [shown, setShown] = React.useState<string>(current.type)
	let entry = ICONS.find((icon) => icon.type === shown) ?? current
	let position = ICONS.indexOf(entry) + 1

	return (
		<VStack spacing={16}>
			<ScrollView
				axes="horizontal"
				modifiers={[
					scrollTargetBehavior('viewAligned'),
					scrollPosition(centred, {
						anchor: 'center',
						onChange: (next) => {
							if (next) {
								setShown(next)
							}
						},
					}),
				]}
				showsIndicators={false}
			>
				<HStack modifiers={[scrollTargetLayout()]} spacing={0}>
					<EndCell />
					{ICONS.map((icon) => {
						let isShown = icon.type === shown
						return (
							<Button
								key={icon.type}
								modifiers={[
									id(icon.type),
									buttonStyle('plain'),
									containerRelativeFrame({axes: 'horizontal', count: CELLS_ACROSS}),
									scaleEffect(isShown ? 1 : NEIGHBOUR_SCALE),
									opacity(isShown ? 1 : NEIGHBOUR_OPACITY),
									animation(Animation.easeInOut({duration: 0.2}), isShown),
									accessibilityLabel(icon.title),
									...(icon.type === current.type ? [accessibilityAddTraits(['isSelected'])] : []),
								]}
								onPress={() => {
									centred.value = icon.type
								}}
							>
								<HStack modifiers={[frame({width: LARGE, height: LARGE})]}>
									<RNHostView matchContents={false}>
										<View>
											<RNImage
												accessibilityIgnoresInvertColors={true}
												source={previewsFor(icon.type, scheme).logo}
												style={styles.large}
											/>
										</View>
									</RNHostView>
								</HStack>
							</Button>
						)
					})}
					<EndCell />
				</HStack>
			</ScrollView>

			<VStack spacing={2}>
				<Text modifiers={[font({textStyle: 'title3', weight: 'semibold'})]}>{entry.title}</Text>
				<Text modifiers={[foregroundStyle(c.secondaryLabel)]}>
					{`${entry.group} · ${position} of ${ICONS.length}`}
				</Text>
			</VStack>

			<Button
				label={entry.type === current.type ? 'Current Icon' : 'Use This Icon'}
				modifiers={[buttonStyle('borderedProminent')]}
				onPress={() => onApply(entry.type)}
			/>
		</VStack>
	)
}

/** An empty cell at either end of the row, so the first and last icons can reach the middle. */
function EndCell(): React.ReactNode {
	return (
		<Spacer
			modifiers={[
				containerRelativeFrame({axes: 'horizontal', count: CELLS_ACROSS}),
				frame({height: LARGE}),
			]}
		/>
	)
}
