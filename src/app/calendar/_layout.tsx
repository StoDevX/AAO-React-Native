import React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import {Platform} from 'react-native'
import {Stack} from 'expo-router'

export default function TabLayout() {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<NativeTabs.Trigger.Label>St. Olaf</NativeTabs.Trigger.Label>
				{Platform.select({
					ios: <NativeTabs.Trigger.Icon sf="graduationcap.fill" />,
					android: (
						<NativeTabs.Trigger.Icon
							src={<MaterialDesignIcons name="school" />}
						/>
					),
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="oleville">
				<NativeTabs.Trigger.Label>Oleville</NativeTabs.Trigger.Label>
				{Platform.select({
					ios: <NativeTabs.Trigger.Icon sf="face.smiling.fill" />,
					android: (
						<NativeTabs.Trigger.Icon
							src={<MaterialDesignIcons name="emoticon-happy" />}
						/>
					),
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="northfield">
				<NativeTabs.Trigger.Label>Northfield</NativeTabs.Trigger.Label>
				{Platform.select({
					ios: <NativeTabs.Trigger.Icon sf="signpost.right.and.left.fill" />,
					android: (
						<NativeTabs.Trigger.Icon
							src={<MaterialDesignIcons name="sign-pole" />}
						/>
					),
				})}
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
