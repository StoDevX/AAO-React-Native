import * as React from 'react'
import {Section, Toggle} from '@expo/ui/swift-ui'
import {trackedOpenUrl} from '@frogpond/open-url'
import {GH_BASE_URL} from '../../../../lib/constants'
import * as storage from '../../../../lib/storage'
import {useRouter} from 'expo-router'
import {DisclosureRow, NavigationRow} from '../../../../components/rows'
import {ShareTelemetryToggle} from '../../../telemetry/consent-toggle'
import {IssueStainsRow} from './issue-stains-row'

const onSourceButton = () => trackedOpenUrl({url: GH_BASE_URL, id: 'ContributingView'})

export let MiscellanySection = (): React.ReactNode => {
	let router = useRouter()

	let onCreditsButton = () => router.navigate('/settings/credits')
	let onPrivacyButton = () => router.navigate('/settings/privacy')
	let onLegalButton = () => router.navigate('/settings/legal')

	let [openInApplinkPreference, setOpenInAppLinkPreference] = React.useState(true)

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
			<IssueStainsRow />
			<Toggle
				isOn={openInApplinkPreference}
				label="Open links in-app"
				onIsOnChange={handleOpenLinkOnChange}
			/>
			<NavigationRow onPress={onCreditsButton} title="Credits" />
			<ShareTelemetryToggle />
			<NavigationRow onPress={onPrivacyButton} title="Privacy Policy" />
			<NavigationRow onPress={onLegalButton} title="Legal" />
			<DisclosureRow destination="external" onPress={onSourceButton} title="Contributing" />
		</Section>
	)
}
