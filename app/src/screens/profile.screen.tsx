import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [newSkill, setNewSkill] = useState('');
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newInterestedSkill, setNewInterestedSkill] = useState('');
  const [isAddingInterestedSkill, setIsAddingInterestedSkill] = useState(false);
  const [refreshingLocation, setRefreshingLocation] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const profileDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
      if (profileDoc.exists()) {
        setProfile({ id: profileDoc.id, ...profileDoc.data() });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) {
      Alert.alert('Error', 'Please enter a skill');
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const updatedSkills = [...(profile.skills || []), newSkill.trim()];
      await updateDoc(doc(db, 'profiles', currentUser.uid), {
        skills: updatedSkills
      });

      setProfile({ ...profile, skills: updatedSkills });
      setNewSkill('');
      setIsAddingSkill(false);
    } catch (error) {
      console.error('Error adding skill:', error);
      Alert.alert('Error', 'Failed to add skill');
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const updatedSkills = profile.skills.filter((skill: string) => skill !== skillToRemove);
      await updateDoc(doc(db, 'profiles', currentUser.uid), {
        skills: updatedSkills
      });

      setProfile({ ...profile, skills: updatedSkills });
    } catch (error) {
      console.error('Error removing skill:', error);
      Alert.alert('Error', 'Failed to remove skill');
    }
  };

  const handleAddInterestedSkill = async () => {
    if (!newInterestedSkill.trim()) {
      Alert.alert('Error', 'Please enter a skill you\'re interested in');
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const updatedInterestedSkills = [...(profile.interestedSkills || []), newInterestedSkill.trim()];
      await updateDoc(doc(db, 'profiles', currentUser.uid), {
        interestedSkills: updatedInterestedSkills
      });

      setProfile({ ...profile, interestedSkills: updatedInterestedSkills });
      setNewInterestedSkill('');
      setIsAddingInterestedSkill(false);
    } catch (error) {
      console.error('Error adding interested skill:', error);
      Alert.alert('Error', 'Failed to add interested skill');
    }
  };

  const handleRemoveInterestedSkill = async (skillToRemove: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const updatedInterestedSkills = profile.interestedSkills.filter((skill: string) => skill !== skillToRemove);
      await updateDoc(doc(db, 'profiles', currentUser.uid), {
        interestedSkills: updatedInterestedSkills
      });

      setProfile({ ...profile, interestedSkills: updatedInterestedSkills });
    } catch (error) {
      console.error('Error removing interested skill:', error);
      Alert.alert('Error', 'Failed to remove interested skill');
    }
  };

  const handleUpdatePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos to update your profile picture');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        console.log('Converting photo to base64...');

        // Convert photo to base64
        const base64Photo = await FileSystem.readAsStringAsync(result.assets[0].uri, {
          encoding: 'base64',
        });
        const photoBase64 = `data:image/jpeg;base64,${base64Photo}`;
        
        console.log('Photo converted successfully');

        // Update Firestore with base64 photo
        await updateDoc(doc(db, 'profiles', currentUser.uid), {
          photoUri: photoBase64
        });

        setProfile({ ...profile, photoUri: photoBase64 });
        Alert.alert('Success', 'Profile picture updated!');
      }
    } catch (error) {
      console.error('Error updating photo:', error);
      Alert.alert('Error', 'Failed to update photo');
    }
  };

  const handleRefreshLocation = async () => {
    setRefreshingLocation(true);
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to refresh your location');
        setRefreshingLocation(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocode to get city and country
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            'User-Agent': 'SkillSwap/1.0',
          },
        }
      );
      const data = await response.json();
      
      // Extract city and country
      const address = data.address;
      const city = address.city || address.town || address.village || address.county || '';
      const country = address.country || '';
      const newLocation = city && country ? `${city}, ${country}` : data.display_name;

      // Update Firestore
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      await updateDoc(doc(db, 'profiles', currentUser.uid), {
        location: newLocation
      });

      setProfile({ ...profile, location: newLocation });
      Alert.alert('Success', `Location updated to ${newLocation}`);
    } catch (error) {
      console.error('Error refreshing location:', error);
      Alert.alert('Error', 'Failed to refresh location. Please try again.');
    } finally {
      setRefreshingLocation(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.navigate('Login' as never);
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-lg">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-lg">Profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 py-4">
          <View className="flex-row items-center justify-between absolute left-6 right-6 top-4 z-10">
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={28} color="#e04429" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Settings' as never)}>
              <Ionicons name="settings-outline" size={28} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="text-white text-xl font-bold text-center">My Profile</Text>
        </View>

        {/* Profile Picture */}
        <View className="items-center mt-6 mb-4">
          <TouchableOpacity onPress={handleUpdatePhoto}>
            {profile.photoUri ? (
              <Image 
                source={{ uri: profile.photoUri }} 
                style={{ 
                  width: 120, 
                  height: 120, 
                  borderRadius: 60,
                  borderWidth: 3,
                  borderColor: '#e04429'
                }}
                resizeMode="cover"
              />
            ) : (
              <View 
                style={{ 
                  width: 120, 
                  height: 120, 
                  borderRadius: 60,
                  backgroundColor: '#3a3a3a',
                  borderWidth: 3,
                  borderColor: '#e04429',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Ionicons name="person" size={60} color="#666" />
              </View>
            )}
            {/* Edit Icon */}
            <View 
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: '#e04429',
                borderRadius: 15,
                width: 30,
                height: 30,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Name */}
        <Text className="text-white text-2xl font-bold text-center mb-2">
          {profile.fullName}
        </Text>

        {/* Rating */}
        <View className="flex-row items-center justify-center mb-4">
          <Ionicons name="star" size={20} color="#ffa500" />
          <Text className="text-gray-300 text-base ml-2">
            {profile.rating ? profile.rating.toFixed(1) : '0.0'} ({profile.ratingCount || 0} ratings)
          </Text>
        </View>

        {/* Bio */}
        <View className="px-6 mb-6">
          <Text className="text-gray-400 text-base text-center italic">
            "{profile.bio}"
          </Text>
        </View>

        {/* Location & Preference */}
        <View className="flex-row justify-center items-center gap-4 mb-4">
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={18} color="#e04429" />
            <Text className="text-gray-300 text-sm ml-1">{profile.location}</Text>
            <TouchableOpacity 
              onPress={handleRefreshLocation}
              disabled={refreshingLocation}
              className="ml-2"
            >
              {refreshingLocation ? (
                <ActivityIndicator size="small" color="#e04429" />
              ) : (
                <Ionicons name="refresh" size={16} color="#e04429" />
              )}
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="golf-outline" size={18} color="#e04429" />
            <Text className="text-gray-300 text-sm ml-1 capitalize">{profile.preference}</Text>
          </View>
        </View>

        {/* Skills Section */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-xl font-bold">My Skills</Text>
            <TouchableOpacity 
              onPress={() => setIsAddingSkill(!isAddingSkill)}
              className="bg-[#2a2a2a] px-4 py-2 rounded-full"
            >
              <Text className="text-orange-500 font-semibold">
                {isAddingSkill ? 'Cancel' : '+ Add Skill'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Add Skill Input */}
          {isAddingSkill && (
            <View className="mb-4">
              <View className="flex-row gap-2">
                <TextInput
                  placeholder="Enter a skill (e.g., Python, Guitar, Cooking)"
                  placeholderTextColor="#666"
                  value={newSkill}
                  onChangeText={setNewSkill}
                  autoCorrect={false}
                  autoCapitalize="words"
                  className="flex-1 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white px-4 py-3"
                />
                <TouchableOpacity 
                  onPress={handleAddSkill}
                  className="rounded-lg overflow-hidden"
                >
                  <LinearGradient
                    colors={['#ed7b2d', '#e04429']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={{ paddingHorizontal: 20, paddingVertical: 12 }}
                  >
                    <Text className="text-white font-semibold">Add</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Skills List */}
          {profile.skills && profile.skills.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {profile.skills.map((skill: string, index: number) => (
                <View 
                  key={index}
                  className="bg-[#5a3825] px-4 py-2 rounded-full flex-row items-center"
                >
                  <Text className="text-orange-200 mr-2">{skill}</Text>
                  <TouchableOpacity onPress={() => handleRemoveSkill(skill)}>
                    <Ionicons name="close-circle" size={18} color="#e04429" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-gray-500 text-center py-4">
              No skills added yet. Add your first skill!
            </Text>
          )}
        </View>

        {/* Interested Skills Section */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-xl font-bold">Interested In Learning</Text>
            <TouchableOpacity 
              onPress={() => setIsAddingInterestedSkill(!isAddingInterestedSkill)}
              className="bg-[#2a2a2a] px-4 py-2 rounded-full"
            >
              <Text className="text-orange-500 font-semibold">
                {isAddingInterestedSkill ? 'Cancel' : '+ Add Interest'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Add Interested Skill Input */}
          {isAddingInterestedSkill && (
            <View className="mb-4">
              <View className="flex-row gap-2">
                <TextInput
                  placeholder="What do you want to learn? (e.g., Spanish, Yoga)"
                  placeholderTextColor="#666"
                  value={newInterestedSkill}
                  onChangeText={setNewInterestedSkill}
                  autoCorrect={false}
                  autoCapitalize="words"
                  className="flex-1 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white px-4 py-3"
                />
                <TouchableOpacity 
                  onPress={handleAddInterestedSkill}
                  className="rounded-lg overflow-hidden"
                >
                  <LinearGradient
                    colors={['#ed7b2d', '#e04429']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={{ paddingHorizontal: 20, paddingVertical: 12 }}
                  >
                    <Text className="text-white font-semibold">Add</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Interested Skills List */}
          {profile.interestedSkills && profile.interestedSkills.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {profile.interestedSkills.map((skill: string, index: number) => (
                <View 
                  key={index}
                  className="bg-[#2a3a4a] px-4 py-2 rounded-full flex-row items-center"
                >
                  <Text className="text-blue-200 mr-2">{skill}</Text>
                  <TouchableOpacity onPress={() => handleRemoveInterestedSkill(skill)}>
                    <Ionicons name="close-circle" size={18} color="#4a90e2" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-gray-500 text-center py-4">
              No interests added yet. What would you like to learn?
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
