/**
 * @flow
 *
 * All About Olaf
 * Student Work page
 */

import React from 'react'
import {StyleSheet, Text} from 'react-native'
import {TabBarIcon} from '../../components/tabbar-icon'
import type {TopLevelViewPropsType} from '../../types'
import * as c from '../../components/colors'
import SimpleListView from '../../components/listview'
import {ListSeparator, ListSectionHeader} from '../../components/list'
import {tracker} from '../../../analytics'
import bugsnag from '../../../bugsnag'
import {NoticeView} from '../../components/notice'
import LoadingView from '../../components/loading'
import delay from 'delay'
import size from 'lodash/size'
import sortBy from 'lodash/sortBy'
import groupBy from 'lodash/groupBy'
import {toLaxTitleCase as titleCase} from 'titlecase'
import {JobRow} from './job-row'
import type {JobType} from './types'

const jobsUrl =
  'https://www.stolaf.edu/apps/stuwork/index.cfm?fuseaction=getall&nostructure=1'

const jobSort = new Map([
  ['On-campus Work Study', 1],
  ['Off-campus Community Service Work Study', 2],
  ['On-campus Summer Employment', 3],
  ['Off-campus Summer Employment', 4],
])

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: c.white,
  },
})

export default class StudentWorkView extends React.Component {
  static navigationOptions = {
    headerBackTitle: 'Open Jobs',
    tabBarLabel: 'Open Jobs',
    tabBarIcon: TabBarIcon('briefcase'),
  }

  state: {
    jobs: {[key: string]: JobType[]},
    loading: boolean,
    refreshing: boolean,
    error: boolean,
  } = {
    jobs: {},
    loading: false,
    refreshing: false,
    error: false,
  }

  componentWillMount() {
    this.refresh()
  }

  props: TopLevelViewPropsType

  fetchData = async () => {
    try {
      const data: {[key: string]: JobType[]} = await fetchJson(jobsUrl)

      // force title-case on the job types, to prevent not-actually-duplicate headings
      const processed = data.map(job => ({...job, type: titleCase(job.type)})

      // We have predefined orders for some job types, but we want all
      // unknown types to show up at the end of the view, so we make
      // them sort as Infinity
      const sorted = sortBy(data, [
        j => jobSort.get(j.type) || Infinity, // apply predefined group orderings
        j => j.type, // sort any groups with the same sort index alphabetically
        j => j.lastModified, // sort all jobs by date-last-modified
      ])

      this.setState(() => ({jobs: groupBy(sorted, j => j.type)}))
    } catch (err) {
      tracker.trackException(err.message)
      bugsnag.notify(err)
      this.setState(() => ({error: true}))
      console.error(err)
    }

    this.setState(() => ({loading: true}))
  }

  refresh = async () => {
    const start = Date.now()
    this.setState(() => ({refreshing: true}))

    await this.fetchData()

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    const elapsed = start - Date.now()
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }
    this.setState(() => ({refreshing: false}))
  }

  onPressJob = (title: string, job: JobType) => {
    this.props.navigation.navigate('JobDetailView', {job})
  }

  renderSeparator = (sectionId: string, rowId: string) => {
    return <ListSeparator key={`${sectionId}-${rowId}`} />
  }

  renderSectionHeader = (data: any, id: string) => {
    return <ListSectionHeader title={id} />
  }

  render() {
    if (this.state.error) {
      return <Text selectable={true}>{this.state.error}</Text>
    }

    if (!this.state.loading) {
      return <LoadingView />
    }

    if (!size(this.state.jobs)) {
      return <NoticeView text="There are no open job postings." />
    }

    return (
      <SimpleListView
        style={styles.listContainer}
        data={this.state.jobs}
        renderSectionHeader={this.renderSectionHeader}
        renderSeparator={this.renderSeparator}
        refreshing={this.state.refreshing}
        onRefresh={this.refresh}
      >
        {(job: JobType) =>
          <JobRow onPress={() => this.onPressJob(job.title, job)} job={job} />}
      </SimpleListView>
    )
  }
}
