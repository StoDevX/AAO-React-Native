// @flow
/**
 * All About Olaf
 * Student Work page
 */

import React from 'react'
import {StyleSheet, Platform, Text} from 'react-native'
import * as c from '../components/colors'
import SimpleListView from '../components/listview'
import {ListSeparator, ListSectionHeader} from '../components/list'
import {tracker} from '../../analytics'
import bugsnag from '../../bugsnag'
import {NoticeView} from '../components/notice'
import LoadingView from '../components/loading'
import delay from 'delay'
import size from 'lodash/size'
import sortBy from 'lodash/sortBy'
import groupBy from 'lodash/groupBy'
import {JobRow} from './student-work/job-row'
import type {JobType} from './student-work/types'

const jobsUrl =
  'https://www.stolaf.edu/apps/stuwork/index.cfm?fuseaction=getall&nostructure=1'

const headerHeight = Platform.OS === 'ios' ? 33 : 41

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
  rowSectionHeader: {
    height: headerHeight,
  },
})

export default class StudentWorkView extends React.Component {
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

  fetchData = async () => {
    try {
      const data: {[key: string]: JobType[]} = await fetchJson(jobsUrl)

      const sorted = sortBy(data, [
        j => jobSort.get(j.type) || Infinity,
        j => j.lastModified,
      ])

      const grouped = groupBy(sorted, j => j.type)
      this.setState(() => ({jobs: grouped}))
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
    this.props.navigator.push({
      id: 'JobDetailView',
      index: this.props.route.index + 1,
      title: title,
      backButtonTitle: 'Jobs',
      props: {job},
    })
  }

  renderSeparator = (sectionId: string, rowId: string) => {
    return <ListSeparator key={`${sectionId}-${rowId}`} />
  }

  renderSectionHeader = (data: any, id: string) => {
    return <ListSectionHeader style={styles.rowSectionHeader} title={id} />
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
        forceBottomInset={true}
        data={this.state.jobs}
        renderSectionHeader={this.renderSectionHeader}
        renderSeparator={this.renderSeparator}
        refreshing={this.state.refreshing}
        onRefresh={this.refresh}
      >
        {(job: JobType) => (
          <JobRow onPress={() => this.onPressJob(job.title, job)} job={job} />
        )}
      </SimpleListView>
    )
  }
}
