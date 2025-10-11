import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'

const styles = StyleSheet.create({
  container: {},
  row: { flexDirection: 'row', gap: 8 },
  card: { flex: 1, backgroundColor: 'transparent', borderRadius: 12, padding: 12 },
  value: { fontSize: 18, fontWeight: '800' },
  label: { marginTop: 4, opacity: 0.7 },
})

type Props = { editMode: boolean; mode?: 'daily' | 'weekly' }

export function SwipesWidget({mode = 'daily'}: Props) {
  // fake values
  const daily = 1
  const weekly = 7
  const value = mode === 'daily' ? daily : weekly
  const label = mode === 'daily' ? 'Daily meals left' : 'Weekly meals left'
  return (
    <View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}
