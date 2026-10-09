import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Form, Host, Toggle} from '@expo/ui/swift-ui'
import {accessibilityIdentifier} from '@expo/ui/swift-ui/modifiers'
import {Stack} from 'expo-router'
import * as c from '@frogpond/colors'
import {SheetSection} from '@frogpond/sheet-section'

import {SheetCloseButton} from '../../components/sheet-close-button'
import {IssueStainsRow} from './issue-stains-row'
import {PhotoToneRow} from './photo-tone-row'
import {useMessStore} from './store'

const styles = StyleSheet.create({
	// A sheet paints its own background; a Form left to the default shows glass.
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

/** A paper's Customize sheet: how its issue tiles and stories look. */
export function CustomizeScreen(): React.ReactNode {
	let keepPhotoStoriesDark = useMessStore((state) => state.keepPhotoStoriesDark)
	let setKeepPhotoStoriesDark = useMessStore((state) => state.setKeepPhotoStoriesDark)

	return (
		<>
			<Stack.Title>Customize</Stack.Title>
			<SheetCloseButton />
			<Host style={styles.host} modifiers={[accessibilityIdentifier('screen-mess-customize')]}>
				<Form>
					<SheetSection title="Issues">
						<IssueStainsRow />
						<PhotoToneRow />
					</SheetSection>
					<SheetSection title="Stories">
						<Toggle
							isOn={keepPhotoStoriesDark}
							label="Dark page for Photo stories"
							modifiers={[accessibilityIdentifier('keep-photo-stories-dark')]}
							onIsOnChange={setKeepPhotoStoriesDark}
						/>
					</SheetSection>
				</Form>
			</Host>
		</>
	)
}
