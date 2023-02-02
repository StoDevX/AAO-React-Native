import * as React from 'react'

import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {List} from '../../../components/list'
import {JobRow} from './job-row'
import {useStudentWorkPostings} from './query'
import type {JobType} from './types'

const StudentWorkView = (): JSX.Element => {
	let navigation = useNavigation()

	return (
		<List
			groupByKey="type"
			query={useStudentWorkPostings()}
			renderItem={({item}) => (
				<JobRow
					job={item}
					onPress={(job: JobType) => navigation.navigate('JobDetail', {job})}
				/>
			)}
			searchInKeys={['title', 'description', 'timeline', 'type']}
		/>
	)
}

export {StudentWorkView as View}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Open Jobs',
	headerLargeTitle: true,
	headerLargeTitleShadowVisible: false,
}
