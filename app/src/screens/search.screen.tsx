import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Modal, Alert, Animated, LogBox } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import RatingsModal from '../components/RatingsModal';

// Suppress known non-critical warnings
LogBox.ignoreLogs(['Text strings must be rendered']);

interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  bio: string;
  location: string;
  photoUri: string;
  skills: string[];
  level: string;
  rating?: number;
  ratingCount?: number;
  matchingSkillsCount?: number;
}

export default function SearchScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [displayedCount, setDisplayedCount] = useState(10);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [userInterestedSkills, setUserInterestedSkills] = useState<string[]>([]);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    loadRandomProfiles();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
      setSearching(false);
    }
  }, [searchQuery]);

  const loadRandomProfiles = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Get current user's interested skills
      const currentUserProfileRef = collection(db, 'profiles');
      const currentUserQuery = query(currentUserProfileRef, where('userId', '==', currentUser.uid));
      const currentUserSnapshot = await getDocs(currentUserQuery);
      let userInterestedSkills: string[] = [];
      if (!currentUserSnapshot.empty) {
        const userData = currentUserSnapshot.docs[0].data();
        userInterestedSkills = userData.interestedSkills || [];
      }
      setUserInterestedSkills(userInterestedSkills);

      // Get random profiles excluding current user
      const profilesRef = collection(db, 'profiles');
      const q = query(
        profilesRef,
        where('userId', '!=', currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const allProfiles: UserProfile[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const profileSkills = data.skills || [];
        
        // Calculate matching skills
        const matchingSkillsCount = profileSkills.filter((skill: string) =>
          userInterestedSkills.some(
            (interestedSkill) => interestedSkill.toLowerCase() === skill.toLowerCase()
          )
        ).length;

        allProfiles.push({
          id: doc.id,
          ...data,
          rating: data.rating || 0,
          ratingCount: data.ratingCount || 0,
          matchingSkillsCount,
        } as UserProfile);
      });

      // Sort by matching skills count, then rating, then rating count
      allProfiles.sort((a, b) => {
        // Primary: matching skills count (descending)
        if (b.matchingSkillsCount !== a.matchingSkillsCount) {
          return b.matchingSkillsCount! - a.matchingSkillsCount!;
        }
        // Secondary: rating (descending)
        if (b.rating !== a.rating) {
          return b.rating! - a.rating!;
        }
        // Tertiary: rating count (descending)
        return b.ratingCount! - a.ratingCount!;
      });

      setAllProfiles(allProfiles);
      setProfiles(allProfiles.slice(0, 10));
      setDisplayedCount(10);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Get current user's interested skills
      const currentUserProfileRef = collection(db, 'profiles');
      const currentUserQuery = query(currentUserProfileRef, where('userId', '==', currentUser.uid));
      const currentUserSnapshot = await getDocs(currentUserQuery);
      let userInterestedSkills: string[] = [];
      if (!currentUserSnapshot.empty) {
        const userData = currentUserSnapshot.docs[0].data();
        userInterestedSkills = userData.interestedSkills || [];
      }

      // Search by name (case-insensitive partial match)
      const profilesRef = collection(db, 'profiles');
      const querySnapshot = await getDocs(profilesRef);
      
      const results: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          data.userId !== currentUser.uid &&
          data.fullName.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          const profileSkills = data.skills || [];
          
          // Calculate matching skills
          const matchingSkillsCount = profileSkills.filter((skill: string) =>
            userInterestedSkills.some(
              (interestedSkill) => interestedSkill.toLowerCase() === skill.toLowerCase()
            )
          ).length;

          results.push({
            id: doc.id,
            ...data,
            rating: data.rating || 0,
            ratingCount: data.ratingCount || 0,
            matchingSkillsCount,
          } as UserProfile);
        }
      });

      // Sort by matching skills count, then rating, then rating count
      results.sort((a, b) => {
        // Primary: matching skills count (descending)
        if (b.matchingSkillsCount !== a.matchingSkillsCount) {
          return b.matchingSkillsCount! - a.matchingSkillsCount!;
        }
        // Secondary: rating (descending)
        if (b.rating !== a.rating) {
          return b.rating! - a.rating!;
        }
        // Tertiary: rating count (descending)
        return b.ratingCount! - a.ratingCount!;
      });

      setSearchResults(results.slice(0, 10));
      setSearching(false);
    } catch (error) {
      setSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!selectedProfile || isButtonDisabled) return;

    setIsButtonDisabled(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setIsButtonDisabled(false);
        return;
      }

      // Check if user already sent a request to this profile
      const notificationsRef = collection(db, 'notifications');
      const sentRequestQuery = query(
        notificationsRef,
        where('senderId', '==', currentUser.uid),
        where('recipientId', '==', selectedProfile.id),
        where('type', '==', 'like')
      );
      
      const sentRequestSnapshot = await getDocs(sentRequestQuery);
      let requestExists = false;
      
      sentRequestSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'pending' || data.status === 'accepted') {
          requestExists = true;
        }
      });

      if (requestExists) {
        // Show toast message
        setToastMessage('You already sent a request to this user!');
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
        if (data.participants.includes(selectedProfile.id)) {
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

      // Get current user's profile data
      const currentUserProfileRef = collection(db, 'profiles');
      const currentUserQuery = query(currentUserProfileRef, where('userId', '==', currentUser.uid));
      const currentUserSnapshot = await getDocs(currentUserQuery);
      let currentUserData: any = {};
      
      if (!currentUserSnapshot.empty) {
        currentUserData = currentUserSnapshot.docs[0].data();
      }

      // Create notification
      await addDoc(collection(db, 'notifications'), {
        recipientId: selectedProfile.id,
        senderId: currentUser.uid,
        senderName: currentUserData?.fullName || 'Someone',
        senderPhoto: currentUserData?.photoUri || null,
        type: 'like',
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Show success toast
      setToastMessage('Connection request sent!');
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
    } catch (error) {
      Alert.alert('Error', 'Failed to send connection request');
      setIsButtonDisabled(false);
    }
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    
    setTimeout(() => {
      const newCount = displayedCount + 10;
      const nextProfiles = allProfiles.slice(0, newCount);
      setProfiles(nextProfiles);
      setDisplayedCount(newCount);
      setLoadingMore(false);
    }, 300);
  };

  const loadReviews = async (profileId: string) => {
    try {
      setLoadingReviews(true);
      
      // Query ratings collection for ratings given to this user
      const ratingsRef = collection(db, 'ratings');
      const q = query(ratingsRef, where('toUserId', '==', profileId));
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
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoadingReviews(false);
    }
  };

  const displayedProfiles = searchQuery.trim() ? searchResults : profiles;
  const hasMoreProfiles = !searchQuery.trim() && displayedCount < allProfiles.length;
  const noMoreProfiles = !searchQuery.trim() && displayedCount >= allProfiles.length && allProfiles.length > 0;

  const ProfileCard = ({ profile }: { profile: UserProfile }) => {
    // Safety check - ensure profile has required fields
    if (!profile || !profile.fullName) {
      return null;
    }

    return (
    <TouchableOpacity
      className="bg-[#2a2a2a] rounded-2xl p-4 mb-3"
      onPress={() => {
        setSelectedProfile(profile);
        setShowProfileModal(true);
      }}
    >
      <View className="flex-row items-center">
        {/* User Photo */}
        {profile.photoUri ? (
          <Image
            source={{ uri: profile.photoUri }}
            style={{
              width: 70,
              height: 70,
              borderRadius: 35,
            }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: 70,
              height: 70,
              borderRadius: 35,
              backgroundColor: '#3a3a3a',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="person" size={35} color="#666" />
          </View>
        )}

        {/* Profile Info */}
        <View className="flex-1 ml-4">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-white text-lg font-semibold flex-1">
              {String(profile.fullName || 'Unknown')}
            </Text>
            {/* Rating */}
            <TouchableOpacity
              className="flex-row items-center ml-2"
              onPress={(e) => {
                e.stopPropagation();
                if (profile.ratingCount && profile.ratingCount > 0) {
                  loadReviews(profile.id);
                }
              }}
              disabled={!profile.ratingCount || profile.ratingCount === 0 || loadingReviews}
            >
              <Ionicons name="star" size={14} color="#ffa500" />
              <Text className="text-gray-300 text-xs ml-1">
                {profile.rating ? profile.rating.toFixed(1) : '0.0'} ({String(profile.ratingCount || 0)})
              </Text>
              {profile.ratingCount && profile.ratingCount > 0 && (
                <Ionicons name="chevron-forward" size={10} color="#666" className="ml-1" />
              )}
            </TouchableOpacity>
          </View>
          
          <View className="flex-row items-center mb-1">
            <Ionicons name="location-outline" size={14} color="#e04429" />
            <Text className="text-gray-500 text-sm ml-1">{String(profile.location || 'Unknown')}</Text>
          </View>

          {/* Skills Preview */}
          {profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0 && (
            <View className="flex-row flex-wrap mt-1">
              {profile.skills.slice(0, 3).map((skill, index) => (
                <View key={index} className="bg-[#3a3a3a] px-2 py-1 rounded-full mr-1 mb-1">
                  <Text className="text-orange-400 text-xs">{String(skill || '')}</Text>
                </View>
              ))}
              {profile.skills.length > 3 && (
                <View className="bg-[#3a3a3a] px-2 py-1 rounded-full">
                  <Text className="text-gray-400 text-xs">{`+${profile.skills.length - 3}`}</Text>
                </View>
              )}
            </View>
          )}

          {/* Matching Skills Indicator */}
          {(profile.matchingSkillsCount !== undefined && profile.matchingSkillsCount > 0) && (
            <View className="flex-row items-center mt-1">
              <Ionicons name="checkmark-circle" size={12} color="#22c55e" />
              <Text className="text-green-400 text-xs ml-1">
                {`${String(profile.matchingSkillsCount || 0)} match${(profile.matchingSkillsCount || 0) > 1 ? 'es' : ''}`}
              </Text>
            </View>
          )}
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={24} color="#666" />
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <View className="px-6 py-4">
        <Text className="text-white text-2xl font-bold mb-4">
          Search
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-[#2a2a2a] rounded-full px-4 py-3">
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            placeholder="Search by username..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            className="flex-1 text-white ml-2"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results Section */}
      <View className="flex-1 px-6">
        <Text className="text-white text-lg font-bold mb-4">
          {searchQuery.trim() ? 'Search Results' : 'Discover People'}
        </Text>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-400 text-base">Loading...</Text>
          </View>
        ) : searching ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-400 text-base">Searching...</Text>
          </View>
        ) : displayedProfiles.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="people-outline" size={80} color="#3a3a3a" />
            <Text className="text-gray-400 text-base mt-4">
              {searchQuery.trim() ? 'No users found' : 'No profiles available'}
            </Text>
            {searchQuery.trim() && (
              <Text className="text-gray-500 text-sm mt-2">
                Try a different search term
              </Text>
            )}
          </View>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {displayedProfiles.filter(p => p && p.id && p.fullName).map((profile, index) => (
              <ProfileCard key={profile.id || `profile-${index}`} profile={profile} />
            ))}
            
            {/* Load More Button or No More Profiles */}
            {hasMoreProfiles && (
              <TouchableOpacity 
                onPress={handleLoadMore}
                disabled={loadingMore}
                className="bg-[#2a2a2a] py-4 rounded-full mb-4 mt-2"
                style={{ opacity: loadingMore ? 0.5 : 1 }}
              >
                <Text className="text-orange-500 text-center text-base font-semibold">
                  {loadingMore ? 'Loading...' : 'Load More'}
                </Text>
              </TouchableOpacity>
            )}
            
            {noMoreProfiles && (
              <View className="py-6 items-center">
                <Text className="text-gray-500 text-sm">
                  No more profiles...
                </Text>
              </View>
            )}
            
            <View className="h-4" />
          </ScrollView>
        )}
      </View>

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-800">
              <Text className="text-white text-lg font-bold">Profile</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <Ionicons name="close" size={28} color="#e04429" />
              </TouchableOpacity>
            </View>

            {selectedProfile && (
              <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
                {/* Profile Image */}
                <View className="items-center py-6">
                  {selectedProfile.photoUri ? (
                    <Image 
                      source={{ uri: selectedProfile.photoUri }} 
                      style={{ 
                        width: 280, 
                        height: 280, 
                        borderRadius: 20 
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View 
                      style={{ 
                        width: 280, 
                        height: 280, 
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

                {/* Name and Rating */}
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white text-2xl font-bold">
                    {String(selectedProfile.fullName || 'Unknown User')}
                  </Text>
                  
                  <TouchableOpacity 
                    className="flex-row items-center"
                    onPress={() => {
                      if (selectedProfile.ratingCount && selectedProfile.ratingCount > 0) {
                        setShowProfileModal(false);
                        loadReviews(selectedProfile.id);
                      }
                    }}
                    disabled={!selectedProfile.ratingCount || selectedProfile.ratingCount === 0 || loadingReviews}
                  >
                    <Ionicons name="star" size={16} color="#ffa500" />
                    <Text className="text-gray-300 text-sm ml-1">
                      {selectedProfile.rating ? selectedProfile.rating.toFixed(1) : '0.0'} ({String(selectedProfile.ratingCount || 0)})
                    </Text>
                    {selectedProfile.ratingCount && selectedProfile.ratingCount > 0 && (
                      <Ionicons name="chevron-forward" size={12} color="#666" className="ml-1" />
                    )}
                  </TouchableOpacity>
                </View>
                
                {/* Location */}
                {selectedProfile.location && (
                  <View className="flex-row items-center mb-4">
                    <Ionicons name="location-outline" size={16} color="#e04429" />
                    <Text className="text-gray-400 text-sm ml-1">
                      {String(selectedProfile.location || '')}
                    </Text>
                  </View>
                )}

                {/* Skills */}
                {selectedProfile.skills && Array.isArray(selectedProfile.skills) && selectedProfile.skills.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-white text-base font-semibold mb-2">Skills</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedProfile.skills.map((skill: string, index: number) => {
                        const isMatching = userInterestedSkills.some((interestedSkill: string) =>
                          skill.toLowerCase() === interestedSkill.toLowerCase()
                        );
                        
                        return (
                          <View key={index} className={`px-3 py-2 rounded-full ${
                            isMatching ? 'bg-orange-500' : 'bg-[#3a3a3a]'
                          }`}>
                            <Text className={`text-sm ${
                              isMatching ? 'text-white font-medium' : 'text-orange-400'
                            }`}>
                              {String(skill || '')}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Bio */}
                <View style={{ marginBottom: 24 }}>
                  <View className="flex-row items-start mb-2">
                    <Ionicons name="chatbox-ellipses-outline" size={24} color="#e04429" style={{ marginRight: 8 }} />
                    <Text className="text-white text-base font-semibold">About</Text>
                  </View>
                  <Text className="text-gray-300 text-sm leading-5 italic">
                    "{selectedProfile.bio || 'Ready to share knowledge and learn new skills!'}"
                  </Text>
                </View>

                {/* Send Request Button */}
                <TouchableOpacity 
                  onPress={handleSendRequest}
                  disabled={isButtonDisabled}
                  className="bg-[#e04429] py-4 rounded-full mb-6"
                  style={{ opacity: isButtonDisabled ? 0.5 : 1 }}
                >
                  <Text className="text-white text-center text-lg font-semibold">
                    Send Connection Request
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
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
              <Ionicons 
                name={toastMessage === 'Connection request sent!' ? 'checkmark-circle-outline' : 'information-circle'} 
                size={24} 
                color="#e04429" 
              />
              <Text style={{ color: 'white', fontSize: 16, marginLeft: 12, flex: 1 }}>
                {toastMessage}
              </Text>
            </Animated.View>
          )}
        </View>
      </Modal>

      {/* Ratings Modal */}
      <RatingsModal
        visible={showReviewsModal}
        onClose={() => setShowReviewsModal(false)}
        reviews={reviews}
        loading={loadingReviews}
      />
    </SafeAreaView>
  );
}
