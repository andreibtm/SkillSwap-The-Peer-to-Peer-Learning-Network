import React from "react";
import {StyleSheet, TouchableOpacity, Text} from "react-native";

export function Button({ title, onPress }) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
    container: {
    backgroundColor: 'grey',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
  },  
  text: {
    color: 'white',
    fontSize: 16,
    }})