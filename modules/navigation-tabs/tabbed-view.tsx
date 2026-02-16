import React from 'react'
import {
	Platform,
	Pressable,
	StyleSheet,
	Text,
	View,
	useColorScheme,
} from 'react-native'

export interface Tab<TabNavigatorParams> {
	enabled?: true | false | undefined
	name: Extract<keyof TabNavigatorParams, string>
	component: () => React.JSX.Element
	tabBarLabel: string
	tabBarIcon:
		| undefined
		| (({
				color,
				focused,
		  }: {
				color: string
				focused: boolean
		  }) => React.JSX.Element)
}

export class UnknownPlatformError extends Error {}

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	screenArea: {
		flex: 1,
	},
	screen: {
		flex: 1,
	},
	hiddenScreen: {
		display: 'none',
	},
	tabBar: {
		flexDirection: 'row',
		borderTopWidth: StyleSheet.hairlineWidth,
	},
	tab: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingTop: 8,
		paddingBottom: Platform.OS === 'ios' ? 18 : 10,
		paddingHorizontal: 4,
		gap: 2,
	},
	label: {
		fontSize: 11,
		fontWeight: '500',
		textAlign: 'center',
	},
})

type ParamListBase = Record<string, object | undefined>

export function createTabNavigator<Params extends ParamListBase>(
	tabs: readonly Tab<Params>[],
): () => React.JSX.Element {
	const activeTabs = tabs.filter((tab) => tab.enabled !== false)

	if (!activeTabs.length) {
		throw new UnknownPlatformError()
	}

	return function TabbedView(): React.JSX.Element {
		const [activeIndex, setActiveIndex] = React.useState(0)
		const colorScheme = useColorScheme()
		const isDark = colorScheme === 'dark'
		const activeTint = isDark ? '#ffffff' : '#000000'
		const inactiveTint = isDark ? '#8e8e93' : '#6b7280'
		const tabBarBackground = isDark ? '#101114' : '#f7f7f7'
		const tabBarBorder = isDark ? '#26272b' : '#d1d5db'

		return (
			<View style={styles.root}>
				<View style={styles.screenArea}>
					{activeTabs.map((tab, index) => {
						const Component = tab.component
						const hidden = index !== activeIndex
						return (
							<View
								key={tab.name}
								style={[styles.screen, hidden && styles.hiddenScreen]}
							>
								<Component />
							</View>
						)
					})}
				</View>

				<View
					style={[
						styles.tabBar,
						{
							backgroundColor: tabBarBackground,
							borderTopColor: tabBarBorder,
						},
					]}
				>
					{activeTabs.map(({name, tabBarIcon, tabBarLabel}, index) => {
						const focused = activeIndex === index
						const color = focused ? activeTint : inactiveTint
						return (
							<Pressable
								key={name}
								accessibilityLabel={tabBarLabel}
								accessibilityRole="tab"
								accessibilityState={{selected: focused}}
								onPress={() => setActiveIndex(index)}
								style={styles.tab}
							>
								{tabBarIcon ? tabBarIcon({color, focused}) : null}
								<Text style={[styles.label, {color}]}>{tabBarLabel}</Text>
							</Pressable>
						)
					})}
				</View>
			</View>
		)
	}
}
