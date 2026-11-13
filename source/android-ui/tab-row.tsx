import * as React from 'react'
import {StyleSheet} from 'react-native'

import type {BottomTabBarProps} from 'expo-router/js-tabs'
import {
	Box,
	Column,
	Host,
	HorizontalDivider,
	Row,
	Spacer,
	Text,
	useMaterialColors,
} from '@expo/ui/jetpack-compose'
import {
	background,
	clip,
	fillMaxWidth,
	height,
	IntrinsicSize,
	selectable,
	selectableGroup,
	Shapes,
	weight,
	width,
} from '@expo/ui/jetpack-compose/modifiers'

/** One tab of a `MaterialTabRow`: the route it opens, and its label. */
export type MaterialTab = {name: string; title: string}

type Props = BottomTabBarProps & {
	/** The tabs to show, in order. Routes of the navigator not listed here stay off the row. */
	tabs: ReadonlyArray<MaterialTab>
}

/** A primary tab's height with a label and no icon, per Material 3. */
const TAB_HEIGHT = 48

/** The primary tab indicator's thickness, and the radius of its top corners. */
const INDICATOR_HEIGHT = 3

/** The gap between a tab's label and its indicator. */
const LABEL_GAP = 12

/** An unselected tab's indicator, which keeps its place so the label never shifts. */
const TRANSPARENT = '#00000000'

const styles = StyleSheet.create({
	host: {
		alignSelf: 'stretch',
	},
})

/**
 * Material 3 primary tabs, for a JavaScript tab navigator whose
 * `tabBarPosition` is `'top'`: a label per tab under the top app bar, the
 * selected one in the primary colour over a rounded indicator as wide as its
 * label, and a divider below the row. Drawn in Compose, so each tab gets
 * Material's ripple and reads to TalkBack as a tab in a group.
 *
 * Tabs, not a navigation bar: Material keeps the navigation bar for an app's
 * top-level destinations, and these are peer views within one destination (a
 * campus's cafés, a feature's two lists).
 */
export function MaterialTabRow({tabs, state, emitter, navigateToTab}: Props): React.ReactNode {
	let colors = useMaterialColors()
	let focused = state.routes[state.index]?.name

	let open = (name: string) => {
		let route = state.routes.find((candidate) => candidate.name === name)
		if (!route) {
			return
		}
		let event = emitter.emit({type: 'tabPress', target: route.key, canPreventDefault: true})
		if (name !== focused && !event.defaultPrevented) {
			navigateToTab(route.key)
		}
	}

	return (
		<Host matchContents={{vertical: true}} style={styles.host}>
			<Column modifiers={[fillMaxWidth(), background(colors.surface)]}>
				<Row modifiers={[fillMaxWidth(), selectableGroup()]}>
					{tabs.map((tab) => {
						let selected = tab.name === focused
						return (
							<Column
								horizontalAlignment="center"
								key={tab.name}
								modifiers={[
									weight(1),
									height(TAB_HEIGHT),
									selectable(selected, () => open(tab.name), 'tab'),
								]}
							>
								<Spacer modifiers={[weight(1)]} />
								<Column horizontalAlignment="center" modifiers={[width(IntrinsicSize.Max)]}>
									<Text
										color={selected ? colors.primary : colors.onSurfaceVariant}
										maxLines={1}
										style={{typography: 'titleSmall'}}
									>
										{tab.title}
									</Text>
									<Spacer modifiers={[height(LABEL_GAP)]} />
									<Box
										modifiers={[
											fillMaxWidth(),
											height(INDICATOR_HEIGHT),
											clip(
												Shapes.RoundedCorner({
													topStart: INDICATOR_HEIGHT,
													topEnd: INDICATOR_HEIGHT,
												}),
											),
											background(selected ? colors.primary : TRANSPARENT),
										]}
									/>
								</Column>
							</Column>
						)
					})}
				</Row>
				<HorizontalDivider color={colors.outlineVariant} />
			</Column>
		</Host>
	)
}
