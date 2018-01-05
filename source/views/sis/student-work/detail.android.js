// @flow
import * as React from 'react'
import {Text, View, ScrollView, StyleSheet} from 'react-native'
import {email} from 'react-native-communications'
import {Card} from '../../components/card'
import moment from 'moment'
import openUrl from '../../components/open-url'
import * as c from '../../components/colors'
import type {JobType} from './types'
import {cleanJob, getContactName, getLinksFromJob} from './clean-job'

const styles = StyleSheet.create({
  name: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 5,
    color: c.black,
    fontSize: 32,
    fontWeight: '300',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
    color: c.black,
    fontSize: 16,
    fontWeight: '300',
  },
  card: {
    marginBottom: 20,
  },
  cardBody: {
    color: c.black,
    paddingTop: 13,
    paddingBottom: 13,
    paddingLeft: 16,
    paddingRight: 16,
    fontSize: 16,
  },
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
  return job.title || job.type ? (
    <View>
      <Text style={styles.name}>{job.title}</Text>
      <Text style={styles.subtitle}>{job.type}</Text>
    </View>
  ) : null
}

function Contact({job}: {job: JobType}) {
  const contactName = getContactName(job).trim() || job.contactEmail
  return job.office || contactName ? (
    <Card header="Contact" style={styles.card}>
      <Text
        onPress={() => email([job.contactEmail], null, null, job.title, '')}
        style={styles.cardBody}
      >
        {contactName} {job.title ? `(${job.title})` : ''}
        {'\n'}
        {job.office}
      </Text>
    </Card>
  ) : null
}

function Hours({job}: {job: JobType}) {
  const ending = job.hoursPerWeek == 'Full-time' ? '' : ' hrs/week'
  return job.timeOfHours && job.hoursPerWeek ? (
    <Card header="Hours" style={styles.card}>
      <Text style={styles.cardBody}>
        {job.timeOfHours}
        {'\n'}
        {job.hoursPerWeek + ending}
      </Text>
    </Card>
  ) : null
}

function Description({job}: {job: JobType}) {
  return job.description ? (
    <Card header="Description" style={styles.card}>
      <Text style={styles.cardBody}>{job.description}</Text>
    </Card>
  ) : null
}

function Skills({job}: {job: JobType}) {
  return job.skills ? (
    <Card header="Skills" style={styles.card}>
      <Text style={styles.cardBody}>{job.skills}</Text>
    </Card>
  ) : null
}

function Comments({job}: {job: JobType}) {
  return job.comments ? (
    <Card header="Comments" style={styles.card}>
      <Text style={styles.cardBody}>{job.comments}</Text>
    </Card>
  ) : null
}

function Links({job}: {job: JobType}) {
  const links = getLinksFromJob(job)
  return links.length ? (
    <Card header="LINKS" style={styles.card}>
      {links.map(url => (
        <Text key={url} onPress={() => openUrl(url)} style={styles.cardBody}>
          {url}
        </Text>
      ))}
    </Card>
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
        <Title job={job} />
        <Contact job={job} />
        <Hours job={job} />
        <Description job={job} />
        <Skills job={job} />
        <Comments job={job} />
        <Links job={job} />
        <LastUpdated when={job.lastModified} />
      </ScrollView>
    )
  }
}
