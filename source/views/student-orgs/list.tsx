import * as React from 'react'

import {useStudentOrgs} from './query'
import type {StudentOrgType} from './types'

import {List, Row} from '../../components/list'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useNavigation} from '@react-navigation/native'

export function StudentOrgsView(): JSX.Element {
	return (
		<List
			groupByKey="category"
			query={useStudentOrgs()}
			renderItem={({item}) => <StudentOrgsRow item={item} />}
			searchInKeys={['name', 'description', 'category']}
		/>
	)
}

function StudentOrgsRow({item}: {item: StudentOrgType}) {
	let navigation = useNavigation()

	return (
		<Row
			item={{title: item.name, detail: item.category}}
			onPress={() => navigation.navigate('StudentOrgsDetail', {org: item})}
		/>
	)
}

export const Key = 'StudentOrgs'

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Student Orgs',
	headerLargeTitle: true,
	headerLargeTitleShadowVisible: false,
}
