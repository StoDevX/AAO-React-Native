import * as React from 'react'
import {Section} from '@expo/ui/swift-ui'
import {trackedOpenUrl} from '@frogpond/open-url'
import {GH_BASE_URL} from '../../../../lib/constants'
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

	return (
		<Section title="Miscellany">
			<IssueStainsRow />
			<NavigationRow onPress={onCreditsButton} title="Credits" />
			<ShareTelemetryToggle />
			<NavigationRow onPress={onPrivacyButton} title="Privacy Policy" />
			<NavigationRow onPress={onLegalButton} title="Legal" />
			<DisclosureRow destination="external" onPress={onSourceButton} title="Contributing" />
		</Section>
	)
}
