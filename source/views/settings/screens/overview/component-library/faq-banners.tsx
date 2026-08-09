import React from 'react'
import {ScrollView, StyleSheet, Text, View} from 'react-native'
import * as c from '@frogpond/colors'
import {Stack} from 'expo-router'

import {FaqBanner} from '../../../../faqs'
import {fallbackFaqs} from '../../../../faqs/local-faqs'
import {useNavigation} from 'expo-router'

export const FaqBannerLibrary = (): React.ReactNode => {
	const navigation = useNavigation()
	return (
		<>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
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
