import * as React from 'react'
import {MenuPickerRow} from '../../components/menu-picker-row'
import {useMessStore, type StainKind} from './store'

/** Names the picker, for a UI test. */
export const ISSUE_STAINS_ID = 'issue-stains'

const KINDS = [
	['coffee', 'Coffee'],
	['tea', 'Tea'],
	['none', 'None'],
] as const satisfies ReadonlyArray<readonly [StainKind, string]>

/** What the Messenger's issues show for the stories read: coffee rings, tea rings, or nothing. */
export function IssueStainsRow(): React.ReactNode {
	let kind = useMessStore((state) => state.stainKind)
	let setKind = useMessStore((state) => state.setStainKind)
	return (
		<MenuPickerRow
			id={ISSUE_STAINS_ID}
			label="Paper Stains"
			onSelectionChange={setKind}
			options={KINDS}
			selection={kind}
		/>
	)
}
