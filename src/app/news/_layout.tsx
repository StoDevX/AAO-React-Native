import React from 'react'
import {NativeTabs, Icon, Label} from 'expo-router/unstable-native-tabs'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import {Platform} from 'react-native'
import {Stack} from 'expo-router'

export default function NewsTabLayout() {
	return (
		<NativeTabs>
			<Stack.Screen options={{title: 'News'}} />

			<NativeTabs.Trigger name="index">
				<Label>St. Olaf</Label>
				{Platform.select({
					ios: <Icon sf="graduationcap.fill" />,
					android: <Icon src={<MaterialDesignIcons name="school" />} />,
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="mess">
				<Label>The Mess</Label>
				{Platform.select({
					ios: <Icon sf="newspaper.fill" />,
					android: (
						<Icon src={<MaterialDesignIcons name="newspaper-variant" />} />
					),
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="oleville">
				<Label>Oleville</Label>
				{Platform.select({
					ios: <Icon sf="face.smiling.fill" />,
					android: (
						<Icon src={<MaterialDesignIcons name="emoticon-happy" />} />
					),
				})}
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
