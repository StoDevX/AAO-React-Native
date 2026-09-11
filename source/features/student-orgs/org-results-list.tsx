import * as React from 'react'
import {StyleSheet} from 'react-native'
import {ContentUnavailableView, Host, List, Section} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {DisclosureRow} from '../../components/rows'
import type {OrgSection} from './search'
import type {StudentOrgType} from './types'

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

type Props = {
	sections: OrgSection[]
	/** Shown in place of the list when `sections` is empty. */
	emptyText: string
	onPressOrg: (org: StudentOrgType) => void
	onRefresh: () => Promise<unknown>
}

/**
 * The grouped, disclosure-row rendering of a Student Orgs result set --
 * shared between the landing screen's cross-category search results and a
 * single category's filtered list. Presentational only: search state,
 * filtering, and grouping all happen in whichever screen calls this.
 */
export function OrgResultsList({
	sections,
	emptyText,
	onPressOrg,
	onRefresh,
}: Props): React.ReactNode {
	return (
		<Host style={styles.host}>
			<List
				modifiers={[
					listStyle('insetGrouped'),
					refreshable(async () => {
						await onRefresh()
					}),
				]}
			>
				{sections.length === 0 ? (
					<ContentUnavailableView systemImage="person.3" title={emptyText} />
				) : (
					sections.map((section) => (
						<Section key={section.title} title={section.title}>
							{section.data.map((org) => (
								<DisclosureRow
									key={org.name + org.category}
									detail={org.category}
									detailLines={1}
									onPress={() => onPressOrg(org)}
									title={org.name}
								/>
							))}
						</Section>
					))
				)}
			</List>
		</Host>
	)
}
