import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import * as c from '@frogpond/colors'
import {ListSeparator, ListSectionHeader} from '@frogpond/lists'
import {NoticeView, LoadingView} from '@frogpond/notice'
import {toLaxTitleCase as titleCase} from '@frogpond/titlecase'
import toPairs from 'lodash/toPairs'
import orderBy from 'lodash/orderBy'
import groupBy from 'lodash/groupBy'

import {JobRow} from './job-row'
import {API} from '@frogpond/api'
import type {JobType} from './types'
import {fetch} from '@frogpond/fetch'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useNavigation} from '@react-navigation/native'

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.white,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

interface Jobs {
	title: string
	data: JobType[]
}

const StudentWorkView = (): JSX.Element => {
	let [jobs, setJobs] = React.useState<Jobs[]>([])
	let [loading, setLoading] = React.useState(true)
	let [refreshing, setRefreshing] = React.useState(false)
	let [error, setError] = React.useState(false)

	let navigation = useNavigation()

	React.useEffect(() => {
		fetchData().then(() => {
			setLoading(false)
		})
	}, [])

	let fetchData = async (reload?: boolean) => {
		try {
			let data: Array<JobType> = await fetch(API('/jobs'), {
				delay: reload ? 500 : 0,
			}).json()

			// force title-case on the job types, to prevent not-actually-duplicate headings
			let processed: Array<JobType> = data.map((job) => ({
				...job,
				type: titleCase(job.type),
			}))

			// Turns out that, for our data, we really just want to sort the categories
			// _backwards_ - that is, On-Campus Work Study should come before
			// Off-Campus Work Study, and the Work Studies should come before the
			// Summer Employments
			let sorters: Array<(job: JobType) => mixed> = [
				(j) => j.type, // sort any groups with the same sort index alphabetically
				(j) => j.office, // sort all jobs with the same office
				(j) => j.lastModified, // sort all jobs by date-last-modified
			]
			let ordered: Array<'desc' | 'asc'> = ['desc', 'asc', 'desc']
			let sorted = orderBy(processed, sorters, ordered)

			let grouped = groupBy(sorted, (j) => j.type)
			let mapped = toPairs(grouped).map(([title, data]) => ({
				title,
				data,
			}))
			setJobs(mapped)
		} catch (error) {
			setError(true)
		}
	}

	if (error) {
		return <NoticeView text="Could not get open jobs." />
	}

	if (loading) {
		return <LoadingView />
	}

	return (
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={<NoticeView text="There are no open job postings." />}
			contentContainerStyle={styles.contentContainer}
			keyExtractor={(_item: JobType, index: number) => index.toString()}
			onRefresh={async () => {
				setRefreshing(true)
				await fetchData(true)
				setRefreshing(false)
			}}
			refreshing={refreshing}
			renderItem={({item}: {item: JobType}) => (
				<JobRow
					job={item}
					onPress={(job: JobType) => {
						navigation.navigate('JobDetail', {job})
					}}
				/>
			)}
			renderSectionHeader={({section: {title}}: any) => (
				<ListSectionHeader title={title} />
			)}
			sections={jobs}
			style={styles.listContainer}
		/>
	)
}

export {StudentWorkView as View}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Open Jobs',
}
