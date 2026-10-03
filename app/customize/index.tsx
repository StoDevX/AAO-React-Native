import * as React from 'react'
import {StyleSheet, useColorScheme} from 'react-native'
import {Form, Host, Picker, Text, Toggle} from '@expo/ui/swift-ui'
import {accessibilityIdentifier, pickerStyle, tag} from '@expo/ui/swift-ui/modifiers'
import {Stack, useFocusEffect, useRouter} from 'expo-router'
import * as c from '@frogpond/colors'
import {SheetSection} from '@frogpond/sheet-section'

import {previewsFor} from '../../images/icons'
import {DisclosureRow, NavigationRow} from '../../source/components/rows'
import {SheetCloseButton} from '../../source/components/sheet-close-button'
import {type LinkTarget, useOpenLinksIn} from '../../source/features/customize/open-links-in'
import {useAppIcon} from '../../source/features/customize/use-app-icon'
import {useRadioPlayerSetting} from '../../source/features/customize/radio-player-setting'

/// Settings' own row-icon size, as `rows.tsx` draws a gradient icon.
const ROW_ICON_SIZE = 30

const styles = StyleSheet.create({
	// A sheet paints its own background; a Form left to the default shows glass.
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

export default function CustomizePage(): React.ReactNode {
	let router = useRouter()
	let scheme = useColorScheme()
	let {current, reload} = useAppIcon()
	// The gallery pushed from here changes the icon, so read it again on return.
	useFocusEffect(
		React.useCallback(() => {
			reload()
		}, [reload]),
	)
	let [linkTarget, setLinkTarget] = useOpenLinksIn()
	let [showRadio, setShowRadio] = useRadioPlayerSetting()

	return (
		<>
			<Stack.Title>Customize</Stack.Title>
			<SheetCloseButton />
			<Host style={styles.host} modifiers={[accessibilityIdentifier('screen-customize')]}>
				<Form>
					<SheetSection>
						<DisclosureRow
							detail={[current.title]}
							identifier="app-icon-row"
							image={{
								source: previewsFor(current.type, scheme).icon,
								width: ROW_ICON_SIZE,
								height: ROW_ICON_SIZE,
							}}
							onPress={() => router.navigate('/customize/app-icon')}
							title="App Icon"
						/>
					</SheetSection>
					<SheetSection title="Browsing">
						<Picker<LinkTarget>
							label="Open Links"
							modifiers={[pickerStyle('menu'), accessibilityIdentifier('open-links-in')]}
							onSelectionChange={setLinkTarget}
							selection={linkTarget}
						>
							<Text modifiers={[tag('app')]}>In App</Text>
							<Text modifiers={[tag('safari')]}>Safari</Text>
						</Picker>
					</SheetSection>
					<SheetSection title="Home Screen">
						<Toggle
							isOn={showRadio}
							label="Radio Player"
							modifiers={[accessibilityIdentifier('show-radio-player')]}
							onIsOnChange={setShowRadio}
						/>
						<NavigationRow
							onPress={() => router.navigate('/customize/quick-actions')}
							title="Quick Actions"
						/>
					</SheetSection>
				</Form>
			</Host>
		</>
	)
}
