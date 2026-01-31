import React, { useEffect, useState } from 'react'
import { Text, TextInput, View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { router, useNavigation } from 'expo-router'
import firebase from 'firebase/compat/app'
import { Ionicons } from '@expo/vector-icons'
import Save from '../../components/Save'
import { db, auth } from '../../utils/config'
import { colors, spacing, borderRadius, fontSize, shadow } from '../../utils/theme'

const handleSave = (habitMission: string, habitMissionDetail: string): void => {
  if (auth.currentUser === null) { return }

  const refToUserHabits = db.collection(`users/${auth.currentUser.uid}/habits`)

  const date: Date = new Date()
  const year: number = date.getFullYear()
  const month: number = date.getMonth() + 1
  const day: number = date.getDate()
  const dayOfWeek: number = date.getDay()

  refToUserHabits.add({
    habitMission,
    habitMissionDetail,
    achievements: [
      {
        year,
        month,
        day,
        dayOfWeek,
        achievement: false
      }
    ],
    updatedAt: firebase.firestore.Timestamp.fromDate(new Date())
  })
    .then(() => {
      router.back()
    })
    .catch((error) => {
      Alert.alert('追加できませんでした')
      console.log(error)
    })
}

const MAX_MISSION_LENGTH = 16
const MAX_DETAIL_LENGTH = 70

const AddHabit = (): React.ReactElement => {
  const [habitMission, setHabitMission] = useState('')
  const [habitMissionDetail, setHabitMissionDetail] = useState('')
  const headerNavigation = useNavigation()

  useEffect(() => {
    headerNavigation.setOptions({
      headerRight: () => { return <Save onSave={() => { handleSave(habitMission, habitMissionDetail) }}/> }
    })
  }, [habitMission, habitMissionDetail])

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>新しい習慣を追加</Text>
          <Text style={styles.headerSubtitle}>毎日続けたいことを設定しましょう</Text>
        </View>

        {/* Mission Input Section */}
        <View style={styles.card}>
          <View style={styles.inputSection}>
            <View style={styles.labelContainer}>
              <Ionicons name="flag" size={20} color={colors.primary} />
              <Text style={styles.label}>習慣化したいこと</Text>
            </View>
            <TextInput
              onChangeText={(mission) => { setHabitMission(mission) }}
              value={habitMission}
              placeholder="例）毎日15分ランニング"
              placeholderTextColor={colors.textMuted}
              maxLength={MAX_MISSION_LENGTH}
              style={styles.textInput}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.inputSection}>
            <View style={styles.labelContainer}>
              <Ionicons name="document-text" size={20} color={colors.primary} />
              <Text style={styles.label}>詳細（任意）</Text>
              <Text style={styles.charCounter}>{habitMissionDetail.length}/{MAX_DETAIL_LENGTH}</Text>
            </View>
            <TextInput
              onChangeText={(missionDetail) => { setHabitMissionDetail(missionDetail) }}
              value={habitMissionDetail}
              placeholder="例）帰宅したらすぐにジムに行く"
              placeholderTextColor={colors.textMuted}
              maxLength={MAX_DETAIL_LENGTH}
              multiline={true}
              numberOfLines={3}
              style={[styles.textInput, styles.textArea]}
            />
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <View style={styles.tipItem}>
            <Ionicons name="bulb-outline" size={18} color={colors.warning} />
            <Text style={styles.tipText}>具体的で小さな目標から始めましょう</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="time-outline" size={18} color={colors.secondary} />
            <Text style={styles.tipText}>毎日同じ時間に行うと続けやすくなります</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadow.md
  },
  inputSection: {
    marginBottom: spacing.sm
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1
  },
  charCounter: {
    fontSize: fontSize.sm,
    color: colors.textMuted
  },
  textInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg
  },
  tipsSection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.sm
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  tipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm
  }
})

export default AddHabit
