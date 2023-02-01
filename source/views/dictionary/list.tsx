import * as React from 'react'

import {useDictionary} from './query'
import type {WordType} from './types'

import {List, Row} from '../../components/list'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useNavigation} from '@react-navigation/native'

export function DictionaryView(): JSX.Element {
	let query = useDictionary()

	return (
		<List
			filter={[]}
			groupBy="key"
			query={query}
			renderItem={({item}) => <DictionaryRow item={item} />}
			search={['word', 'definition']}
		/>
	)
}

function DictionaryRow({item}: {item: WordType}) {
	let navigation = useNavigation()

	return (
		<Row
			item={{title: item.word, detail: item.definition}}
			onPress={() => navigation.navigate('DictionaryDetail', {item})}
		/>
	)
}

export const Key = 'CampusDictionary'

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Campus Dictionary',
	headerLargeTitle: true,
	headerLargeTitleShadowVisible: false,
}
