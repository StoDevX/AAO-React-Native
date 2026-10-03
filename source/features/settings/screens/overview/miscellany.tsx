import * as React from 'react'
import {Section} from '@expo/ui/swift-ui'
import {trackedOpenUrl} from '@frogpond/open-url'
import {GH_BASE_URL} from '../../../../lib/constants'
import {DisclosureRow} from '../../../../components/rows'
import {IssueStainsRow} from './issue-stains-row'

const onSourceButton = () => trackedOpenUrl({url: GH_BASE_URL, id: 'ContributingView'})

export let MiscellanySection = (): React.ReactNode => {
	return (
		<Section title="Miscellany">
			<IssueStainsRow />
			<DisclosureRow destination="external" onPress={onSourceButton} title="Contributing" />
		</Section>
	)
}
