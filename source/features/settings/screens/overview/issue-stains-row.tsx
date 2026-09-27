import * as React from 'react'
import {Picker, Text} from '@expo/ui/swift-ui'
import {accessibilityIdentifier, pickerStyle, tag} from '@expo/ui/swift-ui/modifiers'
import {useMessStore, type StainKind} from '../../../mess/store'

/** Names the picker, for a UI test. */
export const ISSUE_STAINS_ID = 'settings-issue-stains'

const KINDS: Array<[StainKind, string]> = [
	['coffee', 'Coffee'],
	['tea', 'Tea'],
	['none', 'None'],
]

/** What the Messenger's issues show for the stories read: coffee rings, tea rings, or nothing. */
export function IssueStainsRow(): React.ReactNode {
	let kind = useMessStore((state) => state.stainKind)
	let setKind = useMessStore((state) => state.setStainKind)
	return (
		<Picker<StainKind>
			label="Issue Stains"
			modifiers={[pickerStyle('menu'), accessibilityIdentifier(ISSUE_STAINS_ID)]}
			onSelectionChange={setKind}
			selection={kind}
		>
			{KINDS.map(([value, name]) => (
				<Text key={value} modifiers={[tag(value)]}>
					{name}
				</Text>
			))}
		</Picker>
	)
}
