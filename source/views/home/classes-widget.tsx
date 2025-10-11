import * as React from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import type {ViewType} from '../views'
import {makeCardStyles} from './styles'

const styles = StyleSheet.create({
  list: { gap: 12 },
  cardInner: { padding: 12, borderRadius: 12 },
  title: { fontSize: 15, fontWeight: '700' },
  subtitle: { marginTop: 6, opacity: 0.8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headerTitle: { fontWeight: '600', fontSize: 16 },
})

type ClassItem = { title: string; time: string; location: string }

const FAKE_CLASSES: ClassItem[] = [
  { title: 'CS 251 • Software Design', time: '9:40–11:00 AM', location: 'Regents 115' },
  { title: 'MATH 220 • Calc III', time: '1:20–2:40 PM', location: 'RMS 206' },
  { title: 'MUSIC 141 • Theory I', time: '3:00–4:00 PM', location: 'CHM 120' },
]

// simple start-time parser for strings like "9:40–11:00 AM" or "1:20–2:40 PM"
function parseStartMinutes(t: string): number {
  try {
    const [range, ampmRaw] = t.split(' ')
    const start = range.split('–')[0]
    const [hStr, mStr] = start.split(':')
    let h = parseInt(hStr, 10)
    const m = parseInt(mStr, 10)
    const ampm = (ampmRaw || '').toUpperCase()
    if (ampm.startsWith('PM') && h !== 12) h += 12
    if (ampm.startsWith('AM') && h === 12) h = 0
    return h * 60 + m
  } catch {
    return 0
  }
}

type Props = { onPress: (v: ViewType) => void; editMode: boolean }

export function ClassesWidget({onPress}: Props) {
  const isDark = false
  const card = makeCardStyles(isDark).card

  const sorted = React.useMemo(() =>
    [...FAKE_CLASSES].sort((a, b) => parseStartMinutes(a.time) - parseStartMinutes(b.time))
  , [])

  return (
    <View>
      <View style={styles.list}>
        {sorted.map((c) => {
          const view: ViewType = {
            type: 'url', url: 'https://sis.example', title: `${c.title} • ${c.time}`, icon: 'graduation-cap', foreground: 'light', tint: '#8B5CF6',
          } as any
          return (
            <Pressable key={c.title} onPress={() => onPress(view)} accessibilityRole="button" style={[card, styles.cardInner]} 
              android_ripple={{color: '#00000014', borderless: true}}>
              <Text style={styles.title} numberOfLines={1}>{c.title}</Text>
              <Text style={styles.subtitle} numberOfLines={2}>{c.time} • {c.location}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
