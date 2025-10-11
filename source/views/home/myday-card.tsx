import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'

type Props = {
  title: string
  subtitle?: string
  emphasis?: string
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#10B9811A',
    borderRadius: 12,
    marginRight: 12,
    minWidth: 180,
  },
  title: { fontSize: 15, fontWeight: '700' },
  subtitle: { opacity: 0.8, marginTop: 2 },
  emphasis: { marginTop: 6, fontSize: 12, opacity: 0.9 },
})

export function MyDayCard({title, subtitle, emphasis}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {emphasis ? <Text style={styles.emphasis}>{emphasis}</Text> : null}
    </View>
  )
}
