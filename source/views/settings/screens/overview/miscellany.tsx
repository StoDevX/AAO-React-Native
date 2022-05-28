import * as React from 'react'
import {Section, PushButtonCell} from '@frogpond/tableview'
import {trackedOpenUrl} from '@frogpond/open-url'
import * as Icons from '@hawkrives/react-native-alternate-icons'
import {GH_BASE_URL} from '../../../../lib/constants'
import {useNavigation} from '@react-navigation/native'

export let MiscellanySection = (): JSX.Element => {
	let [canChangeIcon, setCanChangeIcon] = React.useState(false)

	let navigation = useNavigation()

	React.useEffect(() => {
		checkIfCustomIconsSupported()
	}, [])

	let checkIfCustomIconsSupported = async () => {
		let canChangeIcon = await Icons.isSupported()
		setCanChangeIcon(canChangeIcon)
	}

	let onCreditsButton = () => navigation.navigate('Credits')
	let onPrivacyButton = () => navigation.navigate('Privacy')
	let onLegalButton = () => navigation.navigate('Legal')
	let onSourceButton = () =>
		trackedOpenUrl({url: GH_BASE_URL, id: 'ContributingView'})
	let onAppIconButton = () => navigation.navigate('IconSettings')

	return (
		<Section header="MISCELLANY">
			{canChangeIcon ? (
				<PushButtonCell onPress={onAppIconButton} title="Change App Icon" />
			) : null}

			<PushButtonCell onPress={onCreditsButton} title="Credits" />
			<PushButtonCell onPress={onPrivacyButton} title="Privacy Policy" />
			<PushButtonCell onPress={onLegalButton} title="Legal" />
			<PushButtonCell onPress={onSourceButton} title="Contributing" />
		</Section>
	)
}
