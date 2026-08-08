import React from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import {Markdown} from '@frogpond/markdown'
import privacyData from '../../../../docs/privacy.json'

const styles = StyleSheet.create({
	scrollView: {
		backgroundColor: c.systemBackground,
		paddingHorizontal: 15,
		paddingVertical: 15,
	},
})

export let PrivacyView = (): React.ReactNode => (
	<ScrollView
		contentInsetAdjustmentBehavior="automatic"
		style={styles.scrollView}
	>
		<Markdown source={privacyData.text} />
	</ScrollView>
)
