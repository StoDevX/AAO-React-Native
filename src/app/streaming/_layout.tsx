import React from 'react'
import {NativeTabs, Icon, Label} from 'expo-router/unstable-native-tabs'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import {Platform} from 'react-native'
import {Stack} from 'expo-router'

export default function StreamingTabLayout(): React.JSX.Element {
	return (
		<NativeTabs>
			<Stack.Screen options={{title: 'Streaming Media'}} />

			<NativeTabs.Trigger name="index">
				<Label>Streaming</Label>
				{Platform.select({
					ios: <Icon sf="video.fill" />,
					android: <Icon src={<MaterialDesignIcons name="camcorder" />} />,
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="webcams">
				<Label>Webcams</Label>
				{Platform.select({
					ios: <Icon sf="web.camera.fill" />,
					android: <Icon src={<MaterialDesignIcons name="webcam" />} />,
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="ksto">
				<Label>KSTO</Label>
				{Platform.select({
					ios: <Icon sf="radio.fill" />,
					android: <Icon src={<MaterialDesignIcons name="radio" />} />,
				})}
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="krlx">
				<Label>KRLX</Label>
				{Platform.select({
					ios: <Icon sf="mic.fill" />,
					android: <Icon src={<MaterialDesignIcons name="microphone" />} />,
				})}
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
