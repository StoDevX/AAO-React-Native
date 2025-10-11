import * as React from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import type {ViewType} from '../views'
import {badgeBase, badgeColors, makeCardStyles} from './styles'

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { width: '48%', marginRight: 12, marginBottom: 12 },
  cardInner: { padding: 12, borderRadius: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  subtitle: { marginTop: 6, opacity: 0.8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headerTitle: { fontWeight: '600', fontSize: 16 },
})

type Event = { title: string; time: string; place: string }

const FAKE_EVENTS: Event[] = [
  { title: 'Org Fair', time: 'Today • 7:00 PM', place: 'Buntrock Commons' },
  { title: 'Jazz Band', time: 'Fri • 8:00 PM', place: 'Pause' },
  { title: 'Film Night', time: 'Sat • 8:30 PM', place: 'Viking Theater' },
]

function badgeForTime(time: string) {
  // simple heuristic: Today -> info, else neutral; also compact string
  const isToday = time.startsWith('Today')
  const compact = time
    .replace('Today • ', 'Today ')
    .replace(' • ', ' ')
    .replace(' PM', 'p')
    .replace(' AM', 'a')
  return { colors: isToday ? badgeColors.info : badgeColors.neutral, label: compact }
}

type Props = { onPress: (v: ViewType) => void; editMode: boolean }

export function EventsWidget({onPress}: Props) {
  const isDark = false
  const card = makeCardStyles(isDark).card

  return (
    <View>
      <View style={styles.row}>
        {FAKE_EVENTS.map((e, idx) => {
          const cBadge = badgeForTime(e.time)
          const view: ViewType = {
            type: 'url', url: 'https://events.example', title: `${e.title} • ${e.time}`, icon: 'calendar', foreground: 'light', tint: '#EF4444',
          } as any
          const isRightCol = idx % 2 === 1
          return (
            <View key={e.title} style={[styles.tile, isRightCol && {marginRight: 0}]}> 
              <Pressable onPress={() => onPress(view)} accessibilityRole="button" style={[card, styles.cardInner]}
                android_ripple={{color: '#00000014', borderless: true}}>
                <View style={styles.topRow}>
                  <Text style={styles.title} numberOfLines={1}>{e.title}</Text>
                  <View style={{backgroundColor: cBadge.colors.bg, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1}}>
                    <Text style={{color: cBadge.colors.fg, fontSize: 11, fontWeight: '700'}}>{cBadge.label}</Text>
                  </View>
                </View>
                <Text style={styles.subtitle} numberOfLines={2}>{e.place}</Text>
              </Pressable>
            </View>
          )
        })}
      </View>
    </View>
  )
}
