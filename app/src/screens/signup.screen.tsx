import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function SignupScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    try {
      setError('');
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#1a1a1a]"
    >
      <View className="flex-1 justify-center items-center px-8">
        <View className="items-center mb-16">
          <Image 
            source={require('../images/logo.png')}
            style={{ width: 200, height: 200 }}
            resizeMode="contain"
          />
          <Text className="text-white text-3xl font-bold">SkillSwap</Text>
        </View>
        <View className="w-full mb-6">
          <TextInput
            placeholder="Email"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            className="w-full bg-transparent border-b border-gray-600 text-white py-3 mb-4"
          />
          
          <TextInput
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
            passwordRules=""
            className="w-full bg-transparent border-b border-gray-600 text-white py-3 mb-4"
          />

          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#666"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textContentType="newPassword"
            passwordRules=""
            className="w-full bg-transparent border-b border-gray-600 text-white py-3"
          />
        </View>
        {error ? (
          <Text className="text-red-500 text-sm mb-4">{error}</Text>
        ) : null}
        <TouchableOpacity
          onPress={handleSignup}
          className="w-full rounded-full mb-4 overflow-hidden"
        >
          <LinearGradient
            colors={['#ed7b2d', '#e04429']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ paddingVertical: 16 }}
          >
            <Text className="text-white text-center text-lg font-semibold">Sign Up</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Login' as never)}
          className="w-full bg-transparent border-2 border-white py-4 rounded-full mb-4"
        >
          <Text className="text-white text-center text-lg font-semibold">Log In</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text className="text-gray-500 text-sm">Forgot password?</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}