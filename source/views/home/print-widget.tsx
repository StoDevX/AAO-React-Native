import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import {WidgetRow} from './widget-row'
import type {ViewType} from '../views'

const styles = StyleSheet.create({})

type Job = { name: string; pages: number; time: string }

const FAKE_JOBS: Job[] = [
  { name: 'CS251-hw3.pdf', pages: 6, time: '8:52 AM' },
  { name: 'resume.pdf', pages: 1, time: 'Yesterday' },
]

function makeFakePrintViews(quota: number, jobs: Job[]): ViewType[] {
  const views: ViewType[] = [
    {
      type: 'url', url: 'https://print.example', title: `Quota • ${quota} pages left`, icon: 'print', foreground: 'light', tint: '#06B6D4',
    } as any,
  ]
  for (const j of jobs) {
    views.push({
      type: 'url', url: 'https://print.example/jobs', title: `${j.name} • ${j.pages}p • ${j.time}`,
      icon: 'print', foreground: 'light', tint: '#0EA5E9',
    } as any)
  }
  return views
}

type Props = { onPress: (v: ViewType) => void; editMode: boolean }

export function PrintWidget({onPress}: Props) {
  const quota = 143 // fake remaining pages
  return (
    <View style={{ marginTop: 8}}>
      <WidgetRow title="Printing" items={makeFakePrintViews(quota, FAKE_JOBS)} onPress={onPress} />
    </View>
  )
}
