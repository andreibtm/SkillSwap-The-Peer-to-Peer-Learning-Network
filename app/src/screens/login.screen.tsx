import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setError('');
      console.log('Attempting login...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful!');
      console.log('User ID:', userCredential.user.uid);
      console.log('User Email:', userCredential.user.email);
      
      // Check if user has a profile in Firestore
      console.log('Checking for profile in Firestore...');
      const profileDoc = await getDoc(doc(db, 'profiles', userCredential.user.uid));
      console.log('Profile exists:', profileDoc.exists());
      
      if (profileDoc.exists()) {
        console.log('Profile found, navigating to MainTabs');
        navigation.navigate('MainTabs' as never);
      } else {
        console.log('No profile found, navigating to NewUser');
        navigation.navigate('NewUser' as never);
      }
    } catch (err: any) {
      setError(err.message);
      console.log('Login failed:', err.message);
      console.error('Full error:', err);
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
            textContentType="password"
            passwordRules=""
            className="w-full bg-transparent border-b border-gray-600 text-white py-3"
          />
        </View>
        {error ? (
          <Text className="text-red-500 text-sm mb-4">{error}</Text>
        ) : null}
        <TouchableOpacity
          onPress={handleLogin}
          className="w-full rounded-full mb-4 overflow-hidden"
        >
          <LinearGradient
            colors={['#ed7b2d', '#e04429']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ paddingVertical: 16 }}
          >
            <Text className="text-white text-center text-lg font-semibold">Log In</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Signup' as never)}
          className="w-full bg-transparent border-2 border-white py-4 rounded-full mb-4"
        >
          <Text className="text-white text-center text-lg font-semibold">Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text className="text-gray-500 text-sm">Forgot password?</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}