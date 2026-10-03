import * as React from 'react'
import {StyleSheet, useWindowDimensions} from 'react-native'
import {Host, List, ScrollView, Section, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	frame,
	listStyle,
	padding,
	refreshable,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {GradientTile} from '../../components/gradient-tile'
import {DisclosureRow} from '../../components/rows'
import {TileGrid} from '../../components/tile-grid'
import {FILL_WIDTH, SCREEN_MARGIN, TILE_SPACING, wideGridShape} from '../../components/tile-layout'
import type {Layout} from '../../lib/layout-store'
import type {CategoryRowData} from './categories'

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

/// Mirrored by TestIdentifiers.StudentOrgs.categoryGrid.
const CATEGORY_GRID_ID = 'student-orgs-category-grid'

/// Mirrored by TestIdentifiers.StudentOrgs.categoryList.
const CATEGORY_LIST_ID = 'student-orgs-category-list'

/// Prefixes each category row's identifier; mirrored by
/// TestIdentifiers.StudentOrgs.categoryRowPrefix. The name follows it, so a
/// UI test can tell which category it tapped without parsing the row's
/// spoken label, which ends in the org count.
const CATEGORY_ROW_ID_PREFIX = 'student-orgs-category:'

/// Enough that no category name is cut off at any text size: the longest,
/// "Student-Led Campus Organizations", wraps to five lines at AX5. The names
/// are a short curated set, so a long one cannot crowd the list.
const CATEGORY_NAME_LINES = 5

type Props = {
	categories: CategoryRowData[]
	/** Which the reader picked from the screen's layout menu. */
	layout: Layout
	onSelectCategory: (category: string) => void
	onRefresh: () => Promise<unknown>
}

/**
 * The Student Orgs landing screen before a search: one tile or one row per
 * category, as the reader picked from the layout menu.
 */
export function CategoryLanding({layout, ...props}: Props): React.ReactNode {
	return layout === 'grid' ? <CategoryGrid {...props} /> : <CategoryList {...props} />
}

type LayoutProps = Omit<Props, 'layout'>

/// `Grid` itself does not scroll, so the tiles sit in their own `ScrollView`.
function CategoryGrid({categories, onSelectCategory, onRefresh}: LayoutProps): React.ReactNode {
	let {width, fontScale} = useWindowDimensions()
	let {columns, ratio} = wideGridShape(width - 2 * SCREEN_MARGIN, fontScale)

	return (
		<Host matchContents={false} style={styles.host}>
			<ScrollView
				modifiers={[
					refreshable(async () => {
						await onRefresh()
					}),
				]}
			>
				<VStack
					alignment="leading"
					modifiers={[
						padding({leading: SCREEN_MARGIN, trailing: SCREEN_MARGIN, top: SCREEN_MARGIN}),
						frame({maxWidth: FILL_WIDTH}),
					]}
					spacing={TILE_SPACING}
				>
					<TileGrid
						accessibilityId={CATEGORY_GRID_ID}
						columns={columns}
						items={categories}
						keyForItem={(category) => category.name}
						renderItem={(category) => (
							<GradientTile
								gradient={category.gradient}
								icon={category.icon}
								onPress={() => onSelectCategory(category.name)}
								ratio={ratio}
								reservesLabelLines={true}
								title={category.name}
							/>
						)}
					/>
				</VStack>
			</ScrollView>
		</Host>
	)
}

function CategoryList({categories, onSelectCategory, onRefresh}: LayoutProps): React.ReactNode {
	return (
		<Host style={styles.host}>
			<List
				modifiers={[
					listStyle('insetGrouped'),
					refreshable(async () => {
						await onRefresh()
					}),
					accessibilityIdentifier(CATEGORY_LIST_ID),
				]}
			>
				<Section>
					{categories.map((category) => (
						<DisclosureRow
							key={category.name}
							badge={category.count}
							identifier={`${CATEGORY_ROW_ID_PREFIX}${category.name}`}
							image={{systemName: category.icon, gradient: category.gradient}}
							onPress={() => onSelectCategory(category.name)}
							title={category.name}
							titleLines={CATEGORY_NAME_LINES}
						/>
					))}
				</Section>
			</List>
		</Host>
	)
}
