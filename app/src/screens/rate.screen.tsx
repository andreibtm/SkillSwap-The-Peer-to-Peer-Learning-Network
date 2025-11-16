import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

export default function RateScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, userName } = route.params as any;
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Get the user's current rating data
      const userRef = doc(db, 'profiles', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentRating = userData.rating || 0;
        const currentCount = userData.ratingCount || 0;
        const ratedUserAuthId = userData.userId || userId; // Get the actual auth UID

        // Calculate new average rating
        const newCount = currentCount + 1;
        const newRating = ((currentRating * currentCount) + rating) / newCount;

        // Update the user's rating
        await updateDoc(userRef, {
          rating: newRating,
          ratingCount: newCount
        });

        // Store the rating record
        const ratingId = `${currentUser.uid}_${userId}`;
        await setDoc(doc(db, 'ratings', ratingId), {
          fromUserId: currentUser.uid,
          toUserId: userId,
          rating: rating,
          createdAt: new Date().toISOString()
        });

        // Get current user's profile for notification
        const currentUserDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
        const currentUserData = currentUserDoc.data();

        // Create a notification for the rated user (using their auth UID)
        const notificationRef = await addDoc(collection(db, 'notifications'), {
          recipientId: ratedUserAuthId, // Use auth UID instead of profile document ID
          senderId: currentUser.uid,
          senderName: currentUserData?.fullName || 'Someone',
          senderPhoto: currentUserData?.photoUri || null,
          type: 'rating',
          status: 'unread',
          rating: rating,
          newRating: newRating,
          message: `${currentUserData?.fullName || 'Someone'} rated you ${rating} ${rating === 1 ? 'star' : 'stars'}!`,
          createdAt: serverTimestamp()
        });

        Alert.alert('Success', 'Rating submitted successfully!');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="flex-row items-center py-4 mb-6">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#e04429" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold ml-4">Rate User</Text>
        </View>

        {/* Content */}
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-2xl font-bold mb-2 text-center">
            How was your experience with
          </Text>
          <Text className="text-orange-500 text-2xl font-bold mb-12 text-center">
            {userName}?
          </Text>

          {/* Star Rating */}
          <View className="flex-row gap-4 mb-12">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                disabled={submitting}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={50}
                  color={star <= rating ? '#ffa500' : '#666'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {rating > 0 && (
            <Text className="text-gray-400 text-lg mb-8">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </Text>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmitRating}
            disabled={submitting || rating === 0}
            className={`w-full py-4 rounded-full ${rating === 0 ? 'bg-[#3a3a3a]' : 'bg-[#e04429]'}`}
          >
            <Text className="text-white text-center text-lg font-semibold">
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
