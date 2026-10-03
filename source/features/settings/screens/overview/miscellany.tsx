import * as React from 'react'
import {LabeledContent, Section, Text} from '@expo/ui/swift-ui'
import * as Application from 'expo-application'
import {trackedOpenUrl} from '@frogpond/open-url'
import {GH_BASE_URL} from '../../../../lib/constants'
import {useRouter} from 'expo-router'
import {DisclosureRow, NavigationRow} from '../../../../components/rows'
import {IssueStainsRow} from './issue-stains-row'
import {formatVersion} from './version'

const onSourceButton = () => trackedOpenUrl({url: GH_BASE_URL, id: 'ContributingView'})

const getVersion = () =>
	formatVersion(Application.nativeApplicationVersion, Application.nativeBuildVersion)

export let MiscellanySection = (): React.ReactNode => {
	let router = useRouter()

	let onCreditsButton = () => router.navigate('/settings/credits')
	let onPrivacyButton = () => router.navigate('/settings/privacy')
	let onLegalButton = () => router.navigate('/settings/legal')

	return (
		<Section title="Miscellany">
			<IssueStainsRow />
			<NavigationRow onPress={onCreditsButton} title="Credits" />
			<NavigationRow onPress={onPrivacyButton} title="Privacy Policy" />
			<NavigationRow onPress={onLegalButton} title="Legal" />
			<DisclosureRow destination="external" onPress={onSourceButton} title="Contributing" />
			<LabeledContent label="Version">
				<Text>{getVersion()}</Text>
			</LabeledContent>
		</Section>
	)
}
