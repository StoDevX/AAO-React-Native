import * as React from 'react'
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import * as c from '@frogpond/colors'
import {Constants} from './constants'
import {DateSection} from './types'

type TabSection = DateSection | typeof Constants.FILTER

interface TabBarProps {
	selectedSection: TabSection
	onSelectSection: (section: TabSection) => void
}

const SECTIONS: TabSection[] = [
	Constants.YESTERDAY,
	Constants.TODAY,
	Constants.UPCOMING,
	Constants.FILTER,
]

export function TabBar({selectedSection, onSelectSection}: TabBarProps): React.ReactNode {
	return (
		<View style={styles.container}>
			{SECTIONS.map((section) => (
				<TouchableOpacity
					key={section}
					accessibilityLabel={section}
					accessibilityRole="tab"
					accessibilityState={{selected: selectedSection === section}}
					onPress={() => {
						if (section !== selectedSection) {
							onSelectSection(section)
						}
					}}
					style={[styles.tab, selectedSection === section && styles.selectedTab]}
				>
					<Text
						numberOfLines={1}
						style={[styles.tabText, selectedSection === section && styles.selectedTabText]}
					>
						{section}
					</Text>
				</TouchableOpacity>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.systemBackground,
		borderBottomColor: c.separator,
		borderBottomWidth: StyleSheet.hairlineWidth,
		flexDirection: 'row',
	},
	tab: {
		alignItems: 'center',
		flex: 1,
		paddingVertical: 12,
	},
	selectedTab: {
		borderBottomColor: c.navyToNavy[0],
		borderBottomWidth: 2,
	},
	tabText: {
		color: c.label,
		fontSize: 14,
	},
	selectedTabText: {
		color: c.navyToNavy[0],
		fontWeight: 'bold',
	},
})
