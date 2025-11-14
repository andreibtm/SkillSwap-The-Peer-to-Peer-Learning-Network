import {StyleSheet, View, Button, Text, TextInput, Pressable} from "react-native"
import { useState } from "react"

export function LogInScreen({navigation}) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    
    return (
        <View style={styles.background}>
            <Text style={styles.text}>Welcome back!</Text>
            <TextInput
                style={styles.inputbox}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput
                style={styles.inputbox}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
            />
            <Text style={styles.forgot}>Help, I can't sign in</Text>
            <View style={styles.btnpanel}>
                <Pressable>
                    <Text>Log In</Text>
                </Pressable>
            </View>
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
    inputbox: {
        borderColor: '#fff',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 16,
        width: '80%',
        marginTop: 20
    },
    forgot: {
        color: '#0056dfff',
        fontStyle: 'underline'
    }
})