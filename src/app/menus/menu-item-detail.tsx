import * as React from 'react'
import {Stack} from 'expo-router'
import {MenuItemDetailView} from '../../../modules/food-menu/food-item-detail'

export default function MenuItemDetailRoute(): React.JSX.Element {
	return (
		<>
			<Stack.Screen options={{title: 'Nutrition'}} />
			<MenuItemDetailView />
		</>
	)
}
