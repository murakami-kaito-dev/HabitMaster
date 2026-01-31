import React, { useCallback, useEffect, useState } from 'react'
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { router, useNavigation, Link, useFocusEffect } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { Ionicons } from '@expo/vector-icons'
import Add from '../../components/add'
import WeeklyCheckButtons from '../../components/weeklyCheckButtons'
import { db, auth } from '../../utils/config'
import { type Habit } from '../../types/habit'
import subtractYearMonthDay from '../../components/SubtractYearMonthDay'
import { colors, spacing, borderRadius, fontSize, shadow } from '../../utils/theme'

const handleAdd = (): void => {
  router.push('./addHabit')
}

const handleDelete = async (habitItemId: string): Promise<void> => {
  if (auth.currentUser === null) { return }

  const refToUsersHabitsItemId = db.doc(`users/${auth.currentUser.uid}/habits/${habitItemId}`)
  const refHabitAlarmCollection = refToUsersHabitsItemId.collection('alarms')
  const refHabitAlarmId = await refHabitAlarmCollection.get()

  Alert.alert('削除します', '一度削除した記録は戻せません\nよろしいですか？', [
    {
      text: 'キャンセル'
    },
    {
      text: '削除する',
      style: 'destructive',
      onPress: () => {
        refToUsersHabitsItemId.delete()
          .catch(() => { Alert.alert('削除に失敗しました') })

        refHabitAlarmId.forEach((doc) => {
          doc.data().alarmIdentifier.forEach((alarmIdentifier: null | string) => {
            if (alarmIdentifier === null) {
              // DO NOTHING
            } else {
              Notifications.cancelScheduledNotificationAsync(alarmIdentifier)
                .then(() => { console.log('.then実行') })
                .catch((error) => { console.log('error:', error) })
            }
          })
        })
      }
    }
  ])
}

const Home = (): React.ReactElement => {
  const [habitItems, setHabitItems] = useState<Habit[]>([])
  const headerNavigation = useNavigation()

  const date: Date = new Date()
  const year: number = date.getFullYear()
  const month: number = date.getMonth() + 1
  const day: number = date.getDate()
  const dayOfWeek: number = date.getDay()
  const latestAccess: {
    year: number
    month: number
    day: number
    dayOfWeek: number
  } = {
    year,
    month,
    day,
    dayOfWeek
  }

  useFocusEffect(
    useCallback(() => {
      if (auth.currentUser === null) { return }
      const refToUsersLatestAccess = db.doc(`users/${auth.currentUser.uid}`)

      refToUsersLatestAccess.set({ latestAccess })
        .then(() => {
          console.log('成功')
        })
        .catch((error) => {
          console.log('エラーメッセージ', error)
        })
    }, [])
  )

  useEffect(() => {
    headerNavigation.setOptions({
      headerRight: () => { return <Add onAdd={handleAdd}/> }
    })
  }, [])

  useEffect(() => {
    if (auth.currentUser === null) { return }

    const refToUsersHabits = db.collection(`users/${auth.currentUser.uid}/habits`)
    const queryHabits = refToUsersHabits.orderBy('updatedAt', 'desc')

    const unsubscribeHomeScreen = queryHabits.onSnapshot((snapshot) => {
      const remoteHabitItems: Habit[] = []
      snapshot.forEach((docHabits) => {
        const { habitMission, habitMissionDetail, achievements, updatedAt } = docHabits.data()
        remoteHabitItems.push({
          habitItemId: docHabits.id,
          habitMission,
          habitMissionDetail,
          achievements,
          updatedAt
        })
      })

      setHabitItems(remoteHabitItems)
    })
    return unsubscribeHomeScreen
  }, [])

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={styles.container}>
      { habitItems.length === 0
        ? (
        <View style={styles.emptyState}>
          <Ionicons name="fitness-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyStateTitle}>習慣を追加しよう</Text>
          <Text style={styles.emptyStateText}>右上の + ボタンから{'\n'}新しい習慣を追加できます</Text>
        </View>
          )
        : (
            habitItems.map((habitItem) => {
              subtractYearMonthDay(habitItem, latestAccess)
              return (
            <Link
              key={habitItem.habitItemId}
              href={{ pathname: './editHabit', params: { habitItemId: habitItem.habitItemId } }}
              asChild
            >
              <TouchableOpacity style={styles.habitCard}>
                <View style={styles.habitHeader}>
                  <View style={styles.habitTitleContainer}>
                    <View style={styles.habitIndicator} />
                    <Text style={styles.habitTitle} numberOfLines={1}>
                      {habitItem.habitMission}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      handleDelete(habitItem.habitItemId)
                        .then(() => {})
                        .catch((error: string) => { console.log(error) })
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <WeeklyCheckButtons
                  habitItem={habitItem}
                  habitItemId={habitItem.habitItemId}
                  achievements={habitItem.achievements}
                />
              </TouchableOpacity>
            </Link>
              )
            })
          )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120
  },
  emptyStateTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg
  },
  emptyStateText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 24
  },
  habitCard: {
    backgroundColor: colors.card,
    width: '100%',
    maxWidth: 380,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadow.md
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  habitTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  habitIndicator: {
    width: 4,
    height: 24,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginRight: spacing.sm
  },
  habitTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1
  },
  deleteButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm
  }
})

export default Home
