import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, Alert, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, getDoc, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
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
  const [recentProfiles, setRecentProfiles] = useState<string[]>([]);
  const [totalProfilesCount, setTotalProfilesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [heartPressed, setHeartPressed] = useState(false);
  const saveButtonScale = useRef(new Animated.Value(1)).current;
  const profileCardPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const profileCardRotation = useRef(new Animated.Value(0)).current;
  const profileCardScale = useRef(new Animated.Value(1)).current;
  const profileCardOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadProfiles();
    
    // Set up real-time notification listener
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('recipientId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setNotificationCount(querySnapshot.size);
      console.log('Notification count updated:', querySnapshot.size);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // Reset animation values when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      profileCardPosition.setValue({ x: 0, y: 0 });
      profileCardRotation.setValue(0);
      profileCardScale.setValue(1);
      profileCardOpacity.setValue(1);
      saveButtonScale.setValue(1);
      setHeartPressed(false);
    }, [])
  );

  const loadProfiles = async (skipViewed: boolean = true) => {
    try {
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
      const allMatchingProfiles: Profile[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const profileData = docSnapshot.data();
        
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
          allMatchingProfiles.push({ id: docSnapshot.id, ...profileData } as Profile);
          
          // Skip if in recent profiles
          if (!skipViewed || !recentProfiles.includes(docSnapshot.id)) {
            profiles.push({ id: docSnapshot.id, ...profileData } as Profile);
          } else {
            console.log('Skipping recent profile:', profileData.fullName);
          }
        }
      });

      // Store total count of available profiles
      setTotalProfilesCount(allMatchingProfiles.length);
      console.log('Total matching profiles:', allMatchingProfiles.length);
      console.log('Filtered profiles count:', profiles.length);

      if (profiles.length > 0) {
        // Get user's interested skills
        const userInterestedSkills = currentUserData?.interestedSkills || [];
        console.log('User interested in:', userInterestedSkills);

        // Add skill matching score and count to each profile
        const profilesWithScores = profiles.map(profile => {
          const profileSkills = profile.skills || [];
          let matchingSkillsCount = 0;
          
          // Count how many of the user's interested skills match this profile's skills
          userInterestedSkills.forEach((interestedSkill: string) => {
            if (profileSkills.some((skill: string) => 
              skill.toLowerCase().includes(interestedSkill.toLowerCase()) ||
              interestedSkill.toLowerCase().includes(skill.toLowerCase())
            )) {
              matchingSkillsCount++;
            }
          });

          return {
            ...profile,
            matchingSkillsCount,
            rating: profile.rating || 0,
            ratingCount: profile.ratingCount || 0
          };
        });

        // Separate profiles into those with matching skills and those without
        const matchingProfiles = profilesWithScores.filter(p => p.matchingSkillsCount > 0);
        const otherProfiles = profilesWithScores.filter(p => p.matchingSkillsCount === 0);

        console.log('Matching profiles:', matchingProfiles.length);
        console.log('Other profiles:', otherProfiles.length);

        // Sort matching profiles by:
        // 1. Number of matching skills (descending)
        // 2. Rating (descending)
        // 3. Rating count (descending) - to prefer profiles with more ratings
        matchingProfiles.sort((a, b) => {
          // First, sort by number of matching skills
          if (b.matchingSkillsCount !== a.matchingSkillsCount) {
            return b.matchingSkillsCount - a.matchingSkillsCount;
          }
          // Then by rating
          if (b.rating !== a.rating) {
            return b.rating - a.rating;
          }
          // Finally by number of ratings (more ratings = more reliable)
          return b.ratingCount - a.ratingCount;
        });

        // Sort other profiles by rating (high to low)
        otherProfiles.sort((a, b) => {
          if (b.rating !== a.rating) {
            return b.rating - a.rating;
          }
          return b.ratingCount - a.ratingCount;
        });

        // Combine: matching profiles first (sorted by relevance and rating), then others (sorted by rating)
        const orderedProfiles = [...matchingProfiles, ...otherProfiles];
        
        // Take first 10 profiles for the queue
        const limitedQueue = orderedProfiles.slice(0, 10);
        
        // Add to existing queue or set if queue is empty
        setProfileQueue(prev => {
          const newQueue = prev.length > 0 ? [...prev, ...limitedQueue] : limitedQueue;
          console.log('Updated queue length:', newQueue.length);
          return newQueue;
        });
        
        // Only set current profile if there isn't one
        if (!currentProfile && limitedQueue.length > 0) {
          setCurrentProfile(limitedQueue[0]);
          console.log('Set current profile to:', limitedQueue[0].fullName);
        }
      } else {
        // If no profiles found and queue is empty, show empty state
        if (profileQueue.length === 0) {
          setCurrentProfile(null);
          setProfileQueue([]);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading profiles:', error);
      setLoading(false);
    }
  };

  const moveToNextProfile = () => {
    // Add current profile to recent list and keep (totalProfiles - 2) recent
    if (currentProfile) {
      const maxRecent = Math.max(1, totalProfilesCount - 2);
      const updatedRecentProfiles = [...recentProfiles, currentProfile.id].slice(-maxRecent);
      setRecentProfiles(updatedRecentProfiles);
      console.log('Added to recent:', currentProfile.id, 'Recent profiles:', updatedRecentProfiles.length, 'Max recent:', maxRecent);
    }

    const remainingProfiles = profileQueue.slice(1);
    
    if (remainingProfiles.length > 0) {
      // Set scale to 0 and opacity to 1 before changing profile
      profileCardScale.setValue(0);
      profileCardOpacity.setValue(1);
      
      setCurrentProfile(remainingProfiles[0]);
      setProfileQueue(remainingProfiles);
      
      // Animate the new profile popping in
      Animated.spring(profileCardScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
      
      // Load more profiles when only 3 left in queue
      if (remainingProfiles.length <= 3) {
        setTimeout(() => {
          loadProfiles();
        }, 100);
      }
    } else {
      // Queue is empty, reload profiles immediately
      setCurrentProfile(null);
      loadProfiles();
    }
  };

  const handleReset = async () => {
    setRecentProfiles([]);
    setCurrentProfile(null);
    setProfileQueue([]);
    await loadProfiles(false); // Don't skip any profiles when resetting
  };

  const handlePass = () => {
    if (isButtonDisabled) return;
    
    setIsButtonDisabled(true);

    // Animate profile card sliding left and down with rotation and fade out
    Animated.parallel([
      Animated.timing(profileCardPosition, {
        toValue: { x: -400, y: 200 },
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(profileCardRotation, {
        toValue: -30,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(profileCardOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset animation values
      profileCardPosition.setValue({ x: 0, y: 0 });
      profileCardRotation.setValue(0);
      
      moveToNextProfile();
      setIsButtonDisabled(false);
    });
  };

  const handleSuperLike = async () => {
    if (!currentProfile || isButtonDisabled) return;

    setHeartPressed(true);

    // Animate the button
    Animated.sequence([
      Animated.timing(saveButtonScale, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(saveButtonScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

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

      // Wait for animation to complete before moving to next profile
      setTimeout(() => {
        moveToNextProfile();
        setIsButtonDisabled(false);
        setHeartPressed(false);
      }, 300);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
      setIsButtonDisabled(false);
    }
  };

  const handleLike = async () => {
    if (!currentProfile || isButtonDisabled) return;

    setIsButtonDisabled(true);

    // Animate profile card sliding right and down with rotation and fade out
    Animated.parallel([
      Animated.timing(profileCardPosition, {
        toValue: { x: 400, y: 200 },
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(profileCardRotation, {
        toValue: 30,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(profileCardOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      // Reset animation values
      profileCardPosition.setValue({ x: 0, y: 0 });
      profileCardRotation.setValue(0);

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
        
        moveToNextProfile();
        setIsButtonDisabled(false);
      } catch (error) {
        console.error('Error sending like:', error);
        Alert.alert('Error', 'Failed to send connection request');
        setIsButtonDisabled(false);
      }
    });
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
      <Animated.View 
        style={{ 
          flex: 1,
          paddingHorizontal: 16,
          paddingBottom: 24,
          opacity: profileCardOpacity,
          transform: [
            { translateX: profileCardPosition.x },
            { translateY: profileCardPosition.y },
            { rotate: profileCardRotation.interpolate({
              inputRange: [-30, 0, 30],
              outputRange: ['-30deg', '0deg', '30deg']
            })},
            { scale: profileCardScale }
          ]
        }}
      >
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
          <ScrollView 
            className="flex-1 px-6 pb-6 bg-[#2a2a2a]" 
            showsVerticalScrollIndicator={true}
            indicatorStyle="white"
          >
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
                  {currentProfile.skills.map((skill: string, index: number) => {
                    // Check if this skill matches user's interests
                    const isMatching = (currentProfile as any).matchingSkillsCount > 0 && 
                      currentProfile.skills.some((s: string) => s === skill);
                    
                    return (
                      <View key={index} className={`px-3 py-2 rounded-full ${
                        isMatching ? 'bg-orange-500' : 'bg-[#3a3a3a]'
                      }`}>
                        <Text className={`text-sm ${
                          isMatching ? 'text-white font-medium' : 'text-orange-400'
                        }`}>
                          {skill}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                {(currentProfile as any).matchingSkillsCount > 0 && (
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                    <Text className="text-green-400 text-xs ml-1">
                      {`${(currentProfile as any).matchingSkillsCount} skill${(currentProfile as any).matchingSkillsCount > 1 ? 's' : ''} match your interests!`}
                    </Text>
                  </View>
                )}
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
      </Animated.View>

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
          <Animated.View style={{ transform: [{ scale: saveButtonScale }] }}>
            <TouchableOpacity 
              onPress={handleSuperLike}
              disabled={isButtonDisabled}
              style={{ opacity: isButtonDisabled ? 0.5 : 1, backgroundColor: 'white', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons 
                name={heartPressed ? "heart" : "heart-outline"} 
                size={24} 
                color={heartPressed ? "#e04429" : "#666"} 
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Like Button */}
          <TouchableOpacity 
            onPress={handleLike}
            disabled={isButtonDisabled}
            style={{ opacity: isButtonDisabled ? 0.5 : 1, backgroundColor: 'white', width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="checkmark" size={40} color="#4caf50" />
          </TouchableOpacity>
        </View>
    </SafeAreaView>
  );
}