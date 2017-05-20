// @flow

import React from 'react'
import {Column, Row} from '../../components/layout'
import {ListRow, Detail, Title} from '../../components/list'
import {fastGetTrimmedText} from '../../../lib/html'
import type {JobType} from './types'

type JobRowPropsType = {
  onPress: () => any,
  job: JobType,
}

export function JobRow({onPress, job}: JobRowPropsType) {
  const title = fastGetTrimmedText(job.title)
  const office = fastGetTrimmedText(job.office)
  const hours = fastGetTrimmedText(job.hoursPerWeek)
  const ending = hours == 'Full-time' ? '' : 'hrs/week'
  return (
    <ListRow onPress={onPress} arrowPosition="top">
      <Row alignItems="center">
        <Column flex={1}>
          <Title lines={1}>{title}</Title>
          <Detail lines={1}>{office}</Detail>
          <Detail lines={1}>{hours} {ending}</Detail>
        </Column>
      </Row>
    </ListRow>
  )
}
