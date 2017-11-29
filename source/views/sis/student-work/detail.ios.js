// @flow
import * as React from 'react'
import {Text, ScrollView, StyleSheet} from 'react-native'
import {email} from 'react-native-communications'
import {Cell, Section, TableView} from 'react-native-tableview-simple'
import moment from 'moment'
import openUrl from '../../components/open-url'
import * as c from '../../components/colors'
import type {JobType} from './types'
import {cleanJob, getContactName, getLinksFromJob} from './clean-job'
import {SelectableCell} from './selectable'
import glamorous from 'glamorous-native'

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

const Title = glamorous.text({
  fontSize: 36,
  textAlign: 'center',
  marginHorizontal: 18,
  marginVertical: 10,
})

function Information({job}: {job: JobType}) {
  const office = job.office ? (
    <Cell cellStyle="LeftDetail" detail="Office" title={job.office} />
  ) : null

  const contact = job.contactEmail ? (
    <Cell
      accessory="DisclosureIndicator"
      cellStyle="LeftDetail"
      detail={'Contact'}
      onPress={() => email([job.contactEmail], null, null, job.title, '')}
      title={getContactName(job).trim() || job.contactEmail}
    />
  ) : null

  const ending = job.hoursPerWeek == 'Full-time' ? '' : ' hrs/week'
  const hours = job.hoursPerWeek ? (
    <Cell
      cellStyle="LeftDetail"
      detail={'Hours'}
      title={job.hoursPerWeek + ending}
    />
  ) : null

  const amount = job.timeOfHours ? (
    <Cell
      cellStyle="LeftDetail"
      detail={'Time of Day'}
      title={job.timeOfHours}
    />
  ) : null

  const category = job.type ? (
    <Cell cellStyle="LeftDetail" detail={'Category'} title={job.type} />
  ) : null

  return (
    <Section header="INFORMATION">
      {office}
      {contact}
      {hours}
      {amount}
      {category}
    </Section>
  )
}

function Description({job}: {job: JobType}) {
  return job.description ? (
    <Section header="DESCRIPTION">
      <SelectableCell text={job.description} />
    </Section>
  ) : null
}

function Skills({job}: {job: JobType}) {
  return job.skills ? (
    <Section header="SKILLS">
      <SelectableCell text={job.skills} />
    </Section>
  ) : null
}

function Comments({job}: {job: JobType}) {
  return job.comments ? (
    <Section header="COMMENTS">
      <SelectableCell text={job.comments} />
    </Section>
  ) : null
}

function Links({job}: {job: JobType}) {
  const links = getLinksFromJob(job)
  return links.length ? (
    <Section header="LINKS">
      {links.map(url => (
        <Cell
          key={url}
          accessory="DisclosureIndicator"
          onPress={() => openUrl(url)}
          title={url}
        />
      ))}
    </Section>
  ) : null
}

function LastUpdated({when}: {when: string}) {
  return when ? (
    <Text selectable={true} style={[styles.footer, styles.lastUpdated]}>
      Last updated: {moment(when, 'YYYY/MM/DD').calendar()}
      {'\n'}
      Powered by St. Olaf Student Employment job postings
    </Text>
  ) : null
}

type Props = {
  navigation: {state: {params: {job: JobType}}},
}

export class JobDetailView extends React.PureComponent<Props> {
  static navigationOptions = ({navigation}) => {
    const {job} = navigation.state.params
    return {
      title: job.title,
    }
  }

  render() {
    const job = cleanJob(this.props.navigation.state.params.job)

    return (
      <ScrollView>
        <Title selectable={true}>{job.title}</Title>
        <TableView>
          <Information job={job} />
          <Description job={job} />
          <Skills job={job} />
          <Comments job={job} />
          <Links job={job} />
        </TableView>
        <LastUpdated when={job.lastModified} />
      </ScrollView>
    )
  }
}
