import * as React from 'react'
import {ScrollView, StyleSheet, Text, View} from 'react-native'
import * as c from '@frogpond/colors'

import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import {FaqBanner} from '../../../../faqs'

const banners = [
	{target: 'Home' as const, title: 'Home'},
	{target: 'Menus' as const, title: 'Menus'},
	{target: 'SIS' as const, title: 'SIS'},
	{target: 'SettingsRoot' as const, title: 'Settings'},
]

export const FaqBannerLibrary = (): JSX.Element => (
	<ScrollView contentContainerStyle={styles.container}>
		{banners.map((banner) => (
			<View key={banner.target} style={styles.example}>
				<Text style={styles.exampleTitle}>{banner.title}</Text>
				<FaqBanner style={styles.banner} target={banner.target} />
			</View>
		))}
	</ScrollView>
)

export const FaqBannerNavigationOptions: NativeStackNavigationOptions = {
	title: 'FAQ Banners',
	presentation: 'card',
	headerRight: () => <CloseScreenButton />,
}

const styles = StyleSheet.create({
	container: {
		paddingVertical: 32,
		paddingHorizontal: 16,
		gap: 16,
	},
	example: {
		gap: 6,
	},
	exampleTitle: {
		color: c.secondaryLabel,
		fontSize: 12,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	banner: {
		marginVertical: 2,
	},
})
