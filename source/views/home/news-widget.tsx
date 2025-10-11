import * as React from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import type {ViewType} from '../views'
import {makeCardStyles} from './styles'

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { width: '48%', marginRight: 12, marginBottom: 12 },
  cardInner: { padding: 12, borderRadius: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
})

type Article = { title: string; source: string }

const FAKE_ARTICLES: Article[] = [
  { title: 'Ole athletics set new record', source: 'News' },
  { title: 'Stav introduces midnight breakfast', source: 'Student Life' },
]

function makeFakeNewsViews(list: Article[]): ViewType[] {
  return list.map((a) => ({
    type: 'url', url: 'https://news.example', title: `${a.title} • ${a.source}`, icon: 'news', foreground: 'light', tint: '#111827',
  })) as any
}

type Props = { onPress: (v: ViewType) => void; editMode: boolean }

export function NewsWidget({onPress}: Props) {
  const isDark = false
  const card = makeCardStyles(isDark).card

  return (
    <View>
      <View style={styles.row}>
        {makeFakeNewsViews(FAKE_ARTICLES).map((v, idx) => {
          const isRightCol = idx % 2 === 1
          return (
            <View key={v.title} style={[styles.tile, isRightCol && {marginRight: 0}]}> 
              <Pressable onPress={() => onPress(v)} accessibilityRole="button" style={[card, styles.cardInner]}
                android_ripple={{color: '#00000014', borderless: true}}>
                <View style={styles.topRow}>
                  <Text style={styles.title} numberOfLines={2}>{v.title.split(' • ')[0]}</Text>
                </View>
              </Pressable>
            </View>
          )
        })}
      </View>
    </View>
  )
}
