import * as React from 'react'
import {Section} from '@frogpond/tableview'
import {PushButtonCell} from '@frogpond/tableview/cells'
import {trackedOpenUrl} from '@frogpond/open-url'
import {GH_BASE_URL} from '../../../../lib/constants'
import {useNavigation} from '@react-navigation/native'

export let MiscellanySection = (): JSX.Element => {
	let navigation = useNavigation()

	let onCreditsButton = () => navigation.navigate('Credits')
	let onPrivacyButton = () => navigation.navigate('Privacy')
	let onLegalButton = () => navigation.navigate('Legal')
	let onSourceButton = () =>
		trackedOpenUrl({url: GH_BASE_URL, id: 'ContributingView'})

	return (
		<Section header="MISCELLANY">
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
