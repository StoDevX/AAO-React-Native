import React from 'react'
import {NativeTabs, Icon, Label} from 'expo-router/unstable-native-tabs'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import {Platform} from 'react-native'
import {Stack} from 'expo-router'

export default function TabLayout() {
	return (
		<NativeTabs>
			<Stack.Screen options={{title: 'Transportation'}} />

			<NativeTabs.Trigger name="index">
				<Label>Express Bus</Label>
				{Platform.select({
					ios: <Icon sf="bus.fill" />,
					android: <Icon src={<MaterialDesignIcons name="bus" />} />,
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="red-line">
				<Label>Red Line</Label>
				{Platform.select({
					ios: <Icon sf="bus.doubledecker.fill" />,
					android: <Icon src={<MaterialDesignIcons name="bus" />} />,
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="blue-line">
				<Label>Blue Line</Label>
				{Platform.select({
					ios: <Icon sf="bus.doubledecker.fill" />,
					android: <Icon src={<MaterialDesignIcons name="bus" />} />,
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="oles-go">
				<Label>Oles Go</Label>
				{Platform.select({
					ios: <Icon sf="car.fill" />,
					android: <Icon src={<MaterialDesignIcons name="car" />} />,
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="other-modes">
				<Label>Other Modes</Label>
				{Platform.select({
					ios: <Icon sf="moped.fill" />,
					android: <Icon src={<MaterialDesignIcons name="sail-boat" />} />,
				})}
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
