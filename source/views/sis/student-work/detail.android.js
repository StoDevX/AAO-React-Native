// @flow
import React from 'react'
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

function renderTitle(title: string, category: string) {
  return title || category
    ? <View>
        <Text style={styles.name}>{title}</Text>
        <Text style={styles.subtitle}>{category}</Text>
      </View>
    : null
}

function renderContact(
  jobTitle: string,
  office: string,
  contactName: string,
  emailAddress: string,
) {
  contactName = contactName || email
  return office || contactName
    ? <Card header="Contact" style={styles.card}>
        <Text
          style={styles.cardBody}
          onPress={() => email([emailAddress], null, null, jobTitle, '')}
        >
          {contactName} {emailAddress ? `(${emailAddress})` : ''}
          {'\n'}
          {office}
        </Text>
      </Card>
    : null
}

function renderHours(timeOfHours: string, hoursPerWeek: string) {
  const ending = hoursPerWeek == 'Full-time' ? '' : ' hrs/week'
  return timeOfHours && hoursPerWeek
    ? <Card header="Hours" style={styles.card}>
        <Text style={styles.cardBody}>
          {timeOfHours}
          {'\n'}
          {hoursPerWeek + ending}
        </Text>
      </Card>
    : null
}

function renderDescription(description: string) {
  return description
    ? <Card header="Description" style={styles.card}>
        <Text style={styles.cardBody}>
          {description}
        </Text>
      </Card>
    : null
}

function renderSkills(skills: string) {
  return skills
    ? <Card header="Skills" style={styles.card}>
        <Text style={styles.cardBody}>
          {skills}
        </Text>
      </Card>
    : null
}

function renderComments(comments: string) {
  return comments
    ? <Card header="Comments" style={styles.card}>
        <Text style={styles.cardBody}>
          {comments}
        </Text>
      </Card>
    : null
}

function renderLinks(links: string[]) {
  return links.length
    ? <Card header="LINKS" style={styles.card}>
        {links.map((url, i) => (
          <Text key={i} style={styles.cardBody} onPress={() => openUrl(url)}>
            {url}
          </Text>
        ))}
      </Card>
    : null
}

function renderLastUpdated(lastModified: string) {
  return lastModified
    ? <Text selectable={true} style={[styles.footer, styles.lastUpdated]}>
        Last updated:
        {' '}
        {moment(lastModified, 'YYYY/MM/DD').calendar()}
      </Text>
    : null
}

export default function JobDetailView({job}: {job: JobType}) {
  const cleaned = cleanJob(job)
  const contactName = getContactName(cleaned)
  const links = getLinksFromJob(cleaned)
  const {
    title,
    type,
    office,
    contactEmail,
    timeOfHours,
    hoursPerWeek,
    description,
    skills,
    comments,
    lastModified,
  } = cleaned

  return (
    <ScrollView>
      {renderTitle(title, type)}
      {renderContact(title, office, contactName, contactEmail)}
      {renderHours(timeOfHours, hoursPerWeek)}
      {renderDescription(description)}
      {renderSkills(skills)}
      {renderComments(comments)}
      {renderLinks(links)}
      {renderLastUpdated(lastModified)}
    </ScrollView>
  )
}
