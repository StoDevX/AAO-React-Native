import * as React from 'react'
import {Platform} from 'react-native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {
	MaterialIcon,
	IosIcon,
	createTabNavigator,
	type Tab,
} from '@frogpond/navigation-tabs'

import * as newsImages from '../../../images/news-sources/index'
import {NewsList} from './news-list'
import {useNamedNewsSource} from './query'

const StOlafNewsView = () => (
	<NewsList
		query={useNamedNewsSource('stolaf')}
		thumbnail={newsImages.stolaf}
	/>
)
const MessNewsView = () => (
	<NewsList query={useNamedNewsSource('mess')} thumbnail={newsImages.mess} />
)
const OlevilleNewsView = () => (
	<NewsList
		query={useNamedNewsSource('oleville')}
		thumbnail={newsImages.oleville}
	/>
)

type Params = {
	StOlafNewsView: undefined
	MessNewsView: undefined
	OlevilleNewsView: undefined
}

const tabs: Tab<Params>[] = [
	{
		name: 'StOlafNewsView',
		component: StOlafNewsView,
		tabBarLabel: 'St. Olaf',
		tabBarIcon: Platform.select({
			ios: IosIcon('school'),
			android: MaterialIcon('school'),
		}),
	},
	{
		name: 'MessNewsView',
		component: MessNewsView,
		tabBarLabel: 'The Mess',
		tabBarIcon: Platform.select({
			ios: IosIcon('newspaper'),
			android: MaterialIcon('newspaper-variant'),
		}),
	},
	{
		name: 'OlevilleNewsView',
		component: OlevilleNewsView,
		tabBarLabel: 'Oleville',
		tabBarIcon: Platform.select({
			ios: IosIcon('happy'),
			android: MaterialIcon('emoticon-happy'),
		}),
	},
]

export type NavigationParams = undefined
export const View = createTabNavigator<Params>(tabs)
export const NavigationKey = 'News'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'News',
}
