// @flow
import React from 'react'
import {ScrollView, Text, View, StyleSheet} from 'react-native'

import {Cell, Section, TableView} from 'react-native-tableview-simple'
import * as c from '../components/colors'
import {getTextWithSpaces, parseHtml} from '../../lib/html'
import type {StudentOrgInfoType, StudentOrgAbridgedType} from './types'
import type {TopLevelViewPropsType} from '../types'
import {StudentOrgsDetailRenderView} from './detail'

const orgsUrl = 'https://api.checkimhere.com/stolaf/v1/organizations'

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
  name: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 5,
    color: 'black',
    fontSize: 32,
    fontWeight: '300',
  },
  description: {
    paddingTop: 13,
    paddingBottom: 13,
    paddingLeft: 16,
    paddingRight: 16,
    fontSize: 16,
    backgroundColor: c.white,
  },
})

export class StudentOrgsDetailView extends React.Component {
  state: {
    data: ?StudentOrgInfoType,
    refreshing: boolean,
    loaded: boolean,
    error: boolean,
  } = {
    data: null,
    refreshing: false,
    loaded: false,
    error: false,
  }

  componentWillMount() {
    this.fetchData()
  }

  props: TopLevelViewPropsType & {
    item: StudentOrgAbridgedType,
  }

  fetchData = async () => {
    let orgUrl = orgsUrl + '/' + this.props.item.uri

    try {
      let response = await fetchJson(orgUrl)
      response = this.cleanResponseData(response)
      this.setState({data: response})
    } catch (error) {
      this.setState({error: true})
      console.error(error)
    }

    this.setState({loaded: true})
  }

  cleanResponseData = (data: StudentOrgInfoType) => {
    let {
      contactName='',
      description='',
      regularMeetingTime='',
      regularMeetingLocation='',
    } = data

    contactName = contactName.trim()
    description = description.trim()
    regularMeetingTime = regularMeetingTime.trim()
    regularMeetingLocation = regularMeetingLocation.trim()

    description = getTextWithSpaces(parseHtml(description))
    description = description.split(/\s+/).join(' ')

    return {
      ...data,
      contactName,
      description,
      regularMeetingTime,
      regularMeetingLocation,
    }
  }

  render() {
    return (
      <StudentOrgsDetailRenderView
        loaded={this.state.loaded}
        base={this.props.item}
        full={this.state.data}
      />
    )
  }
}
