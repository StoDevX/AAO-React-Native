// @flow
import React from 'react'
import {ScrollView, Text, StyleSheet, Linking} from 'react-native'
import moment from 'moment'
import {HtmlView} from '../components/html-view' 
import {Cell, Section, TableView} from 'react-native-tableview-simple'
import * as c from '../components/colors'
import type {StudentOrgType} from './types'
import openUrl from '../components/open-url'

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
  meetings: {
    flex: 1,
    paddingVertical: 8,
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
        <TableView>
          <Text selectable={true} style={styles.name}>{name}</Text>

          {category.trim()
            ? <Section header="CATEGORY">
                <Cell cellStyle="Basic" title={category} />
              </Section>
            : null}

          {meetings.trim()
            ? <Section header="MEETINGS">
                <Cell
                  cellContentView={
                    <Text style={styles.meetings}>{meetings}</Text>
                  }
                  cellStyle="Basic"
                />
              </Section>
            : null}

          {website.trim()
            ? <Section header="WEBSITE">
                <Cell
                  cellStyle="Basic"
                  accessory="DisclosureIndicator"
                  title={website}
                  onPress={() =>
                    openUrl(
                      /^https?:\/\//.test(website)
                        ? website
                        : `http://${website}`,
                    )}
                />
              </Section>
            : null}

          <Section header="CONTACT">
            {contacts.map((c, i) => (
              <Cell
                key={i}
                cellStyle={c.title ? 'Subtitle' : 'Basic'}
                accessory="DisclosureIndicator"
                title={`${c.firstName.trim()} ${c.lastName.trim()}`}
                detail={c.title.trim()}
                onPress={() => Linking.openURL(`mailto:${c.email}`)}
              />
            ))}
          </Section>

          {advisors.length
            ? <Section header={advisors.length === 1 ? 'ADVISOR' : 'ADVISORS'}>
                {advisors.map((c, i) => (
                  <Cell
                    key={i}
                    cellStyle="Basic"
                    accessory="DisclosureIndicator"
                    title={c.name.trim()}
                    onPress={() => Linking.openURL(`mailto:${c.email}`)}
                  />
                ))}
              </Section>
            : null}

          {description.trim()
            ? <Section header="DESCRIPTION">
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
                    ${description.trim()}
                  `}
                />
              </Section>
            : null}

          <Text selectable={true} style={[styles.footer, styles.lastUpdated]}>
            Last updated:
            {' '}
            {moment(lastUpdated, 'MMMM, DD YYYY HH:mm:ss').calendar()}
          </Text>

          <Text selectable={true} style={[styles.footer, styles.poweredBy]}>
            Powered by the St. Olaf Student Orgs Database
          </Text>
        </TableView>
      </ScrollView>
    )
  }
}
