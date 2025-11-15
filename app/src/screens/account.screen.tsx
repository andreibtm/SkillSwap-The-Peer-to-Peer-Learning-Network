import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../../firebaseConfig';
import { updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

export default function AccountScreen() {
  const navigation = useNavigation();
  const [saving, setSaving] = useState(false);
  
  // Account security state
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [currentPasswordForPassword, setCurrentPasswordForPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password visibility
  const [showCurrentPasswordEmail, setShowCurrentPasswordEmail] = useState(false);
  const [showCurrentPasswordPassword, setShowCurrentPasswordPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadAccountInfo();
  }, []);

  const loadAccountInfo = () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setCurrentEmail(currentUser.email || '');
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) {
      Alert.alert('Error', 'Please enter a new email address');
      return;
    }

    if (!currentPasswordForEmail.trim()) {
      Alert.alert('Error', 'Please enter your current password to update email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        Alert.alert('Error', 'You must be logged in to update email');
        return;
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(currentUser.email, currentPasswordForEmail);
      await reauthenticateWithCredential(currentUser, credential);

      // Update email
      await updateEmail(currentUser, newEmail.trim());

      setCurrentEmail(newEmail.trim());
      setNewEmail('');
      setCurrentPasswordForEmail('');
      Alert.alert('Success', 'Email updated successfully!');
    } catch (error: any) {
      console.error('Error updating email:', error);
      if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Incorrect password');
      } else if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'This email is already in use');
      } else {
        Alert.alert('Error', 'Failed to update email. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPasswordForPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        Alert.alert('Error', 'You must be logged in to update password');
        return;
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(currentUser.email, currentPasswordForPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);

      setCurrentPasswordForPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password updated successfully!');
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Incorrect current password');
      } else {
        Alert.alert('Error', 'Failed to update password. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 mb-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Account Security</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Update Email Section */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-semibold mb-4 uppercase tracking-wider">Email Address</Text>
        </View>

        {/* Current Email Display */}
        <View className="mb-6">
          <Text className="text-white text-base font-semibold mb-2">Current Email</Text>
          <View className="bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-3 flex-row items-center">
            <Ionicons name="mail-outline" size={20} color="#e04429" />
            <Text className="text-gray-400 ml-3">{currentEmail}</Text>
          </View>
        </View>

        {/* Update Email */}
        <View className="mb-6">
          <Text className="text-white text-base font-semibold mb-2">New Email Address</Text>
          <View className="mb-3">
            <TextInput
              placeholder="Enter new email address"
              placeholderTextColor="#666"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="bg-[#2a2a2a] border border-gray-700 rounded-lg text-white px-4 py-3"
            />
          </View>
          <View className="mb-3">
            <View className="bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-3 flex-row items-center">
              <TextInput
                placeholder="Current password for verification"
                placeholderTextColor="#666"
                value={currentPasswordForEmail}
                onChangeText={setCurrentPasswordForEmail}
                secureTextEntry={!showCurrentPasswordEmail}
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 text-white"
              />
              <TouchableOpacity onPress={() => setShowCurrentPasswordEmail(!showCurrentPasswordEmail)}>
                <Ionicons 
                  name={showCurrentPasswordEmail ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity 
            onPress={handleUpdateEmail}
            disabled={saving || !newEmail.trim() || !currentPasswordForEmail.trim()}
            className="rounded-full overflow-hidden"
            style={{ opacity: (!newEmail.trim() || !currentPasswordForEmail.trim()) ? 0.5 : 1 }}
          >
            <View className="bg-[#2a2a2a] border-2 border-orange-500 py-3 items-center">
              {saving ? (
                <ActivityIndicator color="#e04429" />
              ) : (
                <Text className="text-orange-500 font-semibold">Update Email</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="border-t border-gray-800 my-6" />

        {/* Change Password Section */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-semibold mb-4 uppercase tracking-wider">Change Password</Text>
        </View>

        {/* Update Password */}
        <View className="mb-6">
          <Text className="text-white text-base font-semibold mb-2">Current Password</Text>
          <View className="mb-3">
            <View className="bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-3 flex-row items-center">
              <TextInput
                placeholder="Enter current password"
                placeholderTextColor="#666"
                value={currentPasswordForPassword}
                onChangeText={setCurrentPasswordForPassword}
                secureTextEntry={!showCurrentPasswordPassword}
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 text-white"
              />
              <TouchableOpacity onPress={() => setShowCurrentPasswordPassword(!showCurrentPasswordPassword)}>
                <Ionicons 
                  name={showCurrentPasswordPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <Text className="text-white text-base font-semibold mb-2 mt-4">New Password</Text>
          <View className="mb-3">
            <View className="bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-3 flex-row items-center">
              <TextInput
                placeholder="Enter new password (min 6 characters)"
                placeholderTextColor="#666"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 text-white"
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <Ionicons 
                  name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <Text className="text-white text-base font-semibold mb-2">Confirm New Password</Text>
          <View className="mb-3">
            <View className="bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-3 flex-row items-center">
              <TextInput
                placeholder="Re-enter new password"
                placeholderTextColor="#666"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 text-white"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            onPress={handleUpdatePassword}
            disabled={saving || !currentPasswordForPassword.trim() || !newPassword.trim() || !confirmPassword.trim()}
            className="rounded-full overflow-hidden"
            style={{ 
              opacity: (!currentPasswordForPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) ? 0.5 : 1 
            }}
          >
            <View className="bg-[#2a2a2a] border-2 border-orange-500 py-3 items-center">
              {saving ? (
                <ActivityIndicator color="#e04429" />
              ) : (
                <Text className="text-orange-500 font-semibold">Update Password</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View className="bg-[#2a2a2a] border border-gray-700 rounded-lg p-4 mb-6">
          <View className="flex-row items-start">
            <Ionicons name="information-circle-outline" size={20} color="#e04429" style={{ marginTop: 2 }} />
            <View className="flex-1 ml-3">
              <Text className="text-gray-300 text-sm">
                For security reasons, you'll need to enter your current password to make changes to your email or password.
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
