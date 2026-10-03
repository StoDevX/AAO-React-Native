import * as React from 'react'
import {Section} from '@expo/ui/swift-ui'
import {IssueStainsRow} from './issue-stains-row'

export let MiscellanySection = (): React.ReactNode => {
	return (
		<Section title="Miscellany">
			<IssueStainsRow />
		</Section>
	)
}
