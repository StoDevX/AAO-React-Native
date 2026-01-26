import React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import {Platform} from 'react-native'
import {Stack} from 'expo-router'

export default function TabLayout() {
	return (
		<NativeTabs>
			<Stack.Screen options={{title: 'Transportation'}} />

			<NativeTabs.Trigger name="index">
				<NativeTabs.Trigger.Label>Express Bus</NativeTabs.Trigger.Label>
				{Platform.select({
					ios: <NativeTabs.Trigger.Icon sf="bus.fill" />,
					android: (
						<NativeTabs.Trigger.Icon src={<MaterialDesignIcons name="bus" />} />
					),
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="red-line">
				<NativeTabs.Trigger.Label>Red Line</NativeTabs.Trigger.Label>
				{Platform.select({
					ios: <NativeTabs.Trigger.Icon sf="bus.doubledecker.fill" />,
					android: (
						<NativeTabs.Trigger.Icon src={<MaterialDesignIcons name="bus" />} />
					),
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="blue-line">
				<NativeTabs.Trigger.Label>Blue Line</NativeTabs.Trigger.Label>
				{Platform.select({
					ios: <NativeTabs.Trigger.Icon sf="bus.doubledecker.fill" />,
					android: (
						<NativeTabs.Trigger.Icon src={<MaterialDesignIcons name="bus" />} />
					),
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="oles-go">
				<NativeTabs.Trigger.Label>Oles Go</NativeTabs.Trigger.Label>
				{Platform.select({
					ios: <NativeTabs.Trigger.Icon sf="car.fill" />,
					android: (
						<NativeTabs.Trigger.Icon src={<MaterialDesignIcons name="car" />} />
					),
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="other-modes">
				<NativeTabs.Trigger.Label>Other Modes</NativeTabs.Trigger.Label>
				{Platform.select({
					ios: <NativeTabs.Trigger.Icon sf="moped.fill" />,
					android: (
						<NativeTabs.Trigger.Icon
							src={<MaterialDesignIcons name="sail-boat" />}
						/>
					),
				})}
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
