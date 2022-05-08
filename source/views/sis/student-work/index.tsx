import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import {TabBarIcon} from '@frogpond/navigation-tabs'
import type {TopLevelViewPropsType} from '../../types'
import * as c from '@frogpond/colors'
import {ListSeparator, ListSectionHeader} from '@frogpond/lists'
import {NoticeView, LoadingView} from '@frogpond/notice'
import toPairs from 'lodash/toPairs'
import orderBy from 'lodash/orderBy'
import groupBy from 'lodash/groupBy'
import {toLaxTitleCase as titleCase} from '@frogpond/titlecase'
import {JobRow} from './job-row'
import {API} from '@frogpond/api'
import type {JobType} from './types'
import {fetch} from '@frogpond/fetch'

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.white,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

type Props = TopLevelViewPropsType

type State = {
	jobs: Array<{title: string; data: Array<JobType>}>
	loading: boolean
	refreshing: boolean
	error: boolean
}

export default class StudentWorkView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		tabBarLabel: 'Open Jobs',
		tabBarIcon: TabBarIcon('briefcase'),
	}

	state = {
		jobs: [],
		loading: true,
		refreshing: false,
		error: false,
	}

	componentDidMount() {
		this.fetchData().then(() => {
			this.setState(() => ({loading: false}))
		})
	}

	fetchData = async (reload?: boolean) => {
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
		this.setState(() => ({jobs: mapped}))
	}

	refresh = async (): Promise<void> => {
		this.setState(() => ({refreshing: true}))
		await this.fetchData(true)
		this.setState(() => ({refreshing: false}))
	}

	onPressJob = (job: JobType) => {
		this.props.navigation.navigate('JobDetailView', {job})
	}

	keyExtractor = (item: JobType, index: number) => index.toString()

	renderSectionHeader = ({section: {title}}: any) => (
		<ListSectionHeader title={title} />
	)

	renderItem = ({item}: {item: JobType}) => (
		<JobRow job={item} onPress={this.onPressJob} />
	)

	render() {
		if (this.state.error) {
			return <NoticeView text="Could not get open jobs." />
		}

		if (this.state.loading) {
			return <LoadingView />
		}

		return (
			<SectionList
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={
					<NoticeView text="There are no open job postings." />
				}
				contentContainerStyle={styles.contentContainer}
				keyExtractor={this.keyExtractor}
				onRefresh={this.refresh}
				refreshing={this.state.refreshing}
				renderItem={this.renderItem}
				renderSectionHeader={this.renderSectionHeader}
				sections={this.state.jobs}
				style={styles.listContainer}
			/>
		)
	}
}
