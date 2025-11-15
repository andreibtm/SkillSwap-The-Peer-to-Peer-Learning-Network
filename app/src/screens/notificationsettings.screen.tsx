import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();

  // Push Notifications
  const [pushEnabled, setPushEnabled] = useState(true);
  const [matches, setMatches] = useState(true);
  const [messages, setMessages] = useState(true);
  const [skillRequests, setSkillRequests] = useState(true);
  const [newConnections, setNewConnections] = useState(true);

  // Email Notifications
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [matchReminders, setMatchReminders] = useState(false);
  const [newFeatures, setNewFeatures] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // In-App Notifications
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [badgeCount, setBadgeCount] = useState(true);

  // Activity Notifications
  const [profileViews, setProfileViews] = useState(false);
  const [savedByOthers, setSavedByOthers] = useState(false);
  const [skillUpdates, setSkillUpdates] = useState(true);

  // Memoize callbacks to prevent unnecessary re-renders
  const handlePushEnabled = useCallback((value: boolean) => setPushEnabled(value), []);
  const handleMatches = useCallback((value: boolean) => setMatches(value), []);
  const handleMessages = useCallback((value: boolean) => setMessages(value), []);
  const handleSkillRequests = useCallback((value: boolean) => setSkillRequests(value), []);
  const handleNewConnections = useCallback((value: boolean) => setNewConnections(value), []);
  
  const handleEmailEnabled = useCallback((value: boolean) => setEmailEnabled(value), []);
  const handleWeeklyDigest = useCallback((value: boolean) => setWeeklyDigest(value), []);
  const handleMatchReminders = useCallback((value: boolean) => setMatchReminders(value), []);
  const handleNewFeatures = useCallback((value: boolean) => setNewFeatures(value), []);
  const handleMarketingEmails = useCallback((value: boolean) => setMarketingEmails(value), []);
  
  const handleSoundEnabled = useCallback((value: boolean) => setSoundEnabled(value), []);
  const handleVibrationEnabled = useCallback((value: boolean) => setVibrationEnabled(value), []);
  const handleBadgeCount = useCallback((value: boolean) => setBadgeCount(value), []);
  
  const handleProfileViews = useCallback((value: boolean) => setProfileViews(value), []);
  const handleSavedByOthers = useCallback((value: boolean) => setSavedByOthers(value), []);
  const handleSkillUpdates = useCallback((value: boolean) => setSkillUpdates(value), []);

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View className="mb-8">
      <Text className="text-gray-400 text-sm font-semibold px-6 mb-3 uppercase">{title}</Text>
      <View className="bg-[#2a2a2a]">
        {children}
      </View>
    </View>
  );

  const SettingItem = React.memo(({ 
    icon, 
    title, 
    subtitle, 
    value, 
    onValueChange,
    isLast = false 
  }: { 
    icon: string; 
    title: string; 
    subtitle?: string; 
    value: boolean; 
    onValueChange: (value: boolean) => void;
    isLast?: boolean;
  }) => {
    const [localValue, setLocalValue] = React.useState(value);

    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const handleChange = React.useCallback((newValue: boolean) => {
      setLocalValue(newValue);
      onValueChange(newValue);
    }, [onValueChange]);

    return (
      <View className={`px-6 py-4 ${!isLast ? 'border-b border-[#1a1a1a]' : ''}`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Ionicons name={icon as any} size={22} color="#e04429" />
            <View className="ml-4 flex-1">
              <Text className="text-white text-base font-semibold">{title}</Text>
              {subtitle && (
                <Text className="text-gray-400 text-sm mt-1">{subtitle}</Text>
              )}
            </View>
          </View>
          <Switch
            key={`switch-${title}`}
            trackColor={{ false: '#3a3a3a', true: '#e04429' }}
            thumbColor={localValue ? '#fff' : '#ccc'}
            ios_backgroundColor="#3a3a3a"
            onValueChange={handleChange}
            value={localValue}
          />
        </View>
      </View>
    );
  }, (prevProps, nextProps) => {
    return prevProps.value === nextProps.value && 
           prevProps.title === nextProps.title;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 mb-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Notification Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView className="flex-1">
        {/* Push Notifications */}
        <SettingSection title="Push Notifications">
          <SettingItem
            icon="notifications"
            title="Push Notifications"
            subtitle="Enable all push notifications"
            value={pushEnabled}
            onValueChange={handlePushEnabled}
          />
          <SettingItem
            icon="people"
            title="New Matches"
            subtitle="Get notified when you match with someone"
            value={matches}
            onValueChange={handleMatches}
          />
          <SettingItem
            icon="chatbubbles"
            title="Messages"
            subtitle="Get notified about new messages"
            value={messages}
            onValueChange={handleMessages}
          />
          <SettingItem
            icon="school"
            title="Skill Requests"
            subtitle="When someone wants to learn your skills"
            value={skillRequests}
            onValueChange={handleSkillRequests}
          />
          <SettingItem
            icon="person-add"
            title="New Connections"
            subtitle="When your invitation is accepted"
            value={newConnections}
            onValueChange={handleNewConnections}
            isLast={true}
          />
        </SettingSection>

        {/* Email Notifications */}
        <SettingSection title="Email Notifications">
          <SettingItem
            icon="mail"
            title="Email Notifications"
            subtitle="Enable all email notifications"
            value={emailEnabled}
            onValueChange={handleEmailEnabled}
          />
          <SettingItem
            icon="calendar"
            title="Weekly Digest"
            subtitle="Weekly summary of your activity"
            value={weeklyDigest}
            onValueChange={handleWeeklyDigest}
          />
          <SettingItem
            icon="time"
            title="Match Reminders"
            subtitle="Reminders to connect with your matches"
            value={matchReminders}
            onValueChange={handleMatchReminders}
          />
          <SettingItem
            icon="star"
            title="New Features"
            subtitle="Updates about new app features"
            value={newFeatures}
            onValueChange={handleNewFeatures}
          />
          <SettingItem
            icon="megaphone"
            title="Marketing Emails"
            subtitle="Tips, surveys, and special offers"
            value={marketingEmails}
            onValueChange={handleMarketingEmails}
            isLast={true}
          />
        </SettingSection>

        {/* In-App Settings */}
        <SettingSection title="In-App Settings">
          <SettingItem
            icon="volume-high"
            title="Notification Sound"
            subtitle="Play sound for notifications"
            value={soundEnabled}
            onValueChange={handleSoundEnabled}
          />
          <SettingItem
            icon="phone-portrait"
            title="Vibration"
            subtitle="Vibrate for notifications"
            value={vibrationEnabled}
            onValueChange={handleVibrationEnabled}
          />
          <SettingItem
            icon="ellipse"
            title="Badge Count"
            subtitle="Show unread count on app icon"
            value={badgeCount}
            onValueChange={handleBadgeCount}
            isLast={true}
          />
        </SettingSection>

        {/* Activity Notifications */}
        <SettingSection title="Activity Updates">
          <SettingItem
            icon="eye"
            title="Profile Views"
            subtitle="When someone views your profile"
            value={profileViews}
            onValueChange={handleProfileViews}
          />
          <SettingItem
            icon="bookmark"
            title="Saved By Others"
            subtitle="When someone saves your profile"
            value={savedByOthers}
            onValueChange={handleSavedByOthers}
          />
          <SettingItem
            icon="bulb"
            title="Skill Updates"
            subtitle="When there's new activity in your skills"
            value={skillUpdates}
            onValueChange={handleSkillUpdates}
            isLast={true}
          />
        </SettingSection>

        {/* Info Box */}
        <View className="px-6 mb-8">
          <View className="bg-[#2a2a2a] rounded-lg p-4">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#e04429" />
              <Text className="text-gray-300 text-sm ml-3 flex-1 leading-5">
                Some notification settings may be controlled by your device settings. Please check your device's notification settings if you're not receiving notifications.
              </Text>
            </View>
          </View>
        </View>

        {/* Notification Preferences Info */}
        <View className="px-6 mb-8">
          <TouchableOpacity className="bg-[#2a2a2a] rounded-lg p-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white text-base font-semibold mb-1">
                  Quiet Hours
                </Text>
                <Text className="text-gray-400 text-sm">
                  Set times when you don't want to be disturbed
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </TouchableOpacity>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
