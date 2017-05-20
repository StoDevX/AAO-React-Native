// @flow
import React from 'react'
import {Text, ScrollView, StyleSheet} from 'react-native'
import {fastGetTrimmedText} from '../../../lib/html'
import {Cell, Section, TableView} from 'react-native-tableview-simple'
import moment from 'moment'
import openUrl from '../../components/open-url'
import Communications from 'react-native-communications'
import * as c from '../../components/colors'
import type {JobType} from './types'

const styles = StyleSheet.create({
  selectable: {
    paddingVertical: 10,
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
    ? <Section header="JOB">
        <Cell
          cellStyle="Subtitle"
          title={trimmedTitle}
          detail={trimmedDetail}
        />
      </Section>
    : null
}

function renderContact(
  title: string,
  office: string,
  contact: string,
  email: string,
) {
  const trimmedOffice = fastGetTrimmedText(office)
  const trimmedContact =
    fastGetTrimmedText(contact) || email
  return trimmedOffice || trimmedContact
    ? <Section header="CONTACT">
        <Cell
          cellStyle="Subtitle"
          title={trimmedContact}
          detail={trimmedOffice}
          accessory="DisclosureIndicator"
          onPress={() => openEmail(email, title)}
        />
      </Section>
    : null
}

function renderHours(timeOfHours: string, hoursPerWeek: string) {
  const time = fastGetTrimmedText(timeOfHours)
  const hours = fastGetTrimmedText(hoursPerWeek)
  const ending = hours == 'Full-time' ? '' : ' hrs/week'
  return time && hours
    ? <Section header="HOURS">
        <Cell
          cellStyle="Subtitle"
          title={time}
          detail={hoursPerWeek + ending}
        />
      </Section>
    : null
}

function renderDescription(description: string) {
  const trimmedDescription = description.replace(/\t/g, ' ')
  return trimmedDescription
    ? <Section header="DESCRIPTION">
        <Cell
          cellContentView={
            <Text selectable={true} style={styles.selectable}>
              {trimmedDescription}
            </Text>
          }
        />
      </Section>
    : null
}

function renderSkills(skills: string) {
  const trimmedSkills = skills.replace(/\t/g, ' ')
  return trimmedSkills
    ? <Section header="SKILLS">
        <Cell
          cellContentView={
            <Text selectable={true} style={styles.selectable}>
              {trimmedSkills}
            </Text>
          }
        />
      </Section>
    : null
}

function renderComments(comments: string) {
  const trimmedComments = comments.replace(/\t/g, ' ')
  return trimmedComments
    ? <Section header="COMMENTS">
        <Cell
          cellContentView={
            <Text selectable={true} style={styles.selectable}>
              {trimmedComments}
            </Text>
          }
        />
      </Section>
    : null
}

function renderLinks(links: string[]) {
  return links.length
    ? <Section header="LINKS">
        {links.map((url, i) => (
          <Cell
            key={i}
            cellStyle="Title"
            title={url}
            accessory="DisclosureIndicator"
            onPress={() =>
              openUrl(/^https?:\/\//.test(url) ? url : `http://${url}`)}
          />
        ))}
      </Section>
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

function fixupEmailFormat(email: string) {
  if (!/@/.test(email)) {
    // No @ in address ... e.g. smith
    return `${email}@stolaf.edu`
  } else if (/@$/.test(email)) {
    // @ at end ... e.g. smith@
    return `${email}stolaf.edu`
  } else {
    // Defined address ... e.g. smith@stolaf.edu
    return email
  }
}

function openEmail(email: string, subject: string) {
  let address = fixupEmailFormat(email)
  Communications.email([address], null, null, subject, '')
}

function parseLinks(data: string) {
  const allLinks = data.split(' ')
  if (!allLinks.length) {
    return []
  }
  return allLinks.filter(w => /^https?:\/\//.test(w))
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
      <TableView>
        {renderTitle(title, type)}
        {renderContact(title, office, name, contactEmail)}
        {renderHours(timeOfHours, hoursPerWeek)}
        {renderDescription(description)}
        {renderSkills(skills)}
        {renderComments(comments)}
        {renderLinks(links)}
      </TableView>
      {renderLastUpdated(lastModified)}
    </ScrollView>
  )
}
