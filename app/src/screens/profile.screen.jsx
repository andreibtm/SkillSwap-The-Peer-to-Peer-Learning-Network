import {StyleSheet, View, Button, Text, TextInput} from "react-native"
import { useState } from "react"

export function ProfileScreen({navigation}) {

    
    return (
        <View>
            <Text>Profile Screen</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    background: {
        backgroundColor: '#333333',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    text: {
        fontWeight: '700',
        color: '#fff',
        fontSize: '18'
    },
    emailinput: {
        borderColor: '#fff',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 16,
        width: '80%',
        marginTop: 20
    }
})