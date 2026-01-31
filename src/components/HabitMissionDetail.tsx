import React from 'react'
import { View, Text, StyleSheet, TextInput } from 'react-native'

const HabitMissionDetail = (): React.ReactElement => {
  return (
    <View style={styles.habitMissionDetailSection}>
      <Text style={styles.habitMissionDetailDescription}>詳細</Text>
      <TextInput
        editable = { true }
        placeholder = "例)仕事から帰ってきたらすぐに走りに行く！"
        multiline = { true }
        numberOfLines = { 4 }
        style = {styles.habitMissionDetail}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  habitMissionDetailSection: {
    paddingLeft: 24,
    paddingRight: 24,
    marginBottom: 16
  },
  habitMissionDetailDescription: {
    fontSize: 24,
    lineHeight: 32
  },
  habitMissionDetail: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 10,
    height: 136,
    width: 336,
    lineHeight: 24,
    fontSize: 24
  }
})

export default HabitMissionDetail
