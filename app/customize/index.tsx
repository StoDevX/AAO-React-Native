import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Form, Host, Picker, Section, Text, Toggle} from '@expo/ui/swift-ui'
import {accessibilityIdentifier, pickerStyle, tag} from '@expo/ui/swift-ui/modifiers'
import {Stack, useRouter} from 'expo-router'
import * as c from '@frogpond/colors'

import {NavigationRow} from '../../source/components/rows'
import {SheetCloseButton} from '../../source/components/sheet-close-button'
import {type LinkTarget, useOpenLinksIn} from '../../source/features/customize/open-links-in'
import {useRadioStore} from '../../source/features/streaming/radio'

const styles = StyleSheet.create({
	// A sheet paints its own background; a Form left to the default shows glass.
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

export default function CustomizePage(): React.ReactNode {
	let router = useRouter()
	let [linkTarget, setLinkTarget] = useOpenLinksIn()
	let showRadio = useRadioStore((state) => state.showOnHome)
	let setShowRadio = useRadioStore((state) => state.setShowOnHome)

	return (
		<>
			<Stack.Title>Customize</Stack.Title>
			<SheetCloseButton />
			<Host style={styles.host} modifiers={[accessibilityIdentifier('screen-customize')]}>
				<Form>
					<Section title="Browsing">
						<Picker<LinkTarget>
							label="Open Links In"
							modifiers={[pickerStyle('menu'), accessibilityIdentifier('open-links-in')]}
							onSelectionChange={setLinkTarget}
							selection={linkTarget}
						>
							<Text modifiers={[tag('app')]}>In App</Text>
							<Text modifiers={[tag('safari')]}>Safari</Text>
						</Picker>
					</Section>
					<Section title="Home Screen">
						{/* Turning it off also stops the radio; see useRadioStore.setShowOnHome. */}
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
					</Section>
				</Form>
			</Host>
		</>
	)
}
