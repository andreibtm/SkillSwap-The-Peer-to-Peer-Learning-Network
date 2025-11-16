import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, FlatList, Keyboard } from 'react-native';
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
import { AVAILABLE_SKILLS } from '../constants/skills';

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function NewUserScreen() {
  const navigation = useNavigation();
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [preference, setPreference] = useState<'online' | 'inperson' | 'both'>('inperson');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  // Skills state
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [interestedSkills, setInterestedSkills] = useState<string[]>([]);
  const [interestedSkillSearch, setInterestedSkillSearch] = useState('');
  
  // Location autocomplete state
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup debounce timeout on unmount
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  const fetchLocationSuggestions = async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'SkillSwap/1.0',
          },
        }
      );
      const data = await response.json();
      setLocationSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (error) {
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleLocationChange = (text: string) => {
    setLocation(text);

    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set new timeout for debounced search
    debounceTimeout.current = setTimeout(() => {
      fetchLocationSuggestions(text);
    }, 500); // 500ms debounce
  };

  const handleSelectLocation = (suggestion: LocationSuggestion) => {
    // Extract city and country from display_name
    const parts = suggestion.display_name.split(',');
    let locationText = '';
    
    if (parts.length >= 2) {
      // Try to get city (first part) and country (last part)
      const city = parts[0].trim();
      const country = parts[parts.length - 1].trim();
      locationText = `${city}, ${country}`;
    } else {
      locationText = suggestion.display_name;
    }
    
    setLocation(locationText);
    setShowSuggestions(false);
    setLocationSuggestions([]);
    Keyboard.dismiss();
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const toggleInterestedSkill = (skill: string) => {
    if (interestedSkills.includes(skill)) {
      setInterestedSkills(interestedSkills.filter(s => s !== skill));
    } else {
      setInterestedSkills([...interestedSkills, skill]);
    }
  };

  const filteredSkills = AVAILABLE_SKILLS.filter(skill =>
    skill.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const filteredInterestedSkills = AVAILABLE_SKILLS.filter(skill =>
    skill.toLowerCase().includes(interestedSkillSearch.toLowerCase())
  );

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

      // Convert photo to base64
      const base64Photo = await FileSystem.readAsStringAsync(photoUri, {
        encoding: 'base64',
      });
      const photoBase64 = `data:image/jpeg;base64,${base64Photo}`;
      
      // Save profile data to Firestore with base64 photo
      await setDoc(doc(db, 'profiles', currentUser.uid), {
        userId: currentUser.uid,
        fullName: fullName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        preference,
        photoUri: photoBase64,
        skills: selectedSkills,
        interestedSkills: interestedSkills,
        level: 'Beginner',
        availability: 'Flexible',
        savedProfiles: [],
        rating: 0,
        ratingCount: 0,
        createdAt: new Date().toISOString(),
      });

      // Navigate to main tabs
      navigation.navigate('MainTabs' as never);
    } catch (error: any) {
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
          <View className="relative">
            <View className="flex-row items-center bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-3">
              <TextInput
                placeholder="Enter your city"
                placeholderTextColor="#666"
                value={location}
                onChangeText={handleLocationChange}
                className="flex-1 text-white"
                onFocus={() => {
                  if (location.length >= 3 && locationSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
              />
              <TouchableOpacity onPress={getLocation} disabled={loadingLocation}>
                <Ionicons 
                  name={loadingLocation ? "sync" : "location-outline"} 
                  size={20} 
                  color={loadingLocation ? "#e67e50" : "#666"} 
                />
              </TouchableOpacity>
            </View>
            
            {/* Location Suggestions Dropdown */}
            {showSuggestions && locationSuggestions.length > 0 && (
              <View className="absolute top-full left-0 right-0 mt-1 bg-[#2a2a2a] border border-gray-700 rounded-lg max-h-48 z-50">
                <FlatList
                  data={locationSuggestions}
                  keyExtractor={(item, index) => `${item.lat}-${item.lon}-${index}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => handleSelectLocation(item)}
                      className="px-4 py-3 border-b border-gray-700"
                    >
                      <Text className="text-white text-sm" numberOfLines={2}>
                        {item.display_name}
                      </Text>
                    </TouchableOpacity>
                  )}
                  nestedScrollEnabled
                />
              </View>
            )}
          </View>
        </View>

        {/* Skills Selection */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white text-base font-semibold">
              Your Skills
            </Text>
            <Text className="text-gray-500 text-xs">
              (Don't worry, you can add more later! :)
            </Text>
          </View>
          
          {/* Skills Search */}
          <View className="flex-row items-center bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-3 mb-3">
            <Ionicons name="search" size={18} color="#666" />
            <TextInput
              placeholder="Search skills..."
              placeholderTextColor="#666"
              value={skillSearch}
              onChangeText={setSkillSearch}
              className="flex-1 text-white ml-2"
            />
            {skillSearch.length > 0 && (
              <TouchableOpacity onPress={() => setSkillSearch('')}>
                <Ionicons name="close-circle" size={18} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {/* Selected Skills */}
          {selectedSkills.length > 0 && (
            <View className="flex-row flex-wrap mb-3">
              {selectedSkills.map((skill) => (
                <TouchableOpacity
                  key={skill}
                  onPress={() => toggleSkill(skill)}
                  className="bg-[#5a3825] rounded-full px-4 py-2 mr-2 mb-2 flex-row items-center"
                >
                  <Text className="text-orange-200 text-sm font-medium mr-1">{skill}</Text>
                  <Ionicons name="close" size={16} color="#e04429" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Available Skills */}
          <View className="bg-[#2a2a2a] border border-gray-700 rounded-lg p-3 max-h-40">
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap">
                {filteredSkills.map((skill) => (
                  <TouchableOpacity
                    key={skill}
                    onPress={() => toggleSkill(skill)}
                    className={`rounded-full px-4 py-2 mr-2 mb-2 ${
                      selectedSkills.includes(skill)
                        ? 'bg-orange-500'
                        : 'bg-[#3a3a3a] border border-gray-600'
                    }`}
                  >
                    <Text className={`text-sm ${
                      selectedSkills.includes(skill) ? 'text-white font-medium' : 'text-gray-300'
                    }`}>
                      {skill}
                    </Text>
                  </TouchableOpacity>
                ))}
                {filteredSkills.length === 0 && (
                  <Text className="text-gray-500 text-sm">No skills found</Text>
                )}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Interested Skills Selection */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white text-base font-semibold">
              Skills You Want to Learn
            </Text>
            <Text className="text-gray-500 text-xs">
              (Optional)
            </Text>
          </View>
          
          {/* Interested Skills Search */}
          <View className="flex-row items-center bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-3 mb-3">
            <Ionicons name="search" size={18} color="#666" />
            <TextInput
              placeholder="Search skills you want to learn..."
              placeholderTextColor="#666"
              value={interestedSkillSearch}
              onChangeText={setInterestedSkillSearch}
              className="flex-1 text-white ml-2"
            />
            {interestedSkillSearch.length > 0 && (
              <TouchableOpacity onPress={() => setInterestedSkillSearch('')}>
                <Ionicons name="close-circle" size={18} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {/* Selected Interested Skills */}
          {interestedSkills.length > 0 && (
            <View className="flex-row flex-wrap mb-3">
              {interestedSkills.map((skill) => (
                <TouchableOpacity
                  key={skill}
                  onPress={() => toggleInterestedSkill(skill)}
                  className="bg-[#2a3a4a] rounded-full px-4 py-2 mr-2 mb-2 flex-row items-center"
                >
                  <Text className="text-blue-200 text-sm font-medium mr-1">{skill}</Text>
                  <Ionicons name="close" size={16} color="#4a90e2" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Available Interested Skills */}
          <View className="bg-[#2a2a2a] border border-gray-700 rounded-lg p-3 max-h-40">
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap">
                {filteredInterestedSkills.map((skill) => (
                  <TouchableOpacity
                    key={skill}
                    onPress={() => toggleInterestedSkill(skill)}
                    className={`rounded-full px-4 py-2 mr-2 mb-2 ${
                      interestedSkills.includes(skill)
                        ? 'bg-blue-500'
                        : 'bg-[#3a3a3a] border border-gray-600'
                    }`}
                  >
                    <Text className={`text-sm ${
                      interestedSkills.includes(skill) ? 'text-white font-medium' : 'text-gray-300'
                    }`}>
                      {skill}
                    </Text>
                  </TouchableOpacity>
                ))}
                {filteredInterestedSkills.length === 0 && (
                  <Text className="text-gray-500 text-sm">No skills found</Text>
                )}
              </View>
            </ScrollView>
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