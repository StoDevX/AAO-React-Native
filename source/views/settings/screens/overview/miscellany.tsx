import * as React from 'react'
import {Section, Toggle} from '@expo/ui/swift-ui'
import {trackedOpenUrl} from '@frogpond/open-url'
import {GH_BASE_URL} from '../../../../lib/constants'
import * as storage from '../../../../lib/storage'
import {NavigationProp, useNavigation} from '@react-navigation/native'
import {ActionRow, NavigationRow} from '../../components/rows'
import type {LegacyRootParamList} from '../../../../navigation/types'

export let MiscellanySection = (): React.ReactNode => {
	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()

	let onCreditsButton = () => navigation.navigate('Credits')
	let onPrivacyButton = () => navigation.navigate('Privacy')
	let onLegalButton = () => navigation.navigate('Legal')
	let onSourceButton = () =>
		trackedOpenUrl({url: GH_BASE_URL, id: 'ContributingView'})

	let [openInApplinkPreference, setOpenInAppLinkPreference] =
		React.useState(true)

	const handleOpenLinkOnChange = async (preference: boolean) => {
		await storage.setLinkPreference(preference)
		setOpenInAppLinkPreference(preference)
	}

	React.useEffect(() => {
		async function loadPreference() {
			setOpenInAppLinkPreference(await storage.getInAppLinkPreference())
		}

		loadPreference()
	}, [])

	return (
		<Section title="Miscellany">
			<Toggle
				isOn={openInApplinkPreference}
				label="Open links in-app"
				onIsOnChange={handleOpenLinkOnChange}
			/>
			<NavigationRow onPress={onCreditsButton} title="Credits" />
			<NavigationRow onPress={onPrivacyButton} title="Privacy Policy" />
			<NavigationRow onPress={onLegalButton} title="Legal" />
			<ActionRow onPress={onSourceButton} title="Contributing" />
		</Section>
	)
}
