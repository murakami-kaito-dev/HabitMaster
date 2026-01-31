import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LayoutAnimation, Platform, ScrollView, StyleSheet, UIManager, View, useWindowDimensions, Text, TouchableOpacity, Alert } from 'react-native'
import { TimerPicker } from 'react-native-timer-picker'
import { router, useNavigation, useLocalSearchParams } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import * as Notifications from 'expo-notifications'
import firebase from 'firebase/compat/app'
import { Ionicons } from '@expo/vector-icons'
import Save from '../../components/Save'
import { db, auth } from '../../utils/config'
import type { AlarmTime } from '../../types/habit'
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

enum dayOfWeek { Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday }

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

const getNotificationBody = (habitMissionDetail: string): string => {
  if (habitMissionDetail && habitMissionDetail.trim().length > 0) {
    return habitMissionDetail.slice(0, 20)
  }
  return '習慣を達成しましょう！'
}

const weekdayScheduleNotificationAsync = async (hours: number, minutes: number, repeatDayOfWeek: boolean[], habitMission: string, habitMissionDetail: string): Promise<Array<string | null>> => {
  const identifier = new Array<string | null>(7).fill(null)

  for (let i = 0; i < 7; i++) {
    if (repeatDayOfWeek[i]) {
      identifier[i] = await Notifications.scheduleNotificationAsync({
        content: {
          title: habitMission,
          body: getNotificationBody(habitMissionDetail),
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

const requestPermissionsAsync = async (): Promise<void> => {
  const { granted } = await Notifications.getPermissionsAsync()
  if (granted) { return }

  await Notifications.requestPermissionsAsync()
}

const handleSaveAsync = async (alarmTime: AlarmTime, repeatDayOfWeek: boolean[], habitItemId: string, habitMission: string, habitMissionDetail: string): Promise<void> => {
  if (auth.currentUser === null) { return }

  const refToUserHabitsAlarms = db.collection(`users/${auth.currentUser.uid}/habits/${habitItemId}/alarms`)
  await refToUserHabitsAlarms.add({
    alarmTime,
    repeatDayOfWeek,
    updatedAt: firebase.firestore.Timestamp.fromDate(new Date()),
    alarmIdentifier: await weekdayScheduleNotificationAsync(alarmTime.hours, alarmTime.minutes, repeatDayOfWeek, habitMission, habitMissionDetail)
  })
    .then(() => {
      router.back()
    })
    .catch((error: string) => {
      Alert.alert('保存できませんでした')
      console.log(error)
    })
}

const handlePressRepeatDayOfWeek = (repeatDayOfWeek: boolean[], dayOfWeek: dayOfWeek, setRepeatDayOfWeek: React.Dispatch<React.SetStateAction<any[]>>): void => {
  const updatedRepeatDayOfWeek: boolean[] = [...repeatDayOfWeek]
  updatedRepeatDayOfWeek[dayOfWeek] = (!repeatDayOfWeek[dayOfWeek])
  setRepeatDayOfWeek(updatedRepeatDayOfWeek)
}

const AddAlarm = (): React.ReactElement => {
  const [alarmTime, setAlarmTime] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [repeatDayOfWeek, setRepeatDayOfWeek] = useState<boolean[]>(new Array(7).fill(false))
  const { width: windowWidth } = useWindowDimensions()
  const refScrollView = useRef(null)
  const headerNavigation = useNavigation()
  const habitItemId = String(useLocalSearchParams().habitItemId)
  const habitMission = String(useLocalSearchParams().habitMission)
  const habitMissionDetail = String(useLocalSearchParams().habitMissionDetail ?? '')

  useEffect(() => {
    requestPermissionsAsync()
      .then(() => {})
      .catch(() => {})
  }, [])

  useEffect(() => {
    headerNavigation.setOptions({
      headerRight: () => { return <Save onSave={() => { handleSaveAsync(alarmTime, repeatDayOfWeek, habitItemId, habitMission, habitMissionDetail) }}/> }
    })
  }, [alarmTime, repeatDayOfWeek])

  const onMomentumScrollEnd = useCallback(
    () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    }, [windowWidth]
  )

  const renderExample = useMemo(() => {
    return (
      <View style={[styles.alarmTimeScrollViewSection, { width: windowWidth }]}>
        <TimerPicker
          onDurationChange={
            (timer) => {
              setAlarmTime({ hours: timer.hours, minutes: timer.minutes, seconds: 0 })
            }
          }
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
  }, [windowWidth, alarmTime])

  return (
    <View style={styles.container}>
      <View style={styles.alarmTimeSection}>
        <ScrollView
          ref={refScrollView}
          horizontal
          pagingEnabled
          onMomentumScrollEnd={onMomentumScrollEnd}
        >
          {renderExample}
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
              onPress={() => { handlePressRepeatDayOfWeek(repeatDayOfWeek, index, setRepeatDayOfWeek) }}
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

export default AddAlarm
