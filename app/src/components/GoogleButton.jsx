import React from 'react'
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'

// A small, self-contained Google-style sign-in button without external deps.
// Accepts onPress and optional label.
export default function GoogleButton({ onPress = () => {}, label = 'Continue with Google' }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.logoContainer}>
        {/* Simple Google-like token made from colored circles */}
        <View style={[styles.dot, { backgroundColor: '#4285F4', marginLeft: 0 }]} />
        <View style={[styles.dot, { backgroundColor: '#DB4437' }]} />
        <View style={[styles.dot, { backgroundColor: '#F4B400' }]} />
        <View style={[styles.dot, { backgroundColor: '#0F9D58' }]} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  logoContainer: {
    width: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginRight: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 15,
    color: '#222',
    fontWeight: '600',
  },
})
