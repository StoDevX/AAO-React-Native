// @flow
import React from 'react'
import {ScrollView, Text, StyleSheet} from 'react-native'
import moment from 'moment'
import {HtmlView} from '../components/html-view'
import {Cell} from 'react-native-tableview-simple'
import {Card} from '../components/card'
import * as c from '../components/colors'
import type {StudentOrgType} from './types'

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

export class StudentOrgsDetailRenderView extends React.Component {
  props: {
    org: StudentOrgType,
  }

  render() {
    const data = this.props.org
    const name = data.name.trim()
    let {
      category,
      meetings,
      contacts,
      description,
      advisors,
      lastUpdated,
      website,
    } = data

    advisors = advisors.filter(c => c.name.trim().length)

    return (
      <ScrollView>
        <Text style={styles.name}>{name}</Text>

        {category.trim()
          ? <Card header="Category" style={styles.card}>
              <Text style={styles.cardBody}>{category}</Text>
            </Card>
          : null}

        {meetings.trim()
          ? <Card header="Meetings" style={styles.card}>
              <Cell cellStyle="Basic" title={meetings} />
            </Card>
          : null}

        {website.trim()
          ? <Card header="Website" style={styles.card}>
              <Text style={styles.cardBody}>
                {/^https?:\/\//.test(website) ? website : `http://${website}`}
              </Text>
            </Card>
          : null}

        <Card header="Contact" style={styles.card}>
          {contacts.map((c, i) => (
            <Text key={i} selectable={true} style={styles.cardBody}>
              {c.title}: {c.firstName} {c.lastName} ({c.email})
            </Text>
          ))}
        </Card>

        {advisors.length
          ? <Card
              header={advisors.length === 1 ? 'Advisor' : 'Advisors'}
              style={styles.card}
            >
              {advisors.map((c, i) => (
                <Text key={i} selectable={true} style={styles.cardBody}>
                  {c.name} ({c.email})
                </Text>
              ))}
            </Card>
          : null}

        {description.trim()
          ? <Card header="Description" style={styles.card}>
              <HtmlView
                scrollEnabled={true}
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
                  ${description.trim()}
                `}
              />
            </Card>
          : null}

        <Text selectable={true} style={[styles.footer, styles.lastUpdated]}>
          Last updated:
          {' '}
          {moment(lastUpdated, 'MMMM, DD YYYY HH:mm:ss').calendar()}
        </Text>

        <Text selectable={true} style={[styles.footer, styles.poweredBy]}>
          Powered by the St. Olaf Student Orgs Database
        </Text>
      </ScrollView>
    )
  }
}
