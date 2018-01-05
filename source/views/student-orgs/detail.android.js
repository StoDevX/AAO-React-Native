// @flow
import * as React from 'react'
import {ScrollView, Text, View, StyleSheet} from 'react-native'
import moment from 'moment'
import {Card} from '../components/card'
import * as c from '../components/colors'
import type {StudentOrgType} from './types'
import type {TopLevelViewPropsType} from '../types'
import {email} from 'react-native-communications'
import openUrl from '../components/open-url'
import {cleanOrg, showNameOrEmail} from './util'

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
  },
  descriptionText: {
    fontSize: 16,
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

type Props = TopLevelViewPropsType & {
  navigation: {state: {params: {org: StudentOrgType}}},
}

export class StudentOrgsDetailView extends React.PureComponent<Props> {
  static navigationOptions = ({navigation}) => {
    const {org} = navigation.state.params
    return {
      title: org.name,
    }
  }

  // Using the Communications library because `mailTo` complains about
  // the lack of an available Activity...
  openEmail = (to: string, org: string) => {
    email([to], null, null, org, '')
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
    } = cleanOrg(this.props.navigation.state.params.org)

    return (
      <ScrollView>
        <Text style={styles.name}>{orgName}</Text>

        {category ? (
          <Card header="Category" style={styles.card}>
            <Text style={styles.cardBody}>{category}</Text>
          </Card>
        ) : null}

        {meetings ? (
          <Card header="Meetings" style={styles.card}>
            <Text style={styles.cardBody}>{meetings}</Text>
          </Card>
        ) : null}

        {website ? (
          <Card header="Website" style={styles.card}>
            <Text onPress={() => openUrl(website)} style={styles.cardBody}>
              {website}
            </Text>
          </Card>
        ) : null}

        {contacts.length ? (
          <Card header="Contact" style={styles.card}>
            {contacts.map((c, i) => (
              <Text
                key={i}
                onPress={() => this.openEmail(c.email, orgName)}
                selectable={true}
                style={styles.cardBody}
              >
                {c.title ? c.title + ': ' : ''}
                {showNameOrEmail(c)}
              </Text>
            ))}
          </Card>
        ) : null}

        {advisors.length ? (
          <Card
            header={advisors.length === 1 ? 'Advisor' : 'Advisors'}
            style={styles.card}
          >
            {advisors.map((c, i) => (
              <Text
                key={i}
                onPress={() => this.openEmail(c.email, orgName)}
                selectable={true}
                style={styles.cardBody}
              >
                {c.name} ({c.email})
              </Text>
            ))}
          </Card>
        ) : null}

        {description ? (
          <Card header="Description" style={styles.card}>
            <View style={styles.description}>
              <Text style={styles.descriptionText}>{description}</Text>
            </View>
          </Card>
        ) : null}

        <Text selectable={true} style={[styles.footer, styles.lastUpdated]}>
          Last updated:{' '}
          {moment(orgLastUpdated, 'MMMM, DD YYYY HH:mm:ss').calendar()}
        </Text>

        <Text selectable={true} style={[styles.footer, styles.poweredBy]}>
          Powered by the St. Olaf Student Orgs Database
        </Text>
      </ScrollView>
    )
  }
}
