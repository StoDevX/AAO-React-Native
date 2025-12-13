import * as React from 'react'
import {ScrollView, StyleSheet, Text, View} from 'react-native'
import * as c from '@frogpond/colors'

import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import {FaqBanner} from '../../../../faqs'
import {fallbackFaqs} from '../../../../faqs/local-faqs'

export const FaqBannerLibrary = (): JSX.Element => (
	<ScrollView contentContainerStyle={styles.container}>
		{fallbackFaqs.map((banner) => (
			<View key={banner.id} style={styles.example}>
				<Text style={styles.exampleTitle}>
					Targets: {banner.targets.join(', ')}
				</Text>
				<FaqBanner
					faqId={banner.id}
					style={styles.banner}
					target={banner.targets[0]}
				/>
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
