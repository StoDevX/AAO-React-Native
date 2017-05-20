// @flow
import React from 'react'
import {ScrollView, Text, StyleSheet} from 'react-native'
import moment from 'moment'
import {HtmlView} from '../components/html-view'
import {Card} from '../components/card'
import * as c from '../components/colors'
import type {StudentOrgType} from './types'
import type {TopLevelViewPropsType} from '../types'
import Communications from 'react-native-communications'
import openUrl from '../components/open-url'
import cleanOrg from './clean-org'

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
  description: {
    paddingTop: 13,
    paddingBottom: 13,
    paddingLeft: 16,
    paddingRight: 16,
    backgroundColor: c.white,
    height: 200,
  },
  footer: {
    fontSize: 10,
    color: c.iosDisabledText,
    textAlign: 'center',
  },
  lastUpdated: {
    paddingBottom: 10,
  },
  poweredBy: {
    paddingBottom: 20,
  },
})

export class StudentOrgsDetailView extends React.Component {
  props: TopLevelViewPropsType & {
    org: StudentOrgType,
  }

  // Using Communications because `mailTo` complains about
  // the lack of an available Activity...
  openEmail = (email: string, org: string) => {
    Communications.email([email], null, null, org, '')
  }

  render() {
    const {
      name: orgName,
      category,
      meetings,
      website,
      contacts,
      advisors,
      description,
      lastUpdated: orgLastUpdated,
    } = cleanOrg(this.props.org)

    return (
      <ScrollView>
        <Text style={styles.name}>{orgName}</Text>

        {category
          ? <Card header="Category" style={styles.card}>
              <Text style={styles.cardBody}>{category}</Text>
            </Card>
          : null}

        {meetings
          ? <Card header="Meetings" style={styles.card}>
              <Text style={styles.cardBody}>{meetings}</Text>
            </Card>
          : null}

        {website
          ? <Card header="Website" style={styles.card}>
              <Text onPress={() => openUrl(website)} style={styles.cardBody}>
                {website}
              </Text>
            </Card>
          : null}

        {contacts.length
          ? <Card header="Contact" style={styles.card}>
              {contacts.map((c, i) => (
                <Text
                  key={i}
                  selectable={true}
                  style={styles.cardBody}
                  onPress={() => this.openEmail(c.email, orgName)}
                >
                  {c.title ? c.title + ': ' : ''}
                  {c.firstName} {c.lastName} ({c.email})
                </Text>
              ))}
            </Card>
          : null}

        {advisors.length
          ? <Card
              header={advisors.length === 1 ? 'Advisor' : 'Advisors'}
              style={styles.card}
            >
              {advisors.map((c, i) => (
                <Text
                  key={i}
                  selectable={true}
                  style={styles.cardBody}
                  onPress={() => this.openEmail(c.email, orgName)}
                >
                  {c.name} ({c.email})
                </Text>
              ))}
            </Card>
          : null}

        {description
          ? <Card header="Description" style={styles.card}>
              <HtmlView
                style={styles.description}
                html={`
                  <style>
                    body {
                      margin: 10px 15px 10px;
                      font-family: -apple-system;
                    }
                    * {
                      max-width: 100%;
                    }
                  </style>
                  ${description}
                `}
              />
            </Card>
          : null}

        <Text selectable={true} style={[styles.footer, styles.lastUpdated]}>
          Last updated:
          {' '}
          {moment(orgLastUpdated, 'MMMM, DD YYYY HH:mm:ss').calendar()}
        </Text>

        <Text selectable={true} style={[styles.footer, styles.poweredBy]}>
          Powered by the St. Olaf Student Orgs Database
        </Text>
      </ScrollView>
    )
  }
}
