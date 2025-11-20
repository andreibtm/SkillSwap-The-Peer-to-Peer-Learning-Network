import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import RatingsModal from '../components/RatingsModal';

interface Profile {
  id: string;
  userId: string;
  fullName: string;
  bio: string;
  location: string;
  photoUri: string;
  skills: string[];
  interestedSkills: string[];
  level: string;
  rating: number;
  ratingCount: number;
}

export default function UserProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, hideButton } = route.params as any;
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const profileRef = doc(db, 'profiles', userId);
      const profileDoc = await getDoc(profileRef);
      
      if (profileDoc.exists()) {
        setProfile({ id: profileDoc.id, ...profileDoc.data() } as Profile);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      
      // Query ratings collection for ratings given to this user
      const ratingsRef = collection(db, 'ratings');
      const q = query(ratingsRef, where('toUserId', '==', userId));
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

  const handleSendRequest = async () => {
    if (!profile || isButtonDisabled) return;

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
        if (data.participants.includes(profile.id)) {
          chatExists = true;
        }
      });

      if (chatExists) {
        Alert.alert('Already Matched', 'You already matched with this user!');
        setIsButtonDisabled(false);
        return;
      }

      // Get current user's profile data
      const currentUserDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
      const currentUserData = currentUserDoc.data();

      // Create notification
      await addDoc(collection(db, 'notifications'), {
        recipientId: profile.id,
        senderId: currentUser.uid,
        senderName: currentUserData?.fullName || 'Someone',
        senderPhoto: currentUserData?.photoUri || null,
        type: 'like',
        status: 'pending',
        createdAt: serverTimestamp()
      });

      Alert.alert('Success', 'Connection request sent!');
      setIsButtonDisabled(false);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to send connection request');
      setIsButtonDisabled(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400 text-base">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400 text-base">Profile not found</Text>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="mt-4 bg-[#e04429] px-6 py-3 rounded-full"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#e04429" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Profile Content */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Profile Image */}
        <View className="items-center py-6">
          {profile.photoUri ? (
            <Image 
              source={{ uri: profile.photoUri }} 
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
            {profile.fullName}
          </Text>
          
          <TouchableOpacity 
            className="flex-row items-center"
            onPress={loadReviews}
            disabled={!profile.ratingCount || profile.ratingCount === 0 || loadingReviews}
          >
            <Ionicons name="star" size={16} color="#ffa500" />
            <Text className="text-gray-300 text-sm ml-1">
              {profile.rating ? profile.rating.toFixed(1) : '0.0'} ({profile.ratingCount || 0})
            </Text>
            {profile.ratingCount > 0 && (
              <Ionicons name="chevron-forward" size={12} color="#666" className="ml-1" />
            )}
          </TouchableOpacity>
        </View>
        
        {/* Location */}
        {profile.location && (
          <View className="flex-row items-center mb-4">
            <Ionicons name="location-outline" size={16} color="#e04429" />
            <Text className="text-gray-400 text-sm ml-1">
              {profile.location}
            </Text>
          </View>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <View className="mb-4">
            <Text className="text-white text-base font-semibold mb-2">Skills</Text>
            <View className="flex-row flex-wrap gap-2">
              {profile.skills.map((skill: string, index: number) => (
                <View key={index} className="bg-[#3a3a3a] px-3 py-2 rounded-full">
                  <Text className="text-orange-400 text-sm">{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Interested Skills */}
        {profile.interestedSkills && profile.interestedSkills.length > 0 && (
          <View className="mb-4">
            <Text className="text-white text-base font-semibold mb-2">Interested In Learning</Text>
            <View className="flex-row flex-wrap gap-2">
              {profile.interestedSkills.map((skill: string, index: number) => (
                <View key={index} className="bg-[#1e3a5f] px-3 py-2 rounded-full">
                  <Text className="text-blue-300 text-sm">{skill}</Text>
                </View>
              ))}
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
            "{profile.bio || 'Ready to share knowledge and learn new skills!'}"
          </Text>
        </View>

        <View className="h-6" />
      </ScrollView>

      {/* Send Request Button */}
      {!hideButton && (
        <View className="px-6 pb-6">
          <TouchableOpacity 
            onPress={handleSendRequest}
            disabled={isButtonDisabled}
            className="bg-[#e04429] py-4 rounded-full"
            style={{ opacity: isButtonDisabled ? 0.5 : 1 }}
          >
            <Text className="text-white text-center text-lg font-semibold">
              Send Connection Request
            </Text>
          </TouchableOpacity>
        </View>
      )}

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
