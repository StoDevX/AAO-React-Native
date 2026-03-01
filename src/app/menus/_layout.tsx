import React from 'react'
import {NativeTabs, Icon, Label} from 'expo-router/unstable-native-tabs'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import {Platform} from 'react-native'
import {Stack} from 'expo-router'

export default function MenusTabLayout() {
	return (
		<NativeTabs>
			<Stack.Screen options={{title: 'Menus'}} />

			<NativeTabs.Trigger name="index">
				<Label>Stav Hall</Label>
				{Platform.select({
					ios: <Icon sf="fork.knife" />,
					android: <Icon src={<MaterialDesignIcons name="food-apple" />} />,
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="the-cage">
				<Label>The Cage</Label>
				{Platform.select({
					ios: <Icon sf="cup.and.saucer.fill" />,
					android: <Icon src={<MaterialDesignIcons name="coffee" />} />,
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="the-pause">
				<Label>The Pause</Label>
				{Platform.select({
					ios: <Icon sf="pawprint.fill" />,
					android: <Icon src={<MaterialDesignIcons name="paw" />} />,
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="carleton">
				<Label>Carleton</Label>
				{Platform.select({
					ios: <Icon sf="list.bullet" />,
					android: <Icon src={<MaterialDesignIcons name="menu" />} />,
				})}
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
