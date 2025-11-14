import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

// Simple header used on auth screens. Kept separate as requested.
export default function AuthHeader({ title = 'SkillSwap', subtitle }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FF5864', // Tinder-like accent
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#666',
  },
})
