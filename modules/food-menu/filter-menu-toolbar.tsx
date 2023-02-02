import React, {useCallback, useMemo} from 'react'

import {StyleSheet, Text, View} from 'react-native'
import type {Moment} from 'moment'
import {Toolbar} from '@frogpond/toolbar'
import * as c from '@frogpond/colors'
import {ProcessedMealType} from './types'
import {ContextMenu} from '@frogpond/context-menu'
import {MenuElementConfig} from 'react-native-ios-context-menu'

class MealNotFoundError extends Error {}

const styles = StyleSheet.create({
	today: {
		flex: 1,
		paddingLeft: 12,
		paddingVertical: 14,
	},
	toolbarText: {
		color: c.label,
	},
	toolbarSection: {
		flexDirection: 'row',
		alignItems: 'center',
	},
})

type Props = {
	date: Moment
	isOpen: boolean
	title?: string
	onMealSelection: (meal: ProcessedMealType) => void
	meals: ProcessedMealType[]
	selectedMeal: ProcessedMealType | undefined
}

export function FilterMenuToolbar({
	date,
	title,
	onMealSelection,
	meals,
	selectedMeal,
}: Props): JSX.Element {
	const handleMealSelection = useCallback(
		(mealLabel: string) => {
			let selectedMeal = meals.find((meal) => meal.label === mealLabel)
			if (!selectedMeal) {
				throw new MealNotFoundError(mealLabel)
			}
			onMealSelection(selectedMeal)
		},
		[onMealSelection, meals],
	)

	let actions: MenuElementConfig[] = useMemo(() => {
		return meals.map((meal) => {
			let icon =
				meal === selectedMeal
					? ({
							type: 'IMAGE_SYSTEM',
							imageValue: {
								systemName: 'checkmark.circle.fill',
								hierarchicalColor: c.systemBlue,
							},
					  } as const)
					: undefined

			return {
				actionKey: meal.label,
				actionTitle: meal.label,
				actionSubtitle: `${meal.starttime}—${meal.endtime}`,
				icon,
			}
		})
	}, [meals, selectedMeal])

	return (
		<Toolbar>
			<View style={[styles.toolbarSection, styles.today]}>
				<Text style={styles.toolbarText}>{date.format('MMM. Do')}</Text>
				{title ? <Text style={styles.toolbarText}> — {title}</Text> : null}
			</View>

			{meals.length > 1 ? (
				<ContextMenu
					actions={actions}
					disabled={false}
					isMenuPrimaryAction={true}
					onPressMenuItem={handleMealSelection}
					title="Today&rsquo;s Menus"
				>
					<Text>Today&rsquo;s Menus</Text>
				</ContextMenu>
			) : null}
		</Toolbar>
	)
}
