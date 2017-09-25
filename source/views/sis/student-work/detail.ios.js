// @flow
import React from 'react'
import {Text, ScrollView, StyleSheet} from 'react-native'
import {email} from 'react-native-communications'
import {Cell, Section, TableView} from 'react-native-tableview-simple'
import moment from 'moment'
import openUrl from '../../components/open-url'
import * as c from '../../components/colors'
import type {JobType} from './types'
import {cleanJob, getContactName, getLinksFromJob} from './clean-job'
import {SelectableCell} from './selectable'

const styles = StyleSheet.create({
  lastUpdated: {
    paddingBottom: 20,
  },
  footer: {
    fontSize: 10,
    color: c.iosDisabledText,
    textAlign: 'center',
  },
})

function Information({job}: {job: JobType}) {
  const title = job.title ? <Cell cellStyle="Basic" title={job.title} /> : null

  const office = job.office
    ? <Cell cellStyle="RightDetail" title="Office" detail={job.office} />
    : null

  const contact = job.contactEmail
    ? <Cell
        cellStyle="RightDetail"
        title={'Contact'}
        detail={getContactName(job).trim() || job.contactEmail}
        accessory="DisclosureIndicator"
        onPress={() => email([job.contactEmail], null, null, job.title, '')}
      />
    : null

  const ending = job.hoursPerWeek == 'Full-time' ? '' : ' hrs/week'
  const hours = job.hoursPerWeek
    ? <Cell
        cellStyle="RightDetail"
        title={'Hours'}
        detail={job.hoursPerWeek + ending}
      />
    : null

  const amount = job.timeOfHours
    ? <Cell cellStyle="RightDetail" title={'Time'} detail={job.timeOfHours} />
    : null

  const modified = job.lastModified
    ? <Cell
        cellStyle="RightDetail"
        title="Modified"
        detail={moment(job.lastModified, 'YYYY/MM/DD').calendar()}
      />
    : null

  const allLinks = getLinksFromJob(job)
  const links = allLinks.length
    ? allLinks.map(url =>
        <Cell
          key={url}
          title={url}
          accessory="DisclosureIndicator"
          onPress={() => openUrl(url)}
        />,
      )
    : null

  return (
    <Section header="INFORMATION">
      {title}
      {office}
      {contact}
      {hours}
      {amount}
      {modified}
      {links}
    </Section>
  )
}

function Description({job}: {job: JobType}) {
  return job.description
    ? <Section header="DESCRIPTION">
        <SelectableCell text={job.description} />
      </Section>
    : null
}

function Skills({job}: {job: JobType}) {
  return job.skills
    ? <Section header="SKILLS">
        <SelectableCell text={job.skills} />
      </Section>
    : null
}

function Comments({job}: {job: JobType}) {
  return job.comments
    ? <Section header="COMMENTS">
        <SelectableCell text={job.comments} />
      </Section>
    : null
}

export default function JobDetailView(props: {
  navigation: {state: {params: {job: JobType}}},
}) {
  const job = cleanJob(props.navigation.state.params.job)

  return (
    <ScrollView>
      <TableView>
        <Information job={job} />
        <Description job={job} />
        <Skills job={job} />
        <Comments job={job} />
      </TableView>
      <Text selectable={true} style={[styles.footer, styles.lastUpdated]}>
        Powered by St. Olaf Student Employment job postings
      </Text>
    </ScrollView>
  )
}
JobDetailView.navigationOptions = ({navigation}) => {
  const {job} = navigation.state.params
  return {
    title: job.title,
  }
}
