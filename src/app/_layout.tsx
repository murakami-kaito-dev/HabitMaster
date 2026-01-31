import React from 'react'
import { Stack } from 'expo-router'
import { colors } from '../utils/theme'

const Layout = (): React.ReactElement => {
  return <Stack screenOptions={{
    headerStyle: {
      backgroundColor: colors.background
    },
    headerTintColor: colors.primary,
    headerTitle: '',
    headerBackTitle: '戻る',
    headerShadowVisible: false
  }}/>
}

export default Layout
