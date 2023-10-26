import * as React from 'react'

import {useNavigation} from '@react-navigation/native'

import {trackedOpenUrl} from '@frogpond/open-url'
import {Section} from '@frogpond/tableview'
import {CellToggle, PushButtonCell} from '@frogpond/tableview/cells'

import {GH_BASE_URL} from '../../../../lib/constants'
import * as storage from '../../../../lib/storage'

export let MiscellanySection = (): JSX.Element => {
	let navigation = useNavigation()

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
		<Section header="MISCELLANY">
			<CellToggle
				label="Open links in-app"
				onChange={handleOpenLinkOnChange}
				value={openInApplinkPreference}
			/>
			<PushButtonCell onPress={onCreditsButton} title="Credits" />
			<PushButtonCell onPress={onPrivacyButton} title="Privacy Policy" />
			<PushButtonCell onPress={onLegalButton} title="Legal" />
			<PushButtonCell
				onPress={onSourceButton}
				showLinkStyle={true}
				title="Contributing"
			/>
		</Section>
	)
}
