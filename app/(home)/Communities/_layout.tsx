import React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'
import {Stack} from 'expo-router'
import {useRedditPreferences} from '../../../source/views/reddit/store'

export default function CommunitiesLayout(): React.ReactNode {
	const {variant, setVariant} = useRedditPreferences()

	return (
		<>
			<Stack.Title>Communities</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Menu title="Display Mode">
					<Stack.Toolbar.Icon
						sf={variant === 'A' ? 'list.bullet' : 'rectangle.grid.1x2'}
					/>
					<Stack.Toolbar.MenuAction
						icon="list.bullet"
						isOn={variant === 'A'}
						onPress={() => setVariant('A')}
					>
						Compact List
					</Stack.Toolbar.MenuAction>
					<Stack.Toolbar.MenuAction
						icon="rectangle.grid.1x2"
						isOn={variant === 'C'}
						onPress={() => setVariant('C')}
					>
						Card Feed
					</Stack.Toolbar.MenuAction>
				</Stack.Toolbar.Menu>
			</Stack.Toolbar>

			<NativeTabs>
				<NativeTabs.Trigger name="index">
					<NativeTabs.Trigger.Icon sf="person.2.fill" />
					<NativeTabs.Trigger.Label>r/stolaf</NativeTabs.Trigger.Label>
				</NativeTabs.Trigger>
				<NativeTabs.Trigger name="carleton">
					<NativeTabs.Trigger.Icon sf="building.columns.fill" />
					<NativeTabs.Trigger.Label>r/carletoncollege</NativeTabs.Trigger.Label>
				</NativeTabs.Trigger>
			</NativeTabs>
		</>
	)
}
