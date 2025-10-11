import * as React from 'react'
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native'
import type {ViewType} from '../views'
import {badgeBase, badgeColors, makeCardStyles} from './styles'

const styles = StyleSheet.create({
  configRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, minWidth: 180 },
  apply: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1118270D' },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { width: '48%', marginRight: 12, marginBottom: 12 },
  cardInner: { padding: 12, borderRadius: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '700' },
  subtitle: { marginTop: 6, opacity: 0.8 },
})

type Hall = { name: string; status: 'Quiet' | 'Normal' | 'Busy'; hours: string }

const PRESET_HALLS: Hall[] = [
  { name: 'Stav Hall', status: 'Busy', hours: '7:30a–8:00p' },
  { name: 'Cage', status: 'Normal', hours: '9:00a–10:00p' },
  { name: 'Ole Store', status: 'Quiet', hours: '8:00a–7:00p' },
]

function statusColors(status: Hall['status']) {
  return status === 'Busy' ? badgeColors.warning : status === 'Normal' ? badgeColors.success : badgeColors.info
}

type Props = { onPress: (v: ViewType) => void; editMode: boolean }

export function DiningWidget({onPress, editMode}: Props) {
  const [halls, setHalls] = React.useState<Hall[]>(PRESET_HALLS)
  const [newHall, setNewHall] = React.useState('')

  const addHall = () => {
    if (!newHall.trim()) return
    const statuses: Hall['status'][] = ['Quiet', 'Normal', 'Busy']
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const hours = '7:30a–8:00p'
    setHalls((s) => [...s, {name: newHall.trim(), status, hours}])
    setNewHall('')
  }

  const isDark = false
  const card = makeCardStyles(isDark).card

  return (
    <View>
      {editMode && (
        <View style={styles.configRow}>
          <Text>Add favorite hall:</Text>
          <TextInput value={newHall} onChangeText={setNewHall} placeholder="Hall name" style={styles.input} />
          <Pressable style={styles.apply} onPress={addHall}><Text>Add</Text></Pressable>
        </View>
      )}

      <View style={styles.row}>
        {halls.map((h, idx) => {
          const c = statusColors(h.status)
          const view: ViewType = {
            type: 'url', url: 'https://dining.example', title: `${h.name} • ${h.status}`, icon: 'bowl', foreground: 'light', tint: c.fg as any,
          } as any
          const isRightCol = idx % 2 === 1
          return (
            <View key={h.name} style={[styles.tile, isRightCol && {marginRight: 0}]}> 
              <Pressable onPress={() => onPress(view)} accessibilityRole="button" style={[card, styles.cardInner]}
                android_ripple={{color: '#00000014', borderless: true}}>
                <View style={styles.topRow}>
                  <Text style={styles.title}>{h.name}</Text>
                  <View style={{backgroundColor: c.bg, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1}}>
                    <Text style={{color: c.fg, fontSize: 11, fontWeight: '700'}}>{h.status}</Text>
                  </View>
                </View>
                <Text style={styles.subtitle} numberOfLines={2}>{h.hours}</Text>
              </Pressable>
            </View>
          )
        })}
      </View>
    </View>
  )
}
