import React from 'react'
import {NativeTabs, Icon, Label} from 'expo-router/unstable-native-tabs'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import {Platform} from 'react-native'
import {Stack} from 'expo-router'

export default function SisTabLayout(): React.JSX.Element {
	return (
		<NativeTabs>
			<Stack.Screen options={{title: 'SIS'}} />

			<NativeTabs.Trigger name="index">
				<Label>Balances</Label>
				{Platform.select({
					ios: <Icon sf="creditcard.fill" />,
					android: <Icon src={<MaterialDesignIcons name="credit-card" />} />,
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="student-work">
				<Label>Open Jobs</Label>
				{Platform.select({
					ios: <Icon sf="briefcase.fill" />,
					android: (
						<Icon src={<MaterialDesignIcons name="briefcase-search" />} />
					),
				})}
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
