import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Animated, LogBox } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';

// Suppress known non-critical warnings
LogBox.ignoreLogs(['Text strings must be rendered']);

export default function SignupScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const popupScale = useRef(new Animated.Value(0.8)).current;

  const handleSignup = async () => {
    try {
      setError('');
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      await createUserWithEmailAndPassword(auth, email, password);
      
      // Show success popup
      setShowSuccessPopup(true);
      
      // Animate popup in
      Animated.parallel([
        Animated.timing(popupOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(popupScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Hide popup and navigate to login after 2 seconds
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(popupOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(popupScale, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowSuccessPopup(false);
          navigation.navigate('Login' as never);
        });
      }, 2000);
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

      {/* Success Popup */}
      {showSuccessPopup && (
        <Animated.View
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: [
              { translateX: -150 },
              { translateY: -75 },
              { scale: popupScale }
            ],
            opacity: popupOpacity,
            width: 300,
            backgroundColor: '#3a3a3a',
            borderRadius: 16,
            padding: 24,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Ionicons name="checkmark-circle-outline" size={64} color="#22c55e" />
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginTop: 16, textAlign: 'center' }}>
            Account successfully created!
          </Text>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}