import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface Profile {
  id: string;
  fullName: string;
  bio: string;
  location: string;
  photoUri: string | null;
  skills: string[];
  level: string;
  availability: string;
  preference?: string;
  rating?: number;
  ratingCount?: number;
}

export default function SwiperScreen() {
  const navigation = useNavigation();
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [profileQueue, setProfileQueue] = useState<Profile[]>([]);
  const [viewedProfiles, setViewedProfiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  useEffect(() => {
    loadProfiles();
    loadNotificationCount();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadNotificationCount();
    }, [])
  );

  const loadProfiles = async (skipViewed: boolean = true) => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      console.log('Current user:', currentUser?.uid);
      
      if (!currentUser) {
        console.log('No current user found');
        setLoading(false);
        return;
      }

      // Get current user's profile to check their preference and location
      const currentUserDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
      const currentUserData = currentUserDoc.data();
      const userPreference = currentUserData?.preference;
      const userLocation = currentUserData?.location;

      console.log('User preference:', userPreference);
      console.log('User location:', userLocation);

      // Extract city from location (format: "City, Country")
      const userCity = userLocation ? userLocation.split(',')[0].trim() : null;

      const profilesRef = collection(db, 'profiles');
      const q = query(
        profilesRef,
        where('userId', '!=', currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      console.log('Query completed, found', querySnapshot.size, 'profiles');
      
      const profiles: Profile[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const profileData = docSnapshot.data();
        
        // Skip if already viewed
        if (skipViewed && viewedProfiles.has(docSnapshot.id)) {
          console.log('Skipping viewed profile:', profileData.fullName);
          return;
        }
        
        let shouldAdd = false;
        
        // If user preference is 'inperson', filter by same city
        if (userPreference === 'inperson') {
          const profileCity = profileData.location ? profileData.location.split(',')[0].trim() : null;
          console.log('Comparing cities:', userCity, 'vs', profileCity, 'for user:', profileData.fullName);
          
          // Only add if cities match
          if (userCity && profileCity && userCity.toLowerCase() === profileCity.toLowerCase()) {
            shouldAdd = true;
          }
        } else {
          // For 'online' or 'both', show all profiles
          shouldAdd = true;
        }
        
        if (shouldAdd) {
          profiles.push({ id: docSnapshot.id, ...profileData } as Profile);
        }
      });

      console.log('Filtered profiles count:', profiles.length);

      if (profiles.length > 0) {
        // Get user's interested skills
        const userInterestedSkills = currentUserData?.interestedSkills || [];
        console.log('User interested in:', userInterestedSkills);

        // Separate profiles into those with matching skills and those without
        const matchingProfiles: Profile[] = [];
        const otherProfiles: Profile[] = [];

        profiles.forEach(profile => {
          const profileSkills = profile.skills || [];
          // Check if profile has any skill that matches user's interests
          const hasMatchingSkill = userInterestedSkills.some((interestedSkill: string) =>
            profileSkills.some((skill: string) => 
              skill.toLowerCase().includes(interestedSkill.toLowerCase()) ||
              interestedSkill.toLowerCase().includes(skill.toLowerCase())
            )
          );

          if (hasMatchingSkill) {
            matchingProfiles.push(profile);
          } else {
            otherProfiles.push(profile);
          }
        });

        console.log('Matching profiles:', matchingProfiles.length);
        console.log('Other profiles:', otherProfiles.length);

        // Shuffle each group separately
        const shuffledMatching = matchingProfiles.sort(() => Math.random() - 0.5);
        const shuffledOthers = otherProfiles.sort(() => Math.random() - 0.5);

        // Combine: matching profiles first, then others
        const orderedProfiles = [...shuffledMatching, ...shuffledOthers];
        
        // Only take first 10 profiles for the queue
        const limitedQueue = orderedProfiles.slice(0, 10);
        setProfileQueue(limitedQueue);
        setCurrentProfile(limitedQueue[0]);
        console.log('Set current profile to:', limitedQueue[0].fullName);
      } else {
        setCurrentProfile(null);
        setProfileQueue([]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading profiles:', error);
      setLoading(false);
    }
  };

  const loadNotificationCount = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('recipientId', '==', currentUser.uid),
        where('status', '==', 'pending')
      );

      const querySnapshot = await getDocs(q);
      setNotificationCount(querySnapshot.size);
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  const moveToNextProfile = () => {
    // Mark current profile as viewed BEFORE moving
    if (currentProfile) {
      const updatedViewedProfiles = new Set([...viewedProfiles, currentProfile.id]);
      setViewedProfiles(updatedViewedProfiles);
      console.log('Marked as viewed:', currentProfile.id, 'Total viewed:', updatedViewedProfiles.size);
    }

    const remainingProfiles = profileQueue.slice(1);
    
    if (remainingProfiles.length > 0) {
      setCurrentProfile(remainingProfiles[0]);
      setProfileQueue(remainingProfiles);
      
      // Load more profiles when only 3 left in queue
      if (remainingProfiles.length === 3) {
        // Use a timeout to ensure viewedProfiles state is updated
        setTimeout(() => {
          loadProfiles();
        }, 100);
      }
    } else {
      // Queue is empty, try to load more profiles
      loadProfiles();
    }
  };

  const handleReset = async () => {
    setViewedProfiles(new Set());
    setCurrentProfile(null);
    setProfileQueue([]);
    await loadProfiles(false); // Don't skip any profiles when resetting
  };

  const handlePass = () => {
    if (isButtonDisabled) return;
    
    setIsButtonDisabled(true);
    moveToNextProfile();
    
    // Re-enable buttons after 2 seconds
    setTimeout(() => {
      setIsButtonDisabled(false);
    }, 2000);
  };

  const handleSuperLike = async () => {
    if (!currentProfile || isButtonDisabled) return;

    setIsButtonDisabled(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setIsButtonDisabled(false);
        return;
      }

      console.log('Super liked:', currentProfile.fullName);

      // Add to saved profiles array in Firestore
      const userDocRef = doc(db, 'profiles', currentUser.uid);
      await updateDoc(userDocRef, {
        savedProfiles: arrayUnion(currentProfile.id)
      });

      Alert.alert('Saved!', `${currentProfile.fullName} has been saved to your list`);
      moveToNextProfile();
      
      // Re-enable buttons after 2 seconds
      setTimeout(() => {
        setIsButtonDisabled(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
      setIsButtonDisabled(false);
    }
  };

  const handleLike = async () => {
    if (!currentProfile || isButtonDisabled) return;

    setIsButtonDisabled(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setIsButtonDisabled(false);
        return;
      }

      // Get current user's profile data
      const currentUserDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
      const currentUserData = currentUserDoc.data();

      // Create notification for the liked user
      await addDoc(collection(db, 'notifications'), {
        recipientId: currentProfile.id,
        senderId: currentUser.uid,
        senderName: currentUserData?.fullName || 'Someone',
        senderPhoto: currentUserData?.photoUri || null,
        type: 'like',
        status: 'pending',
        createdAt: serverTimestamp()
      });

      console.log('Sent like to:', currentProfile.fullName);
      Alert.alert('Sent!', `You sent a connection request to ${currentProfile.fullName}`);
      moveToNextProfile();
      
      // Re-enable buttons after 2 seconds
      setTimeout(() => {
        setIsButtonDisabled(false);
      }, 2000);
    } catch (error) {
      console.error('Error sending like:', error);
      Alert.alert('Error', 'Failed to send connection request');
      setIsButtonDisabled(false);
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

  if (!currentProfile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="people-outline" size={80} color="#666" />
          <Text className="text-white text-xl font-bold mt-4 mb-2">No Profiles Yet</Text>
          <Text className="text-gray-400 text-center mb-6">
            You've seen all available profiles!
          </Text>
          <TouchableOpacity 
            onPress={handleReset}
            className="bg-[#e04429] px-6 py-3 rounded-full"
          >
            <View className="flex-row items-center">
              <Ionicons name="refresh" size={20} color="white" />
              <Text className="text-white text-base font-semibold ml-2">
                Reset & Show All Profiles
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <View style={{ width: 40 }} />
        <View className="flex-row items-center">
          <Image 
            source={require('../images/logo-unfocused.png')} 
            style={{ width: 32, height: 32, marginRight: -5 }}
            resizeMode="contain"
          />
          <Text style={{ color: '#bfbfbf', fontSize: 24, fontWeight: 'bold' }}>killSwap</Text>
        </View>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Notifications' as never)}
          className="relative"
        >
          <Ionicons 
            name={notificationCount > 0 ? "notifications" : "notifications-outline"} 
            size={28} 
            color={notificationCount > 0 ? "#e04429" : "#666"} 
          />
          {notificationCount > 0 && (
            <View 
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: '#1a1a1a',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 4,
              }}
            >
              <Text style={{ color: '#e04429', fontSize: 11, fontWeight: 'bold' }}>
                {notificationCount <= 9 ? notificationCount : '9+'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View className="flex-1 px-4 pb-6">
        <View 
          style={{ 
            flex: 1,
            backgroundColor: '#2a2a2a',
            borderRadius: 24,
            overflow: 'hidden'
          }}
        >
          {/* Profile Image */}
          <View className="items-center pt-6 pb-4 bg-[#2a2a2a]">
            {currentProfile.photoUri ? (
              <Image 
                source={{ uri: currentProfile.photoUri }} 
                style={{ 
                  width: 320, 
                  height: 320, 
                  borderRadius: 20 
                }}
                resizeMode="cover"
              />
            ) : (
              <View 
                style={{ 
                  width: 320, 
                  height: 320, 
                  borderRadius: 20,
                  backgroundColor: '#3a3a3a',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Ionicons name="person" size={100} color="#666" />
              </View>
            )}
          </View>

          {/* Profile Info - Scrollable */}
          <ScrollView className="flex-1 px-6 pb-6 bg-[#2a2a2a]" showsVerticalScrollIndicator={false}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white text-2xl font-bold">
                {currentProfile.fullName}
              </Text>
              
              {/* Rating */}
              <View className="flex-row items-center">
                <Ionicons name="star" size={16} color="#ffa500" />
                <Text className="text-gray-300 text-sm ml-1">
                  {currentProfile.rating ? currentProfile.rating.toFixed(1) : '0.0'} ({currentProfile.ratingCount || 0})
                </Text>
              </View>
            </View>
            
            {/* Location */}
            {currentProfile.location && (
              <View className="flex-row items-center mb-4">
                <Ionicons name="location-outline" size={16} color="#e04429" />
                <Text className="text-gray-400 text-sm ml-1">
                  {currentProfile.location}
                </Text>
              </View>
            )}

            {/* Skills */}
            {currentProfile.skills && currentProfile.skills.length > 0 && (
              <View className="mb-4">
                <Text className="text-white text-base font-semibold mb-2">Skills</Text>
                <View className="flex-row flex-wrap gap-2">
                  {currentProfile.skills.map((skill: string, index: number) => (
                    <View key={index} className="bg-[#3a3a3a] px-3 py-2 rounded-full">
                      <Text className="text-orange-400 text-sm">{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Bio */}
            <View style={{ marginBottom: 16 }}>
              <View className="flex-row items-start mb-2">
                <Ionicons name="chatbox-ellipses-outline" size={24} color="#e04429" style={{ marginRight: 8 }} />
                <Text className="text-white text-base font-semibold">About</Text>
              </View>
              <Text className="text-gray-300 text-sm leading-5 italic">
                "{currentProfile.bio || 'Ready to share knowledge and learn new skills!'}"
              </Text>
            </View>
          </ScrollView>
        </View>

        {/* Action Buttons */}
        <View className="flex-row justify-center items-center mt-6 gap-6">
          {/* Pass Button */}
          <TouchableOpacity 
            onPress={handlePass}
            disabled={isButtonDisabled}
            style={{ opacity: isButtonDisabled ? 0.5 : 1, backgroundColor: 'white', width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="close" size={40} color="#e04429" />
          </TouchableOpacity>

          {/* Super Like Button */}
          <TouchableOpacity 
            onPress={handleSuperLike}
            disabled={isButtonDisabled}
            style={{ opacity: isButtonDisabled ? 0.5 : 1, backgroundColor: 'white', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="heart-outline" size={24} color="#666" />
          </TouchableOpacity>

          {/* Like Button */}
          <TouchableOpacity 
            onPress={handleLike}
            disabled={isButtonDisabled}
            style={{ opacity: isButtonDisabled ? 0.5 : 1, backgroundColor: 'white', width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="checkmark" size={40} color="#4caf50" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}