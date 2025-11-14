import React, { useState } from 'react'
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import AuthHeader from '../components/AuthHeader'
import GoogleButton from '../components/GoogleButton'
import styles from '../components/AuthStyles'

// Login screen styled to feel "Google-like" (clean) but with a Tinder-inspired accent color.
// This file is intentionally self-contained and imports small components so each screen/component
// lives in a separate file as you requested.

export default function LoginPage({ navigation }) {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')

	function handleSignIn() {
		// Placeholder: wire your auth logic here
		Alert.alert('Sign in', `Email: ${email}\nPassword: ${password}`)
	}

	function handleGoogleSignIn() {
		// Placeholder: start Google auth flow (firebase/apple/google) here
		Alert.alert('Google Sign In', 'Start Google OAuth flow')
	}

	return (
		<SafeAreaView style={styles.page}>
			<View style={styles.card}>
				<AuthHeader subtitle="Find your study match" />

				<TextInput
					style={styles.input}
					placeholder="Email"
					keyboardType="email-address"
					autoCapitalize="none"
					value={email}
					onChangeText={setEmail}
				/>

				<TextInput
					style={styles.input}
					placeholder="Password"
					secureTextEntry
					value={password}
					onChangeText={setPassword}
				/>

				<TouchableOpacity style={styles.primaryButton} onPress={handleSignIn} activeOpacity={0.8}>
					<Text style={styles.primaryLabel}>Sign in</Text>
				</TouchableOpacity>

				<View style={{ height: 12 }} />

				<GoogleButton onPress={handleGoogleSignIn} />

				<View style={styles.metaRow}>
					<TouchableOpacity onPress={() => Alert.alert('Forgot password', 'Recover flow here')}>
						<Text style={{ color: '#999' }}>Forgot password?</Text>
					</TouchableOpacity>

					<TouchableOpacity onPress={() => navigation?.navigate?.('SignUp') || Alert.alert('Sign up', 'Navigate to SignUp')}>
						<Text style={styles.linkText}>Create account</Text>
					</TouchableOpacity>
				</View>
			</View>
		</SafeAreaView>
	)
}
