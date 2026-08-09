import * as React from 'react'
import {Section, Toggle} from '@expo/ui/swift-ui'
import {trackedOpenUrl} from '@frogpond/open-url'
import {GH_BASE_URL} from '../../../../lib/constants'
import * as storage from '../../../../lib/storage'
import {useRouter} from 'expo-router'
import {ActionRow, NavigationRow} from '../../components/rows'

export let MiscellanySection = (): React.ReactNode => {
	let router = useRouter()

	let onCreditsButton = () => router.push('/Credits')
	let onPrivacyButton = () => router.push('/Privacy')
	let onLegalButton = () => router.push('/Legal')
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
