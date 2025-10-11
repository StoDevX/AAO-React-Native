import * as React from 'react'
import {Modal, View, StyleSheet, Text, ScrollView, Pressable} from 'react-native'
import {AllViews, ViewType} from '../views'

type Props = { visible: boolean; onClose: () => void; onSelect: (v: ViewType) => void }

const styles = StyleSheet.create({
  modalBg: { flex: 1, backgroundColor: '#0008', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', maxHeight: '70%', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  item: { paddingVertical: 12 },
})

export function BrowseAllSheet({visible, onClose, onSelect}: Props) {
  const all = React.useMemo(() => AllViews().filter((v) => !v.disabled), [])
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBg} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Browse all</Text>
          <ScrollView>
            {all.map((v) => (
              <Pressable key={v.title} style={styles.item} onPress={() => onSelect(v)}>
                <Text>{v.title}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  )
}
