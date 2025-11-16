import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
  const navigation = useNavigation();

  const handleSettingPress = (settingName: string) => {
    if (settingName === 'Edit Profile') {
      navigation.navigate('EditProfile' as never);
    } else if (settingName === 'Account') {
      navigation.navigate('Account' as never);
    } else if (settingName === 'Privacy') {
      navigation.navigate('Privacy' as never);
    } else if (settingName === 'Data & Permissions') {
      navigation.navigate('DataPerms' as never);
    }
  };

  const SettingItem = ({ icon, title, subtitle, hideChevron }: { icon: string, title: string, subtitle?: string, hideChevron?: boolean }) => (
    <TouchableOpacity 
      onPress={() => handleSettingPress(title)}
      className="flex-row items-center justify-between px-6 py-4 bg-[#2a2a2a] mb-2"
      disabled={hideChevron}
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
      {!hideChevron && <Ionicons name="chevron-forward" size={20} color="#666" />}
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
            icon="shield-checkmark-outline" 
            title="Account" 
            subtitle="Manage email and password"
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
            icon="checkmark-circle-outline" 
            title="Data & Permissions" 
            subtitle="Manage app permissions"
          />
        </SettingSection>

        {/* About */}
        <SettingSection title="About">
          <SettingItem 
            icon="information-circle-outline" 
            title="App Version" 
            subtitle="v1.0.0"
            hideChevron={true}
          />
        </SettingSection>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
