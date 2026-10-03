import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Form, Host} from '@expo/ui/swift-ui'
import {accessibilityIdentifier} from '@expo/ui/swift-ui/modifiers'
import {Stack} from 'expo-router'
import * as c from '@frogpond/colors'
import {SheetSection} from '@frogpond/sheet-section'

import {SheetCloseButton} from '../../../source/components/sheet-close-button'
import {IssueStainsRow} from '../../../source/features/mess/issue-stains-row'
import {PhotoToneRow} from '../../../source/features/mess/photo-tone-row'

const styles = StyleSheet.create({
	// A sheet paints its own background; a Form left to the default shows glass.
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

export default function MessengerCustomizePage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Customize</Stack.Title>
			<SheetCloseButton />
			<Host style={styles.host} modifiers={[accessibilityIdentifier('screen-mess-customize')]}>
				<Form>
					<SheetSection title="Issues">
						<IssueStainsRow />
					</SheetSection>
					<SheetSection title="Thumbnails">
						<PhotoToneRow />
					</SheetSection>
				</Form>
			</Host>
		</>
	)
}
