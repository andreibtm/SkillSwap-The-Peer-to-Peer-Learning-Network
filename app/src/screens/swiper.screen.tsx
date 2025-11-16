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
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [heartPressed, setHeartPressed] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [userInterestedSkills, setUserInterestedSkills] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const saveButtonScale = useRef(new Animated.Value(1)).current;
  const profileCardPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const profileCardRotation = useRef(new Animated.Value(0)).current;
  const profileCardScale = useRef(new Animated.Value(1)).current;
  const profileCardOpacity = useRef(new Animated.Value(1)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

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
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // Reset animation values when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Reset all animation values to default state
      profileCardPosition.setValue({ x: 0, y: 0 });
      profileCardRotation.setValue(0);
      profileCardScale.setValue(1);
      profileCardOpacity.setValue(1);
      saveButtonScale.setValue(1);
      setHeartPressed(false);
      
      // Reset scroll position
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
      
      // If we have a current profile but no scale, make sure it's visible
      if (currentProfile) {
        setTimeout(() => {
          profileCardScale.setValue(1);
          profileCardOpacity.setValue(1);
        }, 50);
      }
    }, [profileCardPosition, profileCardRotation, profileCardScale, profileCardOpacity, saveButtonScale, currentProfile])
  );

  const loadProfiles = async (skipViewed: boolean = true) => {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setLoading(false);
        return;
      }

      // Get current user's profile
      const currentUserDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
      const currentUserData = currentUserDoc.data();
      const userInterestedSkills = currentUserData?.interestedSkills || [];
      setUserInterestedSkills(userInterestedSkills);

      // Get all chats to exclude matched users
      const chatsRef = collection(db, 'chats');
      const chatsQuery = query(
        chatsRef,
        where('participants', 'array-contains', currentUser.uid)
      );
      
      const chatsSnapshot = await getDocs(chatsQuery);
      const matchedUserIds = new Set<string>();
      
      chatsSnapshot.forEach((doc) => {
        const chatData = doc.data();
        const participants = chatData.participants || [];
        participants.forEach((participantId: string) => {
          if (participantId !== currentUser.uid) {
            matchedUserIds.add(participantId);
          }
        });
      });

      // Get all notifications where current user is the sender (pending/accepted requests)
      const notificationsRef = collection(db, 'notifications');
      const sentRequestsQuery = query(
        notificationsRef,
        where('senderId', '==', currentUser.uid),
        where('type', '==', 'like')
      );
      
      const sentRequestsSnapshot = await getDocs(sentRequestsQuery);
      const profilesWithSentRequests = new Set<string>();
      const now = new Date();
      const thirtyMinutesInMs = 30 * 60 * 1000; // 30 minutes in milliseconds
      
      sentRequestsSnapshot.forEach((docSnapshot) => {
        const notifData = docSnapshot.data();
        const notifId = docSnapshot.id;
        
        // Check if request is older than 30 minutes
        const createdAt = notifData.createdAt?.toDate();
        if (createdAt) {
          const age = now.getTime() - createdAt.getTime();
          
          if (age > thirtyMinutesInMs && notifData.status === 'pending') {
            // Auto-dismiss requests older than 30 minutes
            const { updateDoc, doc: firestoreDoc } = require('firebase/firestore');
            updateDoc(firestoreDoc(db, 'notifications', notifId), {
              status: 'expired'
            }).catch(() => {});
            return; // Don't add to exclusion set since it's expired
          }
        }
        
        // Only exclude if pending or accepted (not denied or expired)
        if (notifData.status === 'pending' || notifData.status === 'accepted') {
          profilesWithSentRequests.add(notifData.recipientId);
        }
      });

      // Get all notifications where current user is the recipient with pending status
      const receivedRequestsQuery = query(
        notificationsRef,
        where('recipientId', '==', currentUser.uid),
        where('type', '==', 'like'),
        where('status', '==', 'pending')
      );
      
      const receivedRequestsSnapshot = await getDocs(receivedRequestsQuery);
      
      receivedRequestsSnapshot.forEach((docSnapshot) => {
        const notifData = docSnapshot.data();
        const notifId = docSnapshot.id;
        
        // Check if request is older than 30 minutes
        const createdAt = notifData.createdAt?.toDate();
        if (createdAt) {
          const age = now.getTime() - createdAt.getTime();
          
          if (age > thirtyMinutesInMs) {
            // Auto-dismiss requests older than 30 minutes
            const { updateDoc, doc: firestoreDoc } = require('firebase/firestore');
            updateDoc(firestoreDoc(db, 'notifications', notifId), {
              status: 'expired'
            }).catch(() => {});
            return;
          }
        }
        
        // Exclude profiles that have sent a pending request to current user
        profilesWithSentRequests.add(notifData.senderId);
      });
      
      // Get all profiles
      const profilesRef = collection(db, 'profiles');
      const q = query(
        profilesRef,
        where('userId', '!=', currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      
      const availableProfiles: Profile[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const profileId = docSnapshot.id;
        
        // Skip if already matched (has chat with this user)
        if (matchedUserIds.has(profileId)) {
          return;
        }
        
        // Skip if user already sent a request to this profile
        if (profilesWithSentRequests.has(profileId)) {
          return;
        }
        
        // Skip if in recent profiles (last 30 profiles)
        if (skipViewed && recentProfiles.includes(profileId)) {
          return;
        }
        
        const profileData = docSnapshot.data();
        availableProfiles.push({ id: profileId, ...profileData } as Profile);
      });

      if (availableProfiles.length > 0) {
        // Calculate matching skills count for each profile
        const profilesWithScores = availableProfiles.map(profile => {
          const profileSkills = profile.skills || [];
          let matchingSkillsCount = 0;
          
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

        // Separate profiles: those with matching skills vs. those without
        const matchingProfiles = profilesWithScores.filter(p => p.matchingSkillsCount > 0);
        const otherProfiles = profilesWithScores.filter(p => p.matchingSkillsCount === 0);

        // Sort matching profiles by number of matching skills (most matches first)
        matchingProfiles.sort((a, b) => {
          if (b.matchingSkillsCount !== a.matchingSkillsCount) {
            return b.matchingSkillsCount - a.matchingSkillsCount;
          }
          if (b.rating !== a.rating) {
            return b.rating - a.rating;
          }
          return b.ratingCount - a.ratingCount;
        });

        // Randomize other profiles (shuffle)
        const shuffledOtherProfiles = otherProfiles.sort(() => Math.random() - 0.5);

        // Combine: matching profiles first, then random profiles
        const orderedProfiles = [...matchingProfiles, ...shuffledOtherProfiles];
        
        // Take next batch of profiles (20 at a time)
        const batchSize = 20;
        const nextBatch = orderedProfiles.slice(0, batchSize);
        
        // Add to queue or set as queue
        setProfileQueue(prev => {
          const newQueue = prev.length > 0 ? [...prev, ...nextBatch] : nextBatch;
          return newQueue;
        });
        
        // Set current profile if there isn't one
        if (!currentProfile && nextBatch.length > 0) {
          setCurrentProfile(nextBatch[0]);
          // Reset scroll position and ensure the profile animates in properly
          setTimeout(() => {
            if (scrollViewRef.current) {
              scrollViewRef.current.scrollTo({ y: 0, animated: false });
            }
            profileCardScale.setValue(0);
            Animated.spring(profileCardScale, {
              toValue: 1,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }).start();
          }, 50);
        }
      }
      // If no profiles available, the queue will keep trying to load on next iteration

      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const moveToNextProfile = () => {
    // Add current profile to recent list and keep last 30 profiles
    if (currentProfile) {
      const maxRecent = 30; // Keep last 30 profiles to prevent immediate reappearance
      const updatedRecentProfiles = [...recentProfiles, currentProfile.id].slice(-maxRecent);
      setRecentProfiles(updatedRecentProfiles);
    }

    const remainingProfiles = profileQueue.slice(1);
    
    if (remainingProfiles.length > 0) {
      // Set scale to 0 and opacity to 1 before changing profile
      profileCardScale.setValue(0);
      profileCardOpacity.setValue(1);
      
      setCurrentProfile(remainingProfiles[0]);
      setProfileQueue(remainingProfiles);
      
      // Reset scroll position to top
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: false });
        }
      }, 0);
      
      // Animate the new profile popping in
      Animated.spring(profileCardScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
      
      // Load more profiles when only 5 left in queue
      if (remainingProfiles.length <= 5) {
        setTimeout(() => {
          loadProfiles();
        }, 100);
      }
    } else {
      // Queue is empty, immediately try to load more profiles
      // Reset animations first
      profileCardScale.setValue(0);
      profileCardOpacity.setValue(1);
      profileCardPosition.setValue({ x: 0, y: 0 });
      profileCardRotation.setValue(0);
      
      // Reset scroll position
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
      
      // Load profiles and set up next profile
      loadProfiles().then(() => {
        // After loading, if we have profiles in queue, animate in
        setTimeout(() => {
          if (profileQueue.length > 0 && scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: 0, animated: false });
          }
          if (profileQueue.length > 0) {
            Animated.spring(profileCardScale, {
              toValue: 1,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }).start();
          }
        }, 50);
      });
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

      // Check if profile is already saved
      const userDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
      const savedProfiles = userDoc.data()?.savedProfiles || [];
      
      if (savedProfiles.includes(currentProfile.id)) {
        // Show toast message
        setToastMessage('Profile already saved!');
        setShowToast(true);
        
        // Animate toast in
        Animated.sequence([
          Animated.timing(toastOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(2000),
          Animated.timing(toastOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => setShowToast(false));
        
        setIsButtonDisabled(false);
        setHeartPressed(false);
        return;
      }

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

      // Check if chat already exists with this user
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      let chatExists = false;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(currentProfile.id)) {
          chatExists = true;
        }
      });

      if (chatExists) {
        // Show toast message
        setToastMessage('You already matched with this user!');
        setShowToast(true);
        
        // Animate toast in
        Animated.sequence([
          Animated.timing(toastOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(2000),
          Animated.timing(toastOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => setShowToast(false));
        
        setIsButtonDisabled(false);
        return;
      }
    } catch (error) {
    }

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

        moveToNextProfile();
        setIsButtonDisabled(false);
      } catch (error) {
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

  // Show loading while fetching first batch
  if (!currentProfile && loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-lg">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If no current profile but not loading, keep trying to load
  if (!currentProfile) {
    setTimeout(() => loadProfiles(), 500);
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-lg">Loading profiles...</Text>
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
            ref={scrollViewRef}
            className="flex-1 px-6 pb-6 bg-[#2a2a2a]" 
            showsVerticalScrollIndicator={true}
            indicatorStyle="white"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white text-2xl font-bold">
                {currentProfile.fullName}
              </Text>
              
              {/* Rating and Learning Preference */}
              <View className="items-end">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="star" size={16} color="#ffa500" />
                  <Text className="text-gray-300 text-sm ml-1">
                    {currentProfile.rating ? currentProfile.rating.toFixed(1) : '0.0'} ({currentProfile.ratingCount || 0})
                  </Text>
                </View>
                
                {/* Learning Preference */}
                {currentProfile.preference && (
                  <View className="flex-row items-center">
                    <Ionicons 
                      name={
                        currentProfile.preference === 'online' ? 'videocam' : 
                        currentProfile.preference === 'inperson' ? 'people' : 
                        'globe'
                      } 
                      size={14} 
                      color="#e04429" 
                    />
                    <Text className="text-gray-400 text-xs ml-1">
                      {currentProfile.preference === 'inperson' ? 'In-Person' : 
                       currentProfile.preference === 'online' ? 'Online' : 
                       'Both'}
                    </Text>
                  </View>
                )}
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
                    // Check if this skill matches any of the user's interests
                    const isMatching = userInterestedSkills.some((interestedSkill: string) =>
                      skill.toLowerCase().includes(interestedSkill.toLowerCase()) ||
                      interestedSkill.toLowerCase().includes(skill.toLowerCase())
                    );
                    
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

      {/* Toast Notification */}
      {showToast && (
        <Animated.View 
          style={{
            position: 'absolute',
            top: 100,
            left: 20,
            right: 20,
            backgroundColor: '#323232',
            padding: 16,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            opacity: toastOpacity,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Ionicons name="information-circle" size={24} color="#e04429" />
          <Text style={{ color: 'white', fontSize: 16, marginLeft: 12, flex: 1 }}>
            {toastMessage}
          </Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}