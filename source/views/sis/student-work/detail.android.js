// @flow
import React from 'react'
import {Text, View, ScrollView, StyleSheet} from 'react-native'
import {fastGetTrimmedText} from '../../../lib/html'
import {Card} from '../../components/card'
import moment from 'moment'
import openUrl from '../../components/open-url'
import * as c from '../../components/colors'
import type {JobType} from './types'
import {openEmail, fixupEmailFormat} from './email'
import {parseLinks} from './links'

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
  const trimmedTitle = fastGetTrimmedText(title)
  const trimmedDetail = fastGetTrimmedText(category)
  return trimmedTitle || trimmedDetail
    ? <View>
        <Text style={styles.name}>{trimmedTitle}</Text>
        <Text style={styles.subtitle}>{trimmedDetail}</Text>
      </View>
    : null
}

function renderContact(
  title: string,
  office: string,
  contactName: string,
  email: string,
) {
  office = fastGetTrimmedText(office)
  email = fixupEmailFormat(email)
  contactName =
    fastGetTrimmedText(contactName) || email
  return (office || contactName)
    ? <Card header="Contact" style={styles.card}>
        <Text
          style={styles.cardBody}
          onPress={() => openEmail(email, title)}
        >
          {contactName} {email ? `(${email})` : ''}
          {'\n'}
          {office}
        </Text>
      </Card>
    : null
}

function renderHours(timeOfHours: string, hoursPerWeek: string) {
  const time = fastGetTrimmedText(timeOfHours)
  const hours = fastGetTrimmedText(hoursPerWeek)
  const ending = hours == 'Full-time' ? '' : ' hrs/week'
  return time && hours
    ? <Card header="Hours" style={styles.card}>
        <Text style={styles.cardBody}>
          {time}
          {'\n'}
          {hoursPerWeek + ending}
        </Text>
      </Card>
    : null
}

function renderDescription(description: string) {
  const trimmedDescription = description.replace(/\t/g, ' ')
  return trimmedDescription
    ? <Card header="Description" style={styles.card}>
        <Text style={styles.cardBody}>
          {trimmedDescription}
        </Text>
      </Card>
    : null
}

function renderSkills(skills: string) {
  const trimmedSkills = skills.replace(/\t/g, ' ')
  return trimmedSkills
    ? <Card header="Skills" style={styles.card}>
        <Text style={styles.cardBody}>
          {trimmedSkills}
        </Text>
      </Card>
    : null
}

function renderComments(comments: string) {
  const trimmedComments = comments.replace(/\t/g, ' ')
  return trimmedComments
    ? <Card header="Comments" style={styles.card}>
        <Text style={styles.cardBody}>
          {trimmedComments}
        </Text>
      </Card>
    : null
}

function renderLinks(links: string[]) {
  return links.length
    ? <Card header="LINKS" style={styles.card}>
        {links.map((url, i) => (
          <Text
            key={i}
            style={styles.cardBody}
            onPress={() =>
              openUrl(/^https?:\/\//.test(url) ? url : `http://${url}`)}
          >
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
  const title = job.title.trim()
  const description = job.description.trim()
  const office = job.office.trim()
  const type = job.type.trim()
  const comments = job.comments
  const skills = job.skills
  const hoursPerWeek = job.hoursPerWeek.trim()
  const timeOfHours = job.timeOfHours.toString() || ''
  const lastModified = job.lastModified.trim()
  const firstName = job.contactFirstName.trim()
  const lastName = job.contactLastName.trim()
  const name = `${firstName} ${lastName}`
  const contactEmail = job.contactEmail.trim()

  // Clean up returns, newlines, tabs, and misc symbols...
  // ...and search for application links in the text
  const links = [
    ...parseLinks(fastGetTrimmedText(description)),
    ...parseLinks(fastGetTrimmedText(comments)),
    ...parseLinks(fastGetTrimmedText(skills)),
  ]

  return (
    <ScrollView>
      {renderTitle(title, type)}
      {renderContact(title, office, name, contactEmail)}
      {renderHours(timeOfHours, hoursPerWeek)}
      {renderDescription(description)}
      {renderSkills(skills)}
      {renderComments(comments)}
      {renderLinks(links)}
      {renderLastUpdated(lastModified)}
    </ScrollView>
  )
}
