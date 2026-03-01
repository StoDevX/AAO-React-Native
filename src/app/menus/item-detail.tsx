import React from 'react'
import {MenuItemDetailView} from '@frogpond/food-menu/food-item-detail'
import {Stack} from 'expo-router'

export default function MenuItemDetailScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Nutrition'}} />
			<MenuItemDetailView />
		</>
	)
}
