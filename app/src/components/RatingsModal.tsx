import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Review {
  id: string;
  rating: number;
  fromUserId: string;
  reviewerName: string;
  reviewerPhoto: string | null;
  createdAt: string;
}

interface RatingsModalProps {
  visible: boolean;
  onClose: () => void;
  reviews: Review[];
  loading?: boolean;
}

export default function RatingsModal({ visible, onClose, reviews, loading }: RatingsModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ backgroundColor: '#1a1a1a', borderRadius: 24, width: '100%', maxHeight: '80%' }}>
          {/* Header */}
          <View className="flex-row justify-between items-center p-6 border-b border-[#2a2a2a]">
            <View className="flex-row items-center">
              <Ionicons name="star" size={24} color="#ffa500" />
              <Text className="text-white text-xl font-bold ml-2">
                Reviews
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Reviews List */}
          <ScrollView style={{ maxHeight: 500 }} contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View className="items-center justify-center py-12">
                <Text className="text-gray-400 text-base">Loading reviews...</Text>
              </View>
            ) : reviews.length === 0 ? (
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
  );
}
