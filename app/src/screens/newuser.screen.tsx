import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system/legacy';
import { auth, db } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export default function NewUserScreen() {
  const navigation = useNavigation();
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [preference, setPreference] = useState<'online' | 'inperson' | 'both'>('inperson');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const getLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to get your city');
        setLoadingLocation(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const { city, region } = reverseGeocode[0];
        const locationString = city ? `${city}, ${region}` : region || 'Unknown';
        setLocation(locationString);
      }
      
      setLoadingLocation(false);
    } catch (error) {
      Alert.alert('Error', 'Could not get your location');
      setLoadingLocation(false);
    }
  };

  const handlePhotoUpload = () => {
    Alert.alert(
      'Upload Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Gallery',
          onPress: pickFromGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery permission is required to select photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSkip = async () => {
    try {
      await signOut(auth);
      navigation.navigate('Login' as never);
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to log out');
    }
  };

  const handleContinue = async () => {
    try {
      // Validate required fields
      if (!fullName.trim() || !bio.trim() || !location.trim() || !photoUri) {
        Alert.alert('Error', 'Please fill in all fields and upload a photo');
        return;
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'No user logged in');
        return;
      }

      console.log('Converting photo to base64...');
      
      // Convert photo to base64
      const base64Photo = await FileSystem.readAsStringAsync(photoUri, {
        encoding: 'base64',
      });
      const photoBase64 = `data:image/jpeg;base64,${base64Photo}`;
      
      console.log('Photo converted successfully');

      // Save profile data to Firestore with base64 photo
      await setDoc(doc(db, 'profiles', currentUser.uid), {
        userId: currentUser.uid,
        fullName: fullName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        preference,
        photoUri: photoBase64,
        skills: [], // Will be added later
        level: 'beginner', // Default value
        availability: 'flexible', // Default value
        savedProfiles: [], // Initialize empty saved profiles array
        createdAt: new Date().toISOString()
      });

      console.log('Profile saved successfully!');
      // Navigate to main tabs
      navigation.navigate('MainTabs' as never);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      <ScrollView className="flex-1 bg-[#1a1a1a]">
        <View className="px-6 py-4">
          {/* Header */}
          <View className="mb-8 items-center">
            <Text className="text-white text-xl font-bold">Create Your Profile</Text>
            {/* Skip Button */}
            <TouchableOpacity
              onPress={handleSkip}
              className="absolute right-0 top-0 w-8 h-8 rounded-full bg-gray-800 items-center justify-center border border-gray-700"
            >
              <Ionicons name="close" size={20} color="#999" />
            </TouchableOpacity>
          </View>

        {/* Upload Photo */}
        <View className="items-center mb-8">
          <TouchableOpacity 
            onPress={handlePhotoUpload}
            className="w-32 h-32 rounded-full border-2 border-dashed border-orange-500 items-center justify-center mb-3 overflow-hidden"
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} className="w-full h-full" />
            ) : (
              <Ionicons name="camera" size={40} color="#e67e50" />
            )}
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold mb-1">Upload a Photo</Text>
          <Text className="text-gray-400 text-sm">Help others recognize you</Text>
        </View>

        {/* Full Name */}
        <View className="mb-6">
          <Text className="text-white text-base font-semibold mb-2">Full Name</Text>
          <TextInput
            placeholder="Enter your full name"
            placeholderTextColor="#666"
            value={fullName}
            onChangeText={setFullName}
            autoCorrect={false}
            autoCapitalize="words"
            className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg text-white px-4 py-3"
          />
        </View>

        {/* Short Bio */}
        <View className="mb-6">
          <Text className="text-white text-base font-semibold mb-2">Short Bio</Text>
          <TextInput
            placeholder="What are you passionate about learning or teaching?"
            placeholderTextColor="#666"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            autoCorrect={false}
            autoCapitalize="sentences"
            className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg text-white px-4 py-3 h-32"
          />
        </View>

        {/* Location */}
        <View className="mb-6">
          <Text className="text-white text-base font-semibold mb-2">Your Location</Text>
          <View className="flex-row items-center bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-3">
            <TextInput
              placeholder="Enter your city"
              placeholderTextColor="#666"
              value={location}
              onChangeText={setLocation}
              className="flex-1 text-white"
            />
            <TouchableOpacity onPress={getLocation} disabled={loadingLocation}>
              <Ionicons 
                name={loadingLocation ? "sync" : "location-outline"} 
                size={20} 
                color={loadingLocation ? "#e67e50" : "#666"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Learning Preference */}
        <View className="mb-8">
          <Text className="text-white text-base font-semibold mb-3">How do you prefer to learn/connect?</Text>
          
          {/* Online Option */}
          <TouchableOpacity
            onPress={() => setPreference('online')}
            className={`flex-row items-center border-2 rounded-lg px-4 py-4 mb-3 ${
              preference === 'online' ? 'border-orange-500 bg-[#2a2a2a]' : 'border-gray-700 bg-transparent'
            }`}
          >
            <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
              preference === 'online' ? 'border-orange-500' : 'border-gray-600'
            }`}>
              {preference === 'online' && (
                <View className="w-3 h-3 rounded-full bg-orange-500" />
              )}
            </View>
            <Text className="text-white text-base">Online</Text>
          </TouchableOpacity>

          {/* In Person Option */}
          <TouchableOpacity
            onPress={() => setPreference('inperson')}
            className={`flex-row items-center border-2 rounded-lg px-4 py-4 mb-3 ${
              preference === 'inperson' ? 'border-orange-500 bg-[#2a2a2a]' : 'border-gray-700 bg-transparent'
            }`}
          >
            <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
              preference === 'inperson' ? 'border-orange-500' : 'border-gray-600'
            }`}>
              {preference === 'inperson' && (
                <View className="w-3 h-3 rounded-full bg-orange-500" />
              )}
            </View>
            <Text className="text-white text-base">In Person</Text>
          </TouchableOpacity>

          {/* Both Option */}
          <TouchableOpacity
            onPress={() => setPreference('both')}
            className={`flex-row items-center border-2 rounded-lg px-4 py-4 ${
              preference === 'both' ? 'border-orange-500 bg-[#2a2a2a]' : 'border-gray-700 bg-transparent'
            }`}
          >
            <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
              preference === 'both' ? 'border-orange-500' : 'border-gray-600'
            }`}>
              {preference === 'both' && (
                <View className="w-3 h-3 rounded-full bg-orange-500" />
              )}
            </View>
            <Text className="text-white text-base">Both</Text>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          onPress={handleContinue}
          className="w-full rounded-full overflow-hidden mb-8"
        >
          <LinearGradient
            colors={['#ed7b2d', '#e04429']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ paddingVertical: 16 }}
          >
            <Text className="text-white text-center text-lg font-bold">Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}