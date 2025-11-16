import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, FlatList, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [preference, setPreference] = useState<'online' | 'in-person' | 'hybrid'>('hybrid');
  
  // Location autocomplete state
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Validation state
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    // Cleanup debounce timeout on unmount
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  const loadProfile = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to edit your profile');
        navigation.goBack();
        return;
      }

      const profileDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        setFullName(data.fullName || '');
        setBio(data.bio || '');
        setLocation(data.location || '');
        setPreference(data.preference || 'hybrid');
      }
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile data');
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!bio.trim()) {
      newErrors.bio = 'Bio is required';
    } else if (bio.trim().length < 10) {
      newErrors.bio = 'Bio must be at least 10 characters';
    } else if (bio.trim().length > 200) {
      newErrors.bio = 'Bio must be less than 200 characters';
    }

    if (!location.trim()) {
      newErrors.location = 'Location is required';
    } else if (location.trim().length < 2) {
      newErrors.location = 'Location must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
    if (errors.location) {
      setErrors({ ...errors, location: '' });
    }

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

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to save changes');
        return;
      }

      await updateDoc(doc(db, 'profiles', currentUser.uid), {
        fullName: fullName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        preference: preference,
        updatedAt: new Date().toISOString(),
      });

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const PreferenceButton = ({ 
    value, 
    label, 
    icon 
  }: { 
    value: 'online' | 'in-person' | 'hybrid', 
    label: string, 
    icon: string 
  }) => {
    const isSelected = preference === value;
    return (
      <TouchableOpacity
        onPress={() => setPreference(value)}
        className={`flex-1 py-3 px-4 rounded-lg border-2 ${
          isSelected ? 'border-orange-500 bg-[#5a3825]' : 'border-gray-700 bg-[#2a2a2a]'
        }`}
      >
        <View className="items-center">
          <Ionicons 
            name={icon as any} 
            size={24} 
            color={isSelected ? '#e04429' : '#666'} 
          />
          <Text className={`text-sm font-semibold mt-1 ${
            isSelected ? 'text-orange-500' : 'text-gray-400'
          }`}>
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

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
        <Text className="text-white text-xl font-bold">Edit Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Full Name */}
        <View className="mb-6">
          <Text className="text-white text-base font-semibold mb-2">Full Name</Text>
          <TextInput
            placeholder="Enter your full name"
            placeholderTextColor="#666"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (errors.fullName) {
                setErrors({ ...errors, fullName: '' });
              }
            }}
            autoCorrect={false}
            autoCapitalize="words"
            className="bg-[#2a2a2a] border border-gray-700 rounded-lg text-white px-4 py-3"
          />
          {errors.fullName && (
            <View className="flex-row items-center mt-2">
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text className="text-red-500 text-sm ml-1">{errors.fullName}</Text>
            </View>
          )}
        </View>

        {/* Bio */}
        <View className="mb-6">
          <Text className="text-white text-base font-semibold mb-2">Bio</Text>
          <TextInput
            placeholder="Tell us about yourself..."
            placeholderTextColor="#666"
            value={bio}
            onChangeText={(text) => {
              setBio(text);
              if (errors.bio) {
                setErrors({ ...errors, bio: '' });
              }
            }}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={200}
            autoCorrect={true}
            autoCapitalize="sentences"
            className="bg-[#2a2a2a] border border-gray-700 rounded-lg text-white px-4 py-3 h-24"
          />
          <View className="flex-row justify-between items-center mt-2">
            {errors.bio ? (
              <View className="flex-row items-center">
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text className="text-red-500 text-sm ml-1">{errors.bio}</Text>
              </View>
            ) : (
              <View />
            )}
            <Text className="text-gray-500 text-xs">{bio.length}/200</Text>
          </View>
        </View>

        {/* Location */}
        <View className="mb-6">
          <Text className="text-white text-base font-semibold mb-2">Location</Text>
          <Text className="text-gray-500 text-xs mb-2">Your city and country help match you with nearby learners</Text>
          <View className="relative">
            <View className="flex-row items-center bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-3">
              <Ionicons name="location-outline" size={20} color="#e04429" />
              <TextInput
                placeholder="Start typing city name..."
                placeholderTextColor="#666"
                value={location}
                onChangeText={handleLocationChange}
                autoCorrect={false}
                autoCapitalize="words"
                className="flex-1 text-white ml-2"
              />
              {loadingSuggestions && (
                <ActivityIndicator size="small" color="#e04429" />
              )}
            </View>
            
            {/* Location Suggestions Dropdown */}
            {showSuggestions && locationSuggestions.length > 0 && (
              <View 
                className="absolute top-full left-0 right-0 mt-1 bg-[#2a2a2a] border border-gray-700 rounded-lg overflow-hidden"
                style={{ zIndex: 1000 }}
              >
                <FlatList
                  data={locationSuggestions}
                  keyExtractor={(item, index) => `${item.lat}-${item.lon}-${index}`}
                  scrollEnabled={false}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      onPress={() => handleSelectLocation(item)}
                      className={`px-4 py-3 flex-row items-center ${
                        index !== locationSuggestions.length - 1 ? 'border-b border-gray-700' : ''
                      }`}
                    >
                      <Ionicons name="location" size={16} color="#e04429" />
                      <Text className="text-white text-sm ml-2 flex-1" numberOfLines={2}>
                        {item.display_name}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
          {errors.location && (
            <View className="flex-row items-center mt-2">
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text className="text-red-500 text-sm ml-1">{errors.location}</Text>
            </View>
          )}
        </View>

        {/* Learning Preference */}
        <View className="mb-8">
          <Text className="text-white text-base font-semibold mb-3">Learning Preference</Text>
          <View className="flex-row gap-3">
            <PreferenceButton value="online" label="Online" icon="globe-outline" />
            <PreferenceButton value="in-person" label="In-Person" icon="people-outline" />
            <PreferenceButton value="hybrid" label="Hybrid" icon="git-merge-outline" />
          </View>
          <Text className="text-gray-500 text-sm mt-3">
            Choose how you prefer to learn and teach skills
          </Text>
        </View>

        {/* Save Button */}
        <View className="mb-8">
          <TouchableOpacity 
            onPress={handleSave}
            disabled={saving}
            className="rounded-full overflow-hidden"
          >
            <LinearGradient
              colors={['#ed7b2d', '#e04429']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ 
                paddingVertical: 16, 
                alignItems: 'center',
                opacity: saving ? 0.7 : 1 
              }}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Save Changes</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
