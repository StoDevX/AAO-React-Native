// @flow
import React from 'react'
import {fastGetTrimmedText} from '../../lib/html'
import type {StudentOrgInfoType, StudentOrgAbridgedType} from './types'
import type {TopLevelViewPropsType} from '../types'
import {StudentOrgsDetailRenderView} from './detail'

const orgsUrl = 'https://api.checkimhere.com/stolaf/v1/organizations'

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

    description = fastGetTrimmedText(description)

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
