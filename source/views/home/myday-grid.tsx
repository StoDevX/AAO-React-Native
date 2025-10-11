import * as React from 'react'
import {StyleSheet, View, Text, Pressable, useColorScheme} from 'react-native'
import {makeCardStyles} from './styles'
import {borders, pastel} from './colors'

export type MyDayItem = {
  title: string
  subtitle?: string
  emphasis?: string
  onPress?: () => void
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 },
  card: {
    width: '50%',
    padding: 8,
  },
  inner: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  title: { fontSize: 15, fontWeight: '700' },
  subtitle: { marginTop: 2, opacity: 0.8 },
  emphasis: { marginTop: 6, fontSize: 12, opacity: 0.9 },
})

export function MyDayGrid({items}: {items: MyDayItem[]}) {
  const isDark = useColorScheme() === 'dark'
  const card = makeCardStyles(isDark).card
  return (
    <View style={styles.grid}>
      {items.slice(0, 4).map((it, i) => (
        <View style={styles.card} key={i}>
          <Pressable onPress={it.onPress} style={[styles.inner, card]} accessibilityRole="button">
            <Text style={styles.title}>{it.title}</Text>
            {it.subtitle ? <Text style={styles.subtitle}>{it.subtitle}</Text> : null}
            {it.emphasis ? <Text style={styles.emphasis}>{it.emphasis}</Text> : null}
          </Pressable>
        </View>
      ))}
    </View>
  )
}
