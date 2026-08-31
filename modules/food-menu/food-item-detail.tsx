import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, HStack, List, Section, Text, VStack} from '@expo/ui/swift-ui'
import {
	font,
	foregroundStyle,
	frame,
	listRowInsets,
	listStyle,
	monospacedDigit,
	padding,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import {calculateAmount} from './lib/calculate-amount'
import {DietaryBadge} from './dietary-badge-view'
import {dietaryBadge} from './lib/dietary-badge'
import {dietaryIconKeys} from './lib/dietary-icon-keys'
import {nutritionPanel} from './lib/nutrition-panel'
import type {MasterCorIconMapType, MenuItemType, NutritionDetailType} from './types'

/** How far a Nutrition Facts panel indents a nutrient beneath its parent. */
const NESTING_INSET = 16

/**
 * The margin a grouped list keeps between a row's content and the card's edge.
 * Restated because `listRowInsets` replaces all four edges wholesale rather
 * than merging with the system's -- an edge left out of it lands at zero, not
 * at the default -- so the panel's rows would otherwise lose their side
 * margins and stop lining up with the sections above.
 */
const ROW_MARGIN = 16

/**
 * Built once rather than per render, so a rerender allocates no fresh modifier
 * objects.
 */
const FILL_LEADING = [frame({maxWidth: Infinity, alignment: 'leading'})]

const SECONDARY = [foregroundStyle(c.secondaryLabel)]

/** The panel's own small print: the caption above Calories, and the source note. */
const CAPTION = [font({textStyle: 'caption'}), foregroundStyle(c.secondaryLabel)]

/**
 * A panel names the figure and states its amount as one phrase -- "Total Fat
 * 1g" -- rather than spreading the two to opposite edges. Weight carries the
 * hierarchy: the nutrients the panel bolds against the ones it indents.
 */
const ROW_NAME = [font({textStyle: 'body', weight: 'semibold'})]

/**
 * A grouped list sizes its rows for a finger, at 11pt above and below. The
 * panel is a dense table nobody taps, so its rows take about half that, which
 * is what lets the whole panel be read at once rather than scrolled through.
 */
const ROW_INSETS = listRowInsets({top: 5, bottom: 5, leading: ROW_MARGIN, trailing: ROW_MARGIN})

const PANEL_ROW = [ROW_INSETS]

const NESTED_PANEL_ROW = [ROW_INSETS, padding({leading: NESTING_INSET})]

/** Calories keep the room the printed label's rules give them. */
const CALORIES_ROW = [listRowInsets({top: 8, bottom: 8, leading: ROW_MARGIN, trailing: ROW_MARGIN})]

/**
 * `monospacedDigit` keeps the figures on a grid, so a column of them is even.
 * The fill is what leaves the amount against its name rather than against the
 * card's trailing edge.
 */
const AMOUNT = [monospacedDigit(), frame({maxWidth: Infinity, alignment: 'leading'})]

/** Calories are the panel's centrepiece, and are sized to say so. */
const CALORIES_NAME = [font({textStyle: 'title3', weight: 'bold'})]

const CALORIES_AMOUNT = [
	font({textStyle: 'title3', weight: 'bold'}),
	monospacedDigit(),
	frame({maxWidth: Infinity, alignment: 'leading'}),
]

/**
 * The panel carries no % Daily Value and no servings-per-container, because
 * the cafe reports neither. Saying where the figures come from keeps the
 * layout from implying a precision they do not have.
 */
const NUTRITION_FOOTER = <Text modifiers={CAPTION}>As reported by the cafe.</Text>

function CaloriesRow({detail}: {detail: NutritionDetailType}): React.ReactNode {
	return (
		<VStack alignment="leading" modifiers={CALORIES_ROW} spacing={2}>
			<Text modifiers={CAPTION}>Amount per serving</Text>
			<HStack spacing={8}>
				<Text modifiers={CALORIES_NAME}>{detail.label}</Text>
				<Text modifiers={CALORIES_AMOUNT}>{calculateAmount(detail)}</Text>
			</HStack>
		</VStack>
	)
}

/** Serves the serving size as well as the nutrients: both read name then amount. */
function PanelRow({
	detail,
	nested,
}: {
	detail: NutritionDetailType
	nested: boolean
}): React.ReactNode {
	return (
		<HStack modifiers={nested ? NESTED_PANEL_ROW : PANEL_ROW} spacing={4}>
			<Text modifiers={nested ? undefined : ROW_NAME}>{detail.label}</Text>
			<Text modifiers={AMOUNT}>{calculateAmount(detail)}</Text>
		</HStack>
	)
}

type Props = {
	item: MenuItemType
	icons: MasterCorIconMapType
}

export const MenuItemDetailView = ({item, icons}: Props): React.ReactNode => {
	let dietaryKeys = dietaryIconKeys(icons, item.cor_icon)

	let panel = nutritionPanel(item.nutrition_details)
	let hasNutrition = Boolean(panel.servingSize ?? panel.calories) || panel.nutrients.length > 0

	return (
		<Host style={styles.host}>
			<List
				modifiers={[
					// Inset groups, as Settings has them: cards on the grouped
					// background rather than full-bleed rows. Matches the menu this
					// screen is pushed from.
					listStyle('insetGrouped'),
				]}
			>
				{item.description ? (
					<Section title="Description">
						<Text>{item.description}</Text>
					</Section>
				) : null}

				{dietaryKeys.length > 0 ? (
					<Section title="Dietary">
						{dietaryKeys.map((key) => (
							<HStack key={key} spacing={8}>
								<DietaryBadge badge={dietaryBadge(key, icons)} />
								<Text modifiers={FILL_LEADING}>{icons[key]?.label}</Text>
							</HStack>
						))}
					</Section>
				) : null}

				<Section footer={hasNutrition ? NUTRITION_FOOTER : undefined} title="Nutrition">
					{panel.servingSize ? <PanelRow detail={panel.servingSize} nested={false} /> : null}

					{panel.calories ? <CaloriesRow detail={panel.calories} /> : null}

					{panel.nutrients.map(({key, detail, nested}) => (
						<PanelRow key={key} detail={detail} nested={nested} />
					))}

					{hasNutrition ? null : <Text modifiers={SECONDARY}>No nutritional information</Text>}
				</Section>
			</List>
		</Host>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
