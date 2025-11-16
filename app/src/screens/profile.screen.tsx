import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { AVAILABLE_SKILLS } from '../constants/skills';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [selectedNewSkills, setSelectedNewSkills] = useState<string[]>([]);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [selectedNewInterestedSkills, setSelectedNewInterestedSkills] = useState<string[]>([]);
  const [isAddingInterestedSkill, setIsAddingInterestedSkill] = useState(false);
  const [interestedSkillSearch, setInterestedSkillSearch] = useState('');
  const [refreshingLocation, setRefreshingLocation] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);

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

  const loadReviews = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Query ratings collection for ratings given to this user
      const ratingsRef = collection(db, 'ratings');
      const q = query(ratingsRef, where('toUserId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);

      const reviewsList = [];
      for (const docSnapshot of querySnapshot.docs) {
        const ratingData = docSnapshot.data();
        
        // Get the reviewer's profile
        const reviewerDoc = await getDoc(doc(db, 'profiles', ratingData.fromUserId));
        const reviewerData = reviewerDoc.exists() ? reviewerDoc.data() : null;

        reviewsList.push({
          id: docSnapshot.id,
          rating: ratingData.rating,
          fromUserId: ratingData.fromUserId,
          reviewerName: reviewerData?.fullName || 'Anonymous',
          reviewerPhoto: reviewerData?.photoUri || null,
          createdAt: ratingData.createdAt
        });
      }

      // Sort by most recent
      reviewsList.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      setReviews(reviewsList);
      setShowReviewsModal(true);
    } catch (error) {
      console.error('Error loading reviews:', error);
      Alert.alert('Error', 'Failed to load reviews');
    }
  };

  const toggleNewSkill = (skill: string) => {
    if (selectedNewSkills.includes(skill)) {
      setSelectedNewSkills(selectedNewSkills.filter(s => s !== skill));
    } else {
      setSelectedNewSkills([...selectedNewSkills, skill]);
    }
  };

  const handleAddSkills = async () => {
    if (selectedNewSkills.length === 0) {
      Alert.alert('Error', 'Please select at least one skill');
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const updatedSkills = [...(profile.skills || []), ...selectedNewSkills];
      await updateDoc(doc(db, 'profiles', currentUser.uid), {
        skills: updatedSkills
      });

      setProfile({ ...profile, skills: updatedSkills });
      setSelectedNewSkills([]);
      setIsAddingSkill(false);
      setSkillSearch('');
    } catch (error) {
      console.error('Error adding skills:', error);
      Alert.alert('Error', 'Failed to add skills');
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

  const toggleNewInterestedSkill = (skill: string) => {
    if (selectedNewInterestedSkills.includes(skill)) {
      setSelectedNewInterestedSkills(selectedNewInterestedSkills.filter(s => s !== skill));
    } else {
      setSelectedNewInterestedSkills([...selectedNewInterestedSkills, skill]);
    }
  };

  const handleAddInterestedSkills = async () => {
    if (selectedNewInterestedSkills.length === 0) {
      Alert.alert('Error', 'Please select at least one skill');
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const updatedInterestedSkills = [...(profile.interestedSkills || []), ...selectedNewInterestedSkills];
      await updateDoc(doc(db, 'profiles', currentUser.uid), {
        interestedSkills: updatedInterestedSkills
      });

      setProfile({ ...profile, interestedSkills: updatedInterestedSkills });
      setSelectedNewInterestedSkills([]);
      setIsAddingInterestedSkill(false);
      setInterestedSkillSearch('');
    } catch (error) {
      console.error('Error adding interested skills:', error);
      Alert.alert('Error', 'Failed to add interested skills');
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
    Alert.alert(
      'Update Profile Picture',
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
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await updatePhotoWithBase64(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickFromGallery = async () => {
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
        await updatePhotoWithBase64(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking from gallery:', error);
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  const updatePhotoWithBase64 = async (uri: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      console.log('Converting photo to base64...');

      // Convert photo to base64
      const base64Photo = await FileSystem.readAsStringAsync(uri, {
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
        <TouchableOpacity 
          className="flex-row items-center justify-center mb-4"
          onPress={loadReviews}
          disabled={!profile.ratingCount || profile.ratingCount === 0}
        >
          <Ionicons name="star" size={20} color="#ffa500" />
          <Text className="text-gray-300 text-base ml-2">
            {profile.rating ? profile.rating.toFixed(1) : '0.0'} ({profile.ratingCount || 0} ratings)
          </Text>
          {profile.ratingCount > 0 && (
            <Ionicons name="chevron-forward" size={16} color="#666" className="ml-1" />
          )}
        </TouchableOpacity>

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
              <Text className="text-gray-400 text-sm mb-2">Select skills to add (tap to select/deselect):</Text>
              
              {/* Search Bar */}
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

              {/* Selected Skills Preview */}
              {selectedNewSkills.length > 0 && (
                <View className="mb-3">
                  <Text className="text-gray-400 text-xs mb-2">Selected ({selectedNewSkills.length}):</Text>
                  <View className="flex-row flex-wrap">
                    {selectedNewSkills.map((skill) => (
                      <TouchableOpacity
                        key={skill}
                        onPress={() => toggleNewSkill(skill)}
                        className="bg-orange-500 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center"
                      >
                        <Text className="text-white text-sm mr-1">{skill}</Text>
                        <Ionicons name="close" size={14} color="white" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Available Skills as Bubbles */}
              <ScrollView 
                className="bg-[#2a2a2a] border border-gray-700 rounded-lg p-3 max-h-60 mb-3"
                showsVerticalScrollIndicator={true}
              >
                <View className="flex-row flex-wrap">
                  {AVAILABLE_SKILLS
                    .filter(skill => !profile.skills?.includes(skill))
                    .filter(skill => skill.toLowerCase().includes(skillSearch.toLowerCase()))
                    .map((skill) => (
                    <TouchableOpacity
                      key={skill}
                      onPress={() => toggleNewSkill(skill)}
                      className={`rounded-full px-4 py-2 mr-2 mb-2 ${
                        selectedNewSkills.includes(skill)
                          ? 'bg-orange-500'
                          : 'bg-[#3a3a3a] border border-gray-600'
                      }`}
                    >
                      <Text className={`text-sm ${
                        selectedNewSkills.includes(skill) ? 'text-white font-medium' : 'text-gray-300'
                      }`}>
                        {skill}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              
              <TouchableOpacity 
                onPress={handleAddSkills}
                disabled={selectedNewSkills.length === 0}
                className="rounded-lg overflow-hidden"
              >
                <LinearGradient
                  colors={selectedNewSkills.length > 0 ? ['#ed7b2d', '#e04429'] : ['#666', '#555']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={{ paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text className="text-white font-semibold">
                    {selectedNewSkills.length > 0 ? `Add ${selectedNewSkills.length} Skill${selectedNewSkills.length > 1 ? 's' : ''}` : 'Select Skills to Add'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
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
              <Text className="text-gray-400 text-sm mb-2">Select skills you want to learn (tap to select/deselect):</Text>
              
              {/* Search Bar */}
              <View className="flex-row items-center bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-3 mb-3">
                <Ionicons name="search" size={18} color="#666" />
                <TextInput
                  placeholder="Search skills..."
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

              {/* Selected Skills Preview */}
              {selectedNewInterestedSkills.length > 0 && (
                <View className="mb-3">
                  <Text className="text-gray-400 text-xs mb-2">Selected ({selectedNewInterestedSkills.length}):</Text>
                  <View className="flex-row flex-wrap">
                    {selectedNewInterestedSkills.map((skill) => (
                      <TouchableOpacity
                        key={skill}
                        onPress={() => toggleNewInterestedSkill(skill)}
                        className="bg-blue-500 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center"
                      >
                        <Text className="text-white text-sm mr-1">{skill}</Text>
                        <Ionicons name="close" size={14} color="white" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Available Skills as Bubbles */}
              <ScrollView 
                className="bg-[#2a2a2a] border border-gray-700 rounded-lg p-3 max-h-60 mb-3"
                showsVerticalScrollIndicator={true}
              >
                <View className="flex-row flex-wrap">
                  {AVAILABLE_SKILLS
                    .filter(skill => !profile.interestedSkills?.includes(skill))
                    .filter(skill => skill.toLowerCase().includes(interestedSkillSearch.toLowerCase()))
                    .map((skill) => (
                    <TouchableOpacity
                      key={skill}
                      onPress={() => toggleNewInterestedSkill(skill)}
                      className={`rounded-full px-4 py-2 mr-2 mb-2 ${
                        selectedNewInterestedSkills.includes(skill)
                          ? 'bg-blue-500'
                          : 'bg-[#3a3a3a] border border-gray-600'
                      }`}
                    >
                      <Text className={`text-sm ${
                        selectedNewInterestedSkills.includes(skill) ? 'text-white font-medium' : 'text-gray-300'
                      }`}>
                        {skill}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              
              <TouchableOpacity 
                onPress={handleAddInterestedSkills}
                disabled={selectedNewInterestedSkills.length === 0}
                className="rounded-lg overflow-hidden"
              >
                <LinearGradient
                  colors={selectedNewInterestedSkills.length > 0 ? ['#ed7b2d', '#e04429'] : ['#666', '#555']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={{ paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text className="text-white font-semibold">
                    {selectedNewInterestedSkills.length > 0 ? `Add ${selectedNewInterestedSkills.length} Skill${selectedNewInterestedSkills.length > 1 ? 's' : ''}` : 'Select Skills to Add'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
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

      {/* Reviews Modal */}
      <Modal
        visible={showReviewsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReviewsModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#1a1a1a', borderRadius: 24, width: '100%', maxHeight: '80%' }}>
            {/* Header */}
            <View className="flex-row justify-between items-center p-6 border-b border-[#2a2a2a]">
              <View className="flex-row items-center">
                <Ionicons name="star" size={24} color="#ffa500" />
                <Text className="text-white text-xl font-bold ml-2">
                  Your Reviews
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowReviewsModal(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Reviews List */}
            <ScrollView style={{ maxHeight: 500 }} contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
              {reviews.length === 0 ? (
                <View className="items-center justify-center py-12">
                  <Ionicons name="star-outline" size={60} color="#3a3a3a" />
                  <Text className="text-gray-400 text-base mt-4">
                    No reviews yet
                  </Text>
                </View>
              ) : (
                reviews.map((review) => (
                  <View 
                    key={review.id}
                    className="bg-[#2a2a2a] rounded-2xl p-4 mb-3"
                  >
                    <View className="flex-row items-center mb-3">
                      {/* Reviewer Photo */}
                      {review.reviewerPhoto ? (
                        <Image
                          source={{ uri: review.reviewerPhoto }}
                          style={{ width: 50, height: 50, borderRadius: 25 }}
                        />
                      ) : (
                        <View className="w-12 h-12 rounded-full bg-[#3a3a3a] items-center justify-center">
                          <Ionicons name="person" size={24} color="#666" />
                        </View>
                      )}
                      
                      {/* Reviewer Info */}
                      <View className="flex-1 ml-3">
                        <Text className="text-white text-base font-semibold">
                          {review.reviewerName}
                        </Text>
                        <Text className="text-gray-500 text-xs mt-1">
                          {new Date(review.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </Text>
                      </View>

                      {/* Rating Stars */}
                      <View className="flex-row">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= review.rating ? 'star' : 'star-outline'}
                            size={18}
                            color={star <= review.rating ? '#ffa500' : '#666'}
                            style={{ marginLeft: 2 }}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
