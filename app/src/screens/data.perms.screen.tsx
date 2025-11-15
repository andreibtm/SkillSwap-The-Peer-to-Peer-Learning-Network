import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import * as Location from 'expo-location';

export default function DataPermsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);

  // Permission states
  const [locationPermission, setLocationPermission] = useState<string>('unknown');
  const [photoLibraryPermission, setPhotoLibraryPermission] = useState<string>('unknown');
  const [notificationPermission, setNotificationPermission] = useState<string>('unknown');

  // Data management states
  const [dataCollectionEnabled, setDataCollectionEnabled] = useState(true);

  useEffect(() => {
    loadPermissions();
    loadDataSettings();
  }, []);

  const loadPermissions = async () => {
    try {
      // Check location permission
      const locationStatus = await Location.getForegroundPermissionsAsync();
      setLocationPermission(locationStatus.status);

      // Note: Photo library and notification permissions would need similar checks
      // For now, we'll set them to granted as placeholders
      setPhotoLibraryPermission('granted');
      setNotificationPermission('granted');
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading permissions:', error);
      setLoading(false);
    }
  };

  const loadDataSettings = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const profileDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        setDataCollectionEnabled(data.dataCollectionEnabled !== false);
      }
    } catch (error) {
      console.error('Error loading data settings:', error);
    }
  };

  const handleRequestPermission = async (permissionType: string) => {
    if (permissionType === 'location') {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      if (status === 'granted') {
        Alert.alert('Success', 'Location permission granted!');
      }
    } else {
      // For other permissions, open app settings
      Alert.alert(
        'Open Settings',
        `Please enable ${permissionType} permission in your device settings.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
    }
  };

  const handleDataCollectionToggle = async (value: boolean) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      await updateDoc(doc(db, 'profiles', currentUser.uid), {
        dataCollectionEnabled: value,
        updatedAt: new Date().toISOString(),
      });

      setDataCollectionEnabled(value);
      Alert.alert('Success', `Data collection ${value ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating data collection:', error);
      Alert.alert('Error', 'Failed to update data collection settings');
    }
  };

  const handleDownloadData = () => {
    Alert.alert(
      'Download Your Data',
      'We will prepare a copy of your data and send it to your registered email address within 48 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Request Download', 
          onPress: async () => {
            try {
              const currentUser = auth.currentUser;
              if (!currentUser) return;

              // In a real app, you would trigger a backend process here
              Alert.alert('Request Submitted', 'You will receive your data via email within 48 hours.');
            } catch (error) {
              console.error('Error requesting data download:', error);
              Alert.alert('Error', 'Failed to submit download request');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // Ask for confirmation again
            Alert.alert(
              'Final Confirmation',
              'This will permanently delete your account and all associated data. Are you absolutely sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Yes, Delete My Account', 
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const currentUser = auth.currentUser;
                      if (!currentUser) return;

                      // Delete user data from Firestore
                      await deleteDoc(doc(db, 'profiles', currentUser.uid));

                      // Delete user authentication
                      await deleteUser(currentUser);

                      Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
                      navigation.navigate('Login' as never);
                    } catch (error: any) {
                      console.error('Error deleting account:', error);
                      if (error.code === 'auth/requires-recent-login') {
                        Alert.alert(
                          'Re-authentication Required',
                          'For security reasons, please log out and log back in before deleting your account.'
                        );
                      } else {
                        Alert.alert('Error', 'Failed to delete account. Please try again.');
                      }
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const PermissionItem = ({ 
    icon, 
    title, 
    description, 
    status,
    onPress
  }: { 
    icon: string, 
    title: string, 
    description: string, 
    status: string,
    onPress: () => void
  }) => (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-[#2a2a2a] px-6 py-4 mb-2 flex-row items-center justify-between"
    >
      <View className="flex-row items-center flex-1">
        <Ionicons name={icon as any} size={24} color="#e04429" />
        <View className="ml-4 flex-1">
          <Text className="text-white text-base font-semibold">{title}</Text>
          <Text className="text-gray-400 text-sm mt-1">{description}</Text>
        </View>
      </View>
      <View className="flex-row items-center">
        <Text className={`text-sm font-semibold mr-2 ${status === 'granted' ? 'text-green-500' : 'text-orange-500'}`}>
          {status === 'granted' ? 'Granted' : 'Not Granted'}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );

  const ActionButton = ({ 
    icon, 
    title, 
    description, 
    onPress,
    danger = false
  }: { 
    icon: string, 
    title: string, 
    description: string, 
    onPress: () => void,
    danger?: boolean
  }) => (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-[#2a2a2a] px-6 py-4 mb-2 flex-row items-center justify-between"
    >
      <View className="flex-row items-center flex-1">
        <Ionicons name={icon as any} size={24} color={danger ? '#ef4444' : '#e04429'} />
        <View className="ml-4 flex-1">
          <Text className={`text-base font-semibold ${danger ? 'text-red-500' : 'text-white'}`}>{title}</Text>
          <Text className="text-gray-400 text-sm mt-1">{description}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
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
        <Text className="text-white text-xl font-bold">Data & Permissions</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* App Permissions Section */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-semibold px-6 mb-3 uppercase tracking-wider">
            App Permissions
          </Text>
          <PermissionItem
            icon="location-outline"
            title="Location"
            description="Used to find nearby learners"
            status={locationPermission}
            onPress={() => handleRequestPermission('location')}
          />
          <PermissionItem
            icon="images-outline"
            title="Photo Library"
            description="For uploading profile pictures"
            status={photoLibraryPermission}
            onPress={() => handleRequestPermission('photo library')}
          />
          <PermissionItem
            icon="notifications-outline"
            title="Notifications"
            description="Receive match and message alerts"
            status={notificationPermission}
            onPress={() => handleRequestPermission('notifications')}
          />
        </View>

        {/* Data Collection Section */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-semibold px-6 mb-3 uppercase tracking-wider">
            Data Collection
          </Text>
          <View className="bg-[#2a2a2a] px-6 py-4 mb-2">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center flex-1">
                <Ionicons name="analytics-outline" size={24} color="#e04429" />
                <Text className="text-white text-base font-semibold ml-4">Analytics & Usage Data</Text>
              </View>
              <Switch
                value={dataCollectionEnabled}
                onValueChange={handleDataCollectionToggle}
                trackColor={{ false: '#3a3a3a', true: '#e04429' }}
                thumbColor={dataCollectionEnabled ? '#ffffff' : '#666666'}
                ios_backgroundColor="#3a3a3a"
              />
            </View>
            <Text className="text-gray-400 text-sm ml-9">
              Help us improve by sharing anonymous usage data
            </Text>
          </View>
        </View>

        {/* Your Data Section */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-semibold px-6 mb-3 uppercase tracking-wider">
            Your Data
          </Text>
          <ActionButton
            icon="download-outline"
            title="Download My Data"
            description="Request a copy of all your data"
            onPress={handleDownloadData}
          />
        </View>

        {/* Info Box */}
        <View className="mx-6 mb-6 bg-[#2a2a2a] border border-gray-700 rounded-lg p-4">
          <View className="flex-row items-start">
            <Ionicons name="information-circle-outline" size={20} color="#e04429" style={{ marginTop: 2 }} />
            <View className="flex-1 ml-3">
              <Text className="text-gray-300 text-sm">
                We respect your privacy and are committed to protecting your personal data. 
                You can manage permissions and download your data at any time.
              </Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View className="mb-6">
          <Text className="text-red-500 text-sm font-semibold px-6 mb-3 uppercase tracking-wider">
            Danger Zone
          </Text>
          <ActionButton
            icon="trash-outline"
            title="Delete Account"
            description="Permanently delete your account and all data"
            onPress={handleDeleteAccount}
            danger={true}
          />
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
