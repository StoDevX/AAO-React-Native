import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Form, Host, Toggle} from '@expo/ui/swift-ui'
import {accessibilityIdentifier} from '@expo/ui/swift-ui/modifiers'
import {Stack} from 'expo-router'
import * as c from '@frogpond/colors'
import {SheetSection} from '@frogpond/sheet-section'

import {SheetCloseButton} from '../../../source/components/sheet-close-button'
import {IssueStainsRow} from '../../../source/features/mess/issue-stains-row'
import {PhotoToneRow} from '../../../source/features/mess/photo-tone-row'
import {useMessStore} from '../../../source/features/mess/store'
import {probe} from '../../../source/lib/probe'

const styles = StyleSheet.create({
	// A sheet paints its own background; a Form left to the default shows glass.
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

export default function MessengerCustomizePage(): React.ReactNode {
	let keepPhotoStoriesDark = useMessStore((state) => state.keepPhotoStoriesDark)
	let setKeepPhotoStoriesDark = useMessStore((state) => state.setKeepPhotoStoriesDark)

	React.useEffect(() => {
		probe(`keepPhotoStoriesDark rendered as ${keepPhotoStoriesDark}`)
	}, [keepPhotoStoriesDark])

	let onKeepPhotoStoriesDarkChange = (keep: boolean) => {
		probe(`keepPhotoStoriesDark change asked for ${keep}`)
		setKeepPhotoStoriesDark(keep)
		probe(`keepPhotoStoriesDark store now ${useMessStore.getState().keepPhotoStoriesDark}`)
	}

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
							onIsOnChange={onKeepPhotoStoriesDarkChange}
						/>
					</SheetSection>
				</Form>
			</Host>
		</>
	)
}
