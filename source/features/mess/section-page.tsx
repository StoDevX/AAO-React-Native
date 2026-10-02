import * as React from 'react'
import {useRouter} from 'expo-router'
import {HStack, ScrollView} from '@expo/ui/swift-ui'
import {useQuery} from '@tanstack/react-query'
import {Chip} from './chip'
import {filterTree} from './lib/filter'
import {PageLoading, PageMessage, PageNotice} from './page-notice'
import {messCategoriesOptions} from './query'
import {CategoryStories} from './story-list'
import type {MessCategory} from './types'

/** Names every column chip, for a UI test; each is told apart by its label. */
export const COLUMN_CHIP_ID = 'mess-column-chip'

/** A section's columns, A–Z, as one row of chips that scrolls sideways. */
function ColumnChips({columns}: {columns: MessCategory[]}): React.ReactNode {
	let router = useRouter()
	return (
		<ScrollView axes="horizontal" showsIndicators={false}>
			<HStack spacing={8}>
				{columns.map((column) => (
					<Chip
						identifier={COLUMN_CHIP_ID}
						key={column.id}
						label={column.name}
						onPress={() =>
							router.navigate({pathname: '/messenger/column', params: {id: String(column.id)}})
						}
					/>
				))}
			</HStack>
		</ScrollView>
	)
}

/**
 * A section's columns as a row of chips, each opening that column's list on a page of its own,
 * then the section's newest stories.
 */
export function SectionStories({name}: {name: string}): React.ReactNode {
	let categories = useQuery(messCategoriesOptions)
	let branch = React.useMemo(
		() =>
			categories.data === undefined
				? undefined
				: filterTree(categories.data).find((candidate) => candidate.section.name === name),
		[categories.data, name],
	)

	let body: React.ReactNode
	if (branch) {
		body = (
			<>
				{branch.columns.length > 0 ? <ColumnChips columns={branch.columns} /> : null}
				<CategoryStories categoryId={branch.section.id} />
			</>
		)
	} else if (categories.data) {
		// A saved filter can name a section WordPress has since renamed or dropped.
		body = <PageMessage text={`The Mess has no ${name} section right now.`} />
	} else if (categories.isError) {
		body = <PageNotice error={categories.error} onRetry={() => categories.refetch()} />
	} else {
		body = <PageLoading paused={categories.fetchStatus === 'paused'} />
	}

	return body
}
