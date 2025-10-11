import * as React from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import type {ViewType} from '../views'
import { makeCardStyles } from './styles'

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(16,24,40,0.08)',
  },
  label: { fontWeight: '600' },
})

const pastelColors = [
  '#FFD6E0', '#E0FFFA', '#FFF5CC', '#D6F5FF', '#E0FFD6', '#F0E0FF', '#FFE0F0', '#D6FFE0'
]

function getRandomPastelColor(seed: string) {
  // Simple hash for stable color per item
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return pastelColors[Math.abs(hash) % pastelColors.length] 
}

type Props = { item: ViewType; onPress: (v: ViewType) => void }

export function ActionChip({item, onPress}: Props) {
  const bgColor = React.useMemo(() => getRandomPastelColor(item.title ?? ''), [item.title])

  const isDark = false
  const card = makeCardStyles(isDark).card
  return (
    <Pressable
      onPress={() => onPress(item)}
      style={[styles.chip, { borderColor: 'transparent', backgroundColor: 'white', borderWidth: 2 }, card]}
      accessibilityRole="button"
    >
      <Text style={[styles.label, { color: bgColor }]}>{item.title}</Text>
    </Pressable>
  )
}
