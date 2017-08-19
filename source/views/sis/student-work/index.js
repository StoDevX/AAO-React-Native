/**
 * @flow
 *
 * All About Olaf
 * Student Work page
 */

import React from 'react'
import {StyleSheet, Text, SectionList} from 'react-native'
import {TabBarIcon} from '../../components/tabbar-icon'
import type {TopLevelViewPropsType} from '../../types'
import * as c from '../../components/colors'
import {ListSeparator, ListSectionHeader} from '../../components/list'
import {tracker} from '../../../analytics'
import bugsnag from '../../../bugsnag'
import {NoticeView} from '../../components/notice'
import LoadingView from '../../components/loading'
import delay from 'delay'
import toPairs from 'lodash/toPairs'
import orderBy from 'lodash/orderBy'
import groupBy from 'lodash/groupBy'
import {toLaxTitleCase as titleCase} from 'titlecase'
import {JobRow} from './job-row'
import type {JobType} from './types'

const jobsUrl =
  'https://www.stolaf.edu/apps/stuwork/index.cfm?fuseaction=getall&nostructure=1'

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: c.white,
  },
})

export default class StudentWorkView extends React.PureComponent {
  static navigationOptions = {
    headerBackTitle: 'Open Jobs',
    tabBarLabel: 'Open Jobs',
    tabBarIcon: TabBarIcon('briefcase'),
  }

  props: TopLevelViewPropsType

  state: {
    jobs: Array<{title: string, data: Array<JobType>}>,
    loaded: boolean,
    refreshing: boolean,
    error: boolean,
  } = {
    jobs: [],
    loaded: false,
    refreshing: false,
    error: false,
  }

  componentWillMount() {
    this.refresh()
  }

  fetchData = async () => {
    try {
      const data: Array<JobType> = await fetchJson(jobsUrl)

      // force title-case on the job types, to prevent not-actually-duplicate headings
      const processed = data.map(job => ({...job, type: titleCase(job.type)}))

      // Turns out that, for our data, we really just want to sort the categories
      // _backwards_ - that is, On-Campus Work Study should come before
      // Off-Campus Work Study, and the Work Studies should come before the
      // Summer Employments
      const sorted = orderBy(
        processed,
        [
          j => j.type, // sort any groups with the same sort index alphabetically
          j => j.office, // sort all jobs with the same office
          j => j.lastModified, // sort all jobs by date-last-modified
        ],
        ['desc', 'asc'],
      )

      const grouped = groupBy(sorted, j => j.type)
      const mapped = toPairs(grouped).map(([title, data]) => ({title, data}))
      this.setState(() => ({jobs: mapped}))
    } catch (err) {
      tracker.trackException(err.message)
      bugsnag.notify(err)
      this.setState(() => ({error: true}))
      console.error(err)
    }

    this.setState(() => ({loaded: true}))
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

  onPressJob = (job: JobType) => {
    this.props.navigation.navigate('JobDetailView', {job})
  }

  keyExtractor = (item: JobType, index: number) => index.toString()

  renderSectionHeader = ({section: {title}}: any) =>
    <ListSectionHeader title={title} />

  renderItem = ({item}: {item: JobType}) =>
    <JobRow job={item} onPress={this.onPressJob} />

  render() {
    if (this.state.error) {
      return <Text selectable={true}>{this.state.error}</Text>
    }

    if (!this.state.loaded) {
      return <LoadingView />
    }

    return (
      <SectionList
        ListEmptyComponent={
          <NoticeView text="There are no open job postings." />
        }
        keyExtractor={this.keyExtractor}
        style={styles.listContainer}
        sections={(this.state.jobs: any)}
        renderSectionHeader={this.renderSectionHeader}
        ItemSeparatorComponent={ListSeparator}
        refreshing={this.state.refreshing}
        onRefresh={this.refresh}
        renderItem={this.renderItem}
      />
    )
  }
}
