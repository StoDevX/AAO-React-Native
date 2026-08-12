import React from 'react'
import {ScrollView, StyleSheet, Text, View} from 'react-native'
import * as c from '@frogpond/colors'
import {Stack, useNavigation} from 'expo-router'

import {FaqBanner} from '../../source/features/faqs/banner'
import {fallbackFaqs} from '../../source/features/faqs/local-faqs'

export default function FaqBannerLibraryPage(): React.ReactNode {
	const navigation = useNavigation()
	return (
		<>
			<Stack.Screen options={{presentation: 'card'}} />
			<Stack.Title>FAQ Banners</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>

			<ScrollView
				contentContainerStyle={styles.container}
				contentInsetAdjustmentBehavior="automatic"
			>
				{fallbackFaqs.map((banner) => (
					<View key={banner.id} style={styles.example}>
						<Text style={styles.exampleTitle}>
							Targets: {banner.targets.join(', ')}
						</Text>
						<FaqBanner
							faqId={banner.id}
							onPressOverride={() => undefined}
							style={styles.banner}
							target={banner.targets[0]}
						/>
					</View>
				))}
			</ScrollView>
		</>
	)
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
