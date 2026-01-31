import React, { useEffect } from 'react'
import { View, Button } from 'react-native'
import * as Notifications from 'expo-notifications'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
})

const weekdayScheduleNotificationAsync = async (select: boolean): Promise<void> => {
  if (select) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'テスト通知',
        body: 'test5000',
        sound: true
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        hour: 18,
        minute: 55,
        weekday: 4
      }
    })
  }

  // 通知のキャンセル処理
  // Notifications.cancelAllScheduledNotificationsAsync()
}

const requestPermissionsAsync = async (): Promise<void> => {
  const { granted } = await Notifications.getPermissionsAsync()
  if (granted) { return }

  await Notifications.requestPermissionsAsync()
}

const App = (): React.ReactElement => {
  useEffect(() => {
    requestPermissionsAsync()
      .then(() => {})
      .catch(() => {})
  })

  return (
    <View>
      <Button
        title='61秒後にプッシュ通知する'
        onPress={ () => { weekdayScheduleNotificationAsync(true) } }
      />
    </View>
  )
}

export default App
