// @flow
import React from 'react'
import NewsContainer from './news-container'
import type { NewsViewPropsType } from './types'

export default function MessengerNewsView(props: NewsViewPropsType) {
  return <NewsContainer {...props} />
}
