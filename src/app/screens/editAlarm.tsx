import React, { useCallback, useEffect, useRef, useState } from 'react'
import { LayoutAnimation, Platform, ScrollView, StyleSheet, UIManager, View, useWindowDimensions, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { TimerPicker } from 'react-native-timer-picker'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import * as Notifications from 'expo-notifications'
import firebase from 'firebase/compat/app'
import { Ionicons } from '@expo/vector-icons'
import Save from '../../components/Save'
import { db, auth } from '../../utils/config'
import type { AlarmTime, SetAlarmTime, SetRepeatDayOfWeek } from '../../types/habit'
import { colors, spacing, borderRadius, fontSize, shadow } from '../../utils/theme'

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true)
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
})

enum Day { Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday }

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

const weekdayScheduleNotificationAsync = async (hours: number, minutes: number, repeatDayOfWeek: boolean[], habitMission: string): Promise<Array<string | null>> => {
  const identifier = new Array<string | null>(7).fill(null)

  for (let i = 0; i < 7; i++) {
    if (repeatDayOfWeek[i]) {
      identifier[i] = await Notifications.scheduleNotificationAsync({
        content: {
          title: habitMission,
          body: '習慣を達成しましょう！',
          sound: true
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          hour: hours,
          minute: minutes,
          weekday: i + 1
        }
      })
    }
  }

  return identifier
}

const handleSaveAsync = async (alarmTime: AlarmTime, repeatDayOfWeek: boolean[], habitItemId: string, alarmId: string, habitMission: string): Promise<void> => {
  if (auth.currentUser === null) { return }

  const refToUsersHabitsAlarms = db.doc(`users/${auth.currentUser.uid}/habits/${habitItemId}/alarms/${alarmId}`)
  const refHabitAlarmIdentifier = await refToUsersHabitsAlarms.get()

  refHabitAlarmIdentifier.data()?.alarmIdentifier.forEach((preAlarmIdentifier: null | string) => {
    if (preAlarmIdentifier === null) {
      // Do Nothing
    } else {
      Notifications.cancelScheduledNotificationAsync(preAlarmIdentifier)
        .then(() => { console.log('.then実行') })
        .catch((error) => { console.log('error:', error) })
    }
  })

  await refToUsersHabitsAlarms.set({
    alarmTime,
    repeatDayOfWeek,
    updatedAt: firebase.firestore.Timestamp.fromDate(new Date()),
    alarmIdentifier: await weekdayScheduleNotificationAsync(alarmTime.hours, alarmTime.minutes, repeatDayOfWeek, habitMission)
  })
    .then(() => {
      router.back()
    })
    .catch(() => {
      Alert.alert('更新に失敗しました！')
    })
}

const handlePress = (repeatDayOfWeek: boolean[], day: Day, setRepeatDayOfWeek: SetRepeatDayOfWeek): void => {
  const updatedRepeatDayOfWeek: boolean[] = [...repeatDayOfWeek]
  updatedRepeatDayOfWeek[day] = (!repeatDayOfWeek[day])
  setRepeatDayOfWeek(updatedRepeatDayOfWeek)
}

const requestPermissionsAsync = async (): Promise<void> => {
  const { granted } = await Notifications.getPermissionsAsync()
  if (granted) { return }

  await Notifications.requestPermissionsAsync()
}

const fetchData = async (setAlarmTime: SetAlarmTime, setRepeatDayOfWeek: SetRepeatDayOfWeek, habitItemId: string, alarmId: string): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    if (auth.currentUser === null) { return }
    const refUsersHabitsAlarms = db.doc(`users/${auth.currentUser.uid}/habits/${habitItemId}/alarms/${alarmId}`)

    refUsersHabitsAlarms.get()
      .then((docHabitsAlarms) => {
        const RemoteRepeatTimer: AlarmTime = docHabitsAlarms?.data()?.alarmTime
        const RemoteRepeatDayOfWeek: boolean[] = docHabitsAlarms?.data()?.repeatDayOfWeek
        setAlarmTime(RemoteRepeatTimer)
        setRepeatDayOfWeek(RemoteRepeatDayOfWeek)
        resolve()
      })
      .catch((error) => {
        console.log(error)
        reject(error)
      })
  })
}

const EditAlarm = (): React.ReactElement => {
  const [alarmTime, setAlarmTime] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [repeatDayOfWeek, setRepeatDayOfWeek] = useState<boolean[]>(new Array(7).fill(false))
  const { width: windowWidth } = useWindowDimensions()
  const refScrollView = useRef(null)
  const headerNavigation = useNavigation()
  const [loading, setLoading] = useState(true)
  const habitItemId = String(useLocalSearchParams().habitItemId)
  const alarmId = String(useLocalSearchParams().alarmId)
  const habitMission = String(useLocalSearchParams().habitMission)

  const onMomentumScrollEnd = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
  }, [windowWidth])

  useEffect(() => {
    requestPermissionsAsync()
      .then(() => {})
      .catch(() => {})

    fetchData(setAlarmTime, setRepeatDayOfWeek, habitItemId, alarmId)
      .then(() => {
        setLoading(false)
        console.log('success!')
      })
      .catch((error) => {
        console.log(error)
      })
  }, [])

  useEffect(() => {
    headerNavigation.setOptions({
      headerRight: () => { return <Save onSave={() => { handleSaveAsync(alarmTime, repeatDayOfWeek, habitItemId, alarmId, habitMission) }}/> }
    })
  }, [alarmTime, repeatDayOfWeek])

  const renderTimePicker = (hour: number, minute: number): React.ReactElement => {
    return (
      <View style={[styles.alarmTimeScrollViewSection, { width: windowWidth }]}>
        <TimerPicker
          onDurationChange={
            (timer) => {
              setAlarmTime({ hours: timer.hours, minutes: timer.minutes, seconds: 0 })
            }
          }
          aggressivelyGetLatestDuration={true}
          initialValue={{ hours: hour, minutes: minute, seconds: 0 }}
          hideSeconds={true}
          padWithNItems={2}
          hourLabel="時"
          minuteLabel="分"
          LinearGradient={LinearGradient}
          styles={{
            theme: 'light',
            backgroundColor: colors.background,
            pickerItem: {
              fontSize: 32
            },
            pickerLabel: {
              fontSize: 24,
              marginTop: 0,
              color: colors.textSecondary
            },
            pickerContainer: {
              marginRight: 6
            }
          }}
        />
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.alarmTimeSection}>
        <ScrollView
          ref={refScrollView}
          horizontal
          pagingEnabled
          onMomentumScrollEnd={onMomentumScrollEnd}
        >
          {renderTimePicker(alarmTime.hours, alarmTime.minutes)}
        </ScrollView>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="repeat" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>くり返し</Text>
        </View>

        <View style={styles.repeatDayContainer}>
          {DAY_LABELS.map((label, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => { handlePress(repeatDayOfWeek, index, setRepeatDayOfWeek) }}
            >
              <View style={[
                styles.dayButton,
                repeatDayOfWeek[index] && styles.dayButtonActive,
                index === 0 && styles.sundayButton,
                index === 6 && styles.saturdayButton,
                index === 0 && repeatDayOfWeek[index] && styles.sundayButtonActive,
                index === 6 && repeatDayOfWeek[index] && styles.saturdayButtonActive
              ]}>
                <Text style={[
                  styles.dayText,
                  repeatDayOfWeek[index] && styles.dayTextActive
                ]}>
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary
  },
  alarmTimeSection: {
    backgroundColor: colors.background,
    height: 220
  },
  alarmTimeScrollViewSection: {
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%'
  },
  card: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadow.md
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: spacing.sm
  },
  repeatDayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  dayButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  dayButtonActive: {
    backgroundColor: colors.primary
  },
  sundayButton: {
    borderWidth: 2,
    borderColor: colors.sunday + '30'
  },
  saturdayButton: {
    borderWidth: 2,
    borderColor: colors.saturday + '30'
  },
  sundayButtonActive: {
    backgroundColor: colors.sunday,
    borderColor: colors.sunday
  },
  saturdayButtonActive: {
    backgroundColor: colors.saturday,
    borderColor: colors.saturday
  },
  dayText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary
  },
  dayTextActive: {
    color: colors.white
  }
})

export default EditAlarm
