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

type Stop = { name: string; eta: string }

const PRESET_STOPS: Stop[] = [
  { name: 'Skoglund', eta: '4 min' },
  { name: 'Buntrock', eta: '7 min' },
  { name: 'Regents', eta: '12 min' },
]

function makeFakeShuttleViews(stops: Stop[]): ViewType[] {
  return stops.map((s) => ({
    type: 'url',
    url: 'https://transport.example',
    title: `${s.name} • ${s.eta}`,
    icon: 'bus',
    foreground: 'light',
    tint: '#0EA5E9',
  })) as unknown as ViewType[]
}

type Props = {
  onPress: (v: ViewType) => void
  editMode: boolean
}

export function ShuttleWidget({onPress, editMode}: Props) {
  const [stops, setStops] = React.useState<Stop[]>(PRESET_STOPS)
  const [newStop, setNewStop] = React.useState('')

  const addStop = () => {
    if (!newStop.trim()) return
    const eta = `${Math.max(2, Math.floor(Math.random() * 10))} min`
    setStops((s) => [...s, {name: newStop.trim(), eta}])
    setNewStop('')
  }

  const isDark = false
  const card = makeCardStyles(isDark).card

  return (
    <View>
      {editMode && (
        <View style={styles.configRow}>
          <Text>Add favorite stop:</Text>
          <TextInput value={newStop} onChangeText={setNewStop} placeholder="Stop name" style={styles.input} />
          <Pressable style={styles.apply} onPress={addStop}><Text>Add</Text></Pressable>
        </View>
      )}
      <View style={styles.row}>
        {stops.map((s, idx) => {
          const view: ViewType = {
            type: 'url', url: 'https://transport.example', title: `${s.name} • ${s.eta}`, icon: 'bus', foreground: 'light', tint: '#0EA5E9',
          } as any
          const isRightCol = idx % 2 === 1
          return (
            <View key={s.name} style={[styles.tile, isRightCol && {marginRight: 0}]}> 
              <Pressable onPress={() => onPress(view)} accessibilityRole="button" style={[card, styles.cardInner]}
                android_ripple={{color: '#00000014', borderless: true}}>
                <View style={styles.topRow}>
                  <Text style={styles.title}>{s.name}</Text>
                  <View style={{backgroundColor: badgeColors.info.bg, borderRadius: 999, paddingHorizontal: badgeBase.paddingHorizontal, paddingVertical: badgeBase.paddingVertical}}>
                    <Text style={{color: badgeColors.info.fg, fontSize: badgeBase.fontSize, fontWeight: badgeBase.fontWeight}}>{s.eta}</Text>
                  </View>
                </View>
                <Text style={styles.subtitle}>Next arrivals updated moments ago</Text>
              </Pressable>
            </View>
          )
        })}
      </View>
    </View>
  )
}
