// @flow
import React from 'react'
import type {StudentOrgType} from './types'
import type {TopLevelViewPropsType} from '../types'
import {StudentOrgsDetailRenderView} from './detail'

export class StudentOrgsDetailView extends React.Component {
  props: TopLevelViewPropsType & {
    org: StudentOrgType,
  }

  render() {
    return <StudentOrgsDetailRenderView org={this.props.org} />
  }
}
