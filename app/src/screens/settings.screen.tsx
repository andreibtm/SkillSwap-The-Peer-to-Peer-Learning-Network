import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
  const navigation = useNavigation();

  const handleSettingPress = (settingName: string) => {
    console.log('Setting pressed:', settingName);
  };

  const SettingItem = ({ icon, title, subtitle }: { icon: string, title: string, subtitle?: string }) => (
    <TouchableOpacity 
      onPress={() => handleSettingPress(title)}
      className="flex-row items-center justify-between px-6 py-4 bg-[#2a2a2a] mb-2"
    >
      <View className="flex-row items-center flex-1">
        <Ionicons name={icon as any} size={24} color="#e04429" />
        <View className="ml-4 flex-1">
          <Text className="text-white text-base font-semibold">{title}</Text>
          {subtitle && (
            <Text className="text-gray-400 text-sm mt-1">{subtitle}</Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  const SettingSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <View className="mb-6">
      <Text className="text-gray-400 text-sm font-semibold px-6 mb-2 uppercase">{title}</Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 mb-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView className="flex-1">
        {/* Account Settings */}
        <SettingSection title="Account">
          <SettingItem 
            icon="person-outline" 
            title="Edit Profile" 
            subtitle="Update your profile information"
          />
          <SettingItem 
            icon="mail-outline" 
            title="Email" 
            subtitle="Change your email address"
          />
          <SettingItem 
            icon="lock-closed-outline" 
            title="Password" 
            subtitle="Update your password"
          />
        </SettingSection>

        {/* Preferences */}
        <SettingSection title="Preferences">
          <SettingItem 
            icon="notifications-outline" 
            title="Notifications" 
            subtitle="Manage notification settings"
          />
          <SettingItem 
            icon="location-outline" 
            title="Location" 
            subtitle="Update your location"
          />
          <SettingItem 
            icon="time-outline" 
            title="Availability" 
            subtitle="Set your availability preferences"
          />
          <SettingItem 
            icon="language-outline" 
            title="Language" 
            subtitle="Choose your preferred language"
          />
        </SettingSection>

        {/* Privacy & Security */}
        <SettingSection title="Privacy & Security">
          <SettingItem 
            icon="shield-outline" 
            title="Privacy" 
            subtitle="Control your privacy settings"
          />
          <SettingItem 
            icon="eye-off-outline" 
            title="Blocked Users" 
            subtitle="Manage blocked accounts"
          />
          <SettingItem 
            icon="checkmark-circle-outline" 
            title="Data & Permissions" 
            subtitle="Manage app permissions"
          />
        </SettingSection>

        {/* Support */}
        <SettingSection title="Support">
          <SettingItem 
            icon="help-circle-outline" 
            title="Help Center" 
            subtitle="Get help and support"
          />
          <SettingItem 
            icon="chatbubble-outline" 
            title="Contact Us" 
            subtitle="Send us a message"
          />
          <SettingItem 
            icon="document-text-outline" 
            title="Terms of Service" 
            subtitle="Read our terms"
          />
          <SettingItem 
            icon="shield-checkmark-outline" 
            title="Privacy Policy" 
            subtitle="Read our privacy policy"
          />
        </SettingSection>

        {/* About */}
        <SettingSection title="About">
          <SettingItem 
            icon="information-circle-outline" 
            title="App Version" 
            subtitle="v1.0.0"
          />
        </SettingSection>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
