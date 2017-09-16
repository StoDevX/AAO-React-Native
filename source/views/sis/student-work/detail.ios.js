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

function Title({job}: {job: JobType}) {
  return job.title || job.type
    ? <Section header="JOB">
        <Cell cellStyle="Subtitle" title={job.title} detail={job.type} />
      </Section>
    : null
}

function Contact({job}: {job: JobType}) {
  const contactName = getContactName(job).trim() || job.contactEmail
  return job.office || contactName
    ? <Section header="CONTACT">
        <Cell
          cellStyle="Subtitle"
          title={contactName}
          detail={job.office}
          accessory="DisclosureIndicator"
          onPress={() => email([job.contactEmail], null, null, job.title, '')}
        />
      </Section>
    : null
}

function Hours({job}: {job: JobType}) {
  const ending = job.hoursPerWeek == 'Full-time' ? '' : ' hrs/week'
  return job.timeOfHours && job.hoursPerWeek
    ? <Section header="HOURS">
        <Cell
          cellStyle="Subtitle"
          title={job.timeOfHours}
          detail={job.hoursPerWeek + ending}
        />
      </Section>
    : null
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

function Links({job}: {job: JobType}) {
  const links = getLinksFromJob(job)
  return links.length
    ? <Section header="LINKS">
        {links.map(url =>
          <Cell
            key={url}
            title={url}
            accessory="DisclosureIndicator"
            onPress={() => openUrl(url)}
          />,
        )}
      </Section>
    : null
}

function LastUpdated({when}: {when: string}) {
  return when
    ? <Text selectable={true} style={[styles.footer, styles.lastUpdated]}>
        Last updated:
        {' '}
        {moment(when, 'YYYY/MM/DD').calendar()}
        {'\n'}
        Powered by St. Olaf Student Employment job postings
      </Text>
    : null
}

export default function JobDetailView(props: {
  navigation: {state: {params: {job: JobType}}},
}) {
  const job = cleanJob(props.navigation.state.params.job)

  return (
    <ScrollView>
      <TableView>
        <Title job={job} />
        <Contact job={job} />
        <Hours job={job} />
        <Description job={job} />
        <Skills job={job} />
        <Comments job={job} />
        <Links job={job} />
      </TableView>
      <LastUpdated when={job.lastModified} />
    </ScrollView>
  )
}
JobDetailView.navigationOptions = ({navigation}) => {
  const {job} = navigation.state.params
  return {
    title: job.title,
  }
}
