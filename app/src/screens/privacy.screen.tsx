import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function PrivacyScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Privacy settings state
  const [showProfile, setShowProfile] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showSkills, setShowSkills] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [discoverableBySearch, setDiscoverableBySearch] = useState(true);

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to view privacy settings');
        navigation.goBack();
        return;
      }

      const profileDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        const privacy = data.privacy || {};
        
        setShowProfile(privacy.showProfile !== false);
        setShowLocation(privacy.showLocation !== false);
        setShowSkills(privacy.showSkills !== false);
        setAllowMessages(privacy.allowMessages !== false);
        setShowOnlineStatus(privacy.showOnlineStatus !== false);
        setDiscoverableBySearch(privacy.discoverableBySearch !== false);
      }
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to load privacy settings');
      setLoading(false);
    }
  };

  const savePrivacySettings = async () => {
    setSaving(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to save privacy settings');
        return;
      }

      await updateDoc(doc(db, 'profiles', currentUser.uid), {
        privacy: {
          showProfile,
          showLocation,
          showSkills,
          allowMessages,
          showOnlineStatus,
          discoverableBySearch,
        },
        updatedAt: new Date().toISOString(),
      });

      Alert.alert('Success', 'Privacy settings updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const PrivacyToggle = ({ 
    icon, 
    title, 
    description, 
    value, 
    onValueChange 
  }: { 
    icon: string, 
    title: string, 
    description: string, 
    value: boolean, 
    onValueChange: (value: boolean) => void 
  }) => (
    <View className="bg-[#2a2a2a] px-6 py-4 mb-2">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <Ionicons name={icon as any} size={24} color="#e04429" />
          <Text className="text-white text-base font-semibold ml-4">{title}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#3a3a3a', true: '#e04429' }}
          thumbColor={value ? '#ffffff' : '#666666'}
          ios_backgroundColor="#3a3a3a"
        />
      </View>
      <Text className="text-gray-400 text-sm ml-9">{description}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#e04429" />
          <Text className="text-white text-lg mt-4">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 mb-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Privacy Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Visibility Section */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-semibold px-6 mb-3 uppercase tracking-wider">
            Profile Visibility
          </Text>
          <PrivacyToggle
            icon="person-outline"
            title="Show Profile"
            description="Allow other users to view your full profile"
            value={showProfile}
            onValueChange={setShowProfile}
          />
          <PrivacyToggle
            icon="location-outline"
            title="Show Location"
            description="Display your city and country on your profile"
            value={showLocation}
            onValueChange={setShowLocation}
          />
          <PrivacyToggle
            icon="bulb-outline"
            title="Show Skills"
            description="Make your skills list visible to others"
            value={showSkills}
            onValueChange={setShowSkills}
          />
        </View>

        {/* Communication Section */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-semibold px-6 mb-3 uppercase tracking-wider">
            Communication
          </Text>
          <PrivacyToggle
            icon="chatbubble-outline"
            title="Allow Messages"
            description="Let matched users send you messages"
            value={allowMessages}
            onValueChange={setAllowMessages}
          />
          <PrivacyToggle
            icon="radio-outline"
            title="Show Online Status"
            description="Display when you're active on the app"
            value={showOnlineStatus}
            onValueChange={setShowOnlineStatus}
          />
        </View>

        {/* Discovery Section */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-semibold px-6 mb-3 uppercase tracking-wider">
            Discovery
          </Text>
          <PrivacyToggle
            icon="search-outline"
            title="Discoverable in Search"
            description="Allow others to find you through search"
            value={discoverableBySearch}
            onValueChange={setDiscoverableBySearch}
          />
        </View>

        {/* Info Box */}
        <View className="mx-6 mb-6 bg-[#2a2a2a] border border-gray-700 rounded-lg p-4">
          <View className="flex-row items-start">
            <Ionicons name="information-circle-outline" size={20} color="#e04429" style={{ marginTop: 2 }} />
            <View className="flex-1 ml-3">
              <Text className="text-gray-300 text-sm">
                These settings help you control who can see your information and interact with you. 
                Changes take effect immediately.
              </Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <View className="px-6 mb-8">
          <TouchableOpacity 
            onPress={savePrivacySettings}
            disabled={saving}
            className="bg-[#2a2a2a] border-2 border-orange-500 rounded-full py-4 items-center"
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving ? (
              <ActivityIndicator color="#e04429" />
            ) : (
              <Text className="text-orange-500 font-bold text-lg">Save Privacy Settings</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
