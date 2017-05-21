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
  return title || category
    ? <Section header="JOB">
        <Cell cellStyle="Subtitle" title={title} detail={category} />
      </Section>
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
    ? <Section header="CONTACT">
        <Cell
          cellStyle="Subtitle"
          title={contactName}
          detail={office}
          accessory="DisclosureIndicator"
          onPress={() => email([emailAddress], null, null, jobTitle, '')}
        />
      </Section>
    : null
}

function renderHours(timeOfHours: number | string, hoursPerWeek: string) {
  const ending = hoursPerWeek == 'Full-time' ? '' : ' hrs/week'
  return timeOfHours && hoursPerWeek
    ? <Section header="HOURS">
        <Cell
          cellStyle="Subtitle"
          title={timeOfHours}
          detail={hoursPerWeek + ending}
        />
      </Section>
    : null
}

function renderDescription(description: string) {
  return description
    ? <Section header="DESCRIPTION">
        <Cell
          cellContentView={
            <Text selectable={true} style={styles.selectable}>
              {description}
            </Text>
          }
        />
      </Section>
    : null
}

function renderSkills(skills: string) {
  return skills
    ? <Section header="SKILLS">
        <Cell
          cellContentView={
            <Text selectable={true} style={styles.selectable}>
              {skills}
            </Text>
          }
        />
      </Section>
    : null
}

function renderComments(comments: string) {
  return comments
    ? <Section header="COMMENTS">
        <Cell
          cellContentView={
            <Text selectable={true} style={styles.selectable}>
              {comments}
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
            onPress={() => openUrl(url)}
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
      <TableView>
        {renderTitle(title, type)}
        {renderContact(title, office, contactName, contactEmail)}
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
