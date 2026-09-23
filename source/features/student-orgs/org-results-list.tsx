import * as React from 'react'
import {StyleSheet} from 'react-native'
import {ContentUnavailableView, Host, List, Section} from '@expo/ui/swift-ui'
import {accessibilityIdentifier, id, listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {DisclosureRow} from '../../components/rows'
import type {OrgSection} from './search'
import type {StudentOrgType} from './types'
import {sectionIndexLabel} from '../../lib/section-index-label'

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

/// Mirrored by TestIdentifiers.StudentOrgs.resultsList.
const RESULTS_LIST_ID = 'student-orgs-results-list'

type Props = {
	sections: OrgSection[]
	/** The search the sections were filtered by; a new one scrolls back to the top. */
	query: string
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
	query,
	emptyText,
	onPressOrg,
	onRefresh,
}: Props): React.ReactNode {
	let hasMultipleSections = sections.length > 1

	return (
		<Host style={styles.host}>
			<List
				modifiers={[
					listStyle('insetGrouped'),
					refreshable(async () => {
						await onRefresh()
					}),
					accessibilityIdentifier(RESULTS_LIST_ID),
					// A new query is a new list, starting from the top. Without this
					// the list keeps the offset it had, and results that sort above it
					// land offscreen.
					id(query),
				]}
			>
				{sections.length === 0 ? (
					<ContentUnavailableView systemImage="person.3" title={emptyText} />
				) : (
					sections.map((section) => (
						<Section
							key={section.title}
							modifiers={hasMultipleSections ? [sectionIndexLabel(section.title)] : []}
							title={hasMultipleSections ? section.title : undefined}
						>
							{section.data.map((org) => (
								<DisclosureRow
									key={org.organizationUri}
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
