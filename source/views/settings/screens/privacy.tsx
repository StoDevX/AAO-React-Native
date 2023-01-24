import React from 'react'
import {ScrollView, View, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import {Markdown} from '@frogpond/markdown'
import {text} from '../../../../docs/privacy.json'

const styles = StyleSheet.create({
	scrollView: {
		backgroundColor: c.white,
		paddingHorizontal: 15,
	},
	view: {
		paddingVertical: 15,
	},
})

export let PrivacyView = (): JSX.Element => (
	<ScrollView
		contentInsetAdjustmentBehavior="automatic"
		style={styles.scrollView}
	>
		<View style={styles.view}>
			<Markdown source={text} />
		</View>
	</ScrollView>
)
