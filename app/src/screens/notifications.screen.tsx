import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

interface Notification {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto: string | null;
  type: string;
  status: string;
  createdAt: any;
  senderSkills?: string[];
  rating?: number;
  newRating?: number;
  message?: string;
}

interface ProfileData {
  fullName: string;
  bio: string;
  location: string;
  photoUri: string | null;
  skills: string[];
  level: string;
  availability?: string;
  preference?: string;
  rating?: number;
  ratingCount?: number;
  createdAt?: string;
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const loadNotifications = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const notificationsRef = collection(db, 'notifications');
      
      // Get pending invitations (type: 'like', status: 'pending')
      const pendingQuery = query(
        notificationsRef,
        where('recipientId', '==', currentUser.uid),
        where('status', '==', 'pending')
      );

      // Get accepted notifications (type: 'accepted', recipientId: currentUser.uid)
      const acceptedQuery = query(
        notificationsRef,
        where('recipientId', '==', currentUser.uid),
        where('type', '==', 'accepted')
      );

      // Get rating notifications (type: 'rating', recipientId: currentUser.uid)
      const ratingQuery = query(
        notificationsRef,
        where('recipientId', '==', currentUser.uid),
        where('type', '==', 'rating')
      );

      console.log('Querying notifications for user:', currentUser.uid);

      const [pendingSnapshot, acceptedSnapshot, ratingSnapshot] = await Promise.all([
        getDocs(pendingQuery),
        getDocs(acceptedQuery),
        getDocs(ratingQuery)
      ]);

      console.log('Pending notifications:', pendingSnapshot.docs.length);
      console.log('Accepted notifications:', acceptedSnapshot.docs.length);
      console.log('Rating notifications:', ratingSnapshot.docs.length);

      const notifs: Notification[] = [];
      
      // Load notifications with sender skills
      for (const docSnapshot of pendingSnapshot.docs) {
        const notifData = docSnapshot.data();
        const senderDoc = await getDoc(doc(db, 'profiles', notifData.senderId));
        const senderSkills = senderDoc.exists() ? senderDoc.data()?.skills || [] : [];
        
        console.log('Sender:', notifData.senderName, 'Skills:', senderSkills);
        
        notifs.push({
          id: docSnapshot.id,
          ...notifData,
          senderSkills
        } as Notification);
      }

      for (const docSnapshot of acceptedSnapshot.docs) {
        const notifData = docSnapshot.data();
        const senderDoc = await getDoc(doc(db, 'profiles', notifData.senderId));
        const senderSkills = senderDoc.exists() ? senderDoc.data()?.skills || [] : [];
        
        console.log('Accepted Sender:', notifData.senderName, 'Skills:', senderSkills);
        
        notifs.push({
          id: docSnapshot.id,
          ...notifData,
          senderSkills
        } as Notification);
      }

      // Load rating notifications
      console.log('Rating notifications found:', ratingSnapshot.docs.length);
      for (const docSnapshot of ratingSnapshot.docs) {
        const notifData = docSnapshot.data();
        console.log('Rating notification data:', notifData);
        
        notifs.push({
          id: docSnapshot.id,
          ...notifData
        } as Notification);
      }

      // Sort by timestamp (most recent first)
      notifs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
    }, [])
  );

  const handleAccept = async (notification: Notification) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Create a chat between the two users
      const chatId = [currentUser.uid, notification.senderId].sort().join('_');
      const chatRef = doc(db, 'chats', chatId);
      
      // Get current user's profile data
      const currentUserDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
      const currentUserData = currentUserDoc.data();

      await setDoc(chatRef, {
        participants: [currentUser.uid, notification.senderId],
        participantNames: {
          [currentUser.uid]: currentUserData?.fullName || 'User',
          [notification.senderId]: notification.senderName
        },
        participantPhotos: {
          [currentUser.uid]: currentUserData?.photoUri || null,
          [notification.senderId]: notification.senderPhoto
        },
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      // Send acceptance notification to the sender
      await addDoc(collection(db, 'notifications'), {
        recipientId: notification.senderId,
        senderId: currentUser.uid,
        senderName: currentUserData?.fullName || 'Someone',
        senderPhoto: currentUserData?.photoUri || null,
        type: 'accepted',
        status: 'read',
        createdAt: serverTimestamp()
      });

      // Delete the original notification
      await deleteDoc(doc(db, 'notifications', notification.id));

      loadNotifications();
    } catch (error) {
      console.error('Error accepting:', error);
      Alert.alert('Error', 'Failed to accept invitation');
    }
  };

  const handleReject = async (notification: Notification) => {
    try {
      // Delete the notification
      const notificationRef = doc(db, 'notifications', notification.id);
      await deleteDoc(notificationRef);

      loadNotifications();
    } catch (error) {
      console.error('Error rejecting:', error);
      Alert.alert('Error', 'Failed to reject invitation');
    }
  };

  const handleDismiss = async (notification: Notification) => {
    try {
      const notificationRef = doc(db, 'notifications', notification.id);
      await deleteDoc(notificationRef);
      loadNotifications();
    } catch (error) {
      console.error('Error dismissing:', error);
    }
  };

  const handleProfileClick = async (senderId: string) => {
    try {
      const profileDoc = await getDoc(doc(db, 'profiles', senderId));
      if (profileDoc.exists()) {
        setSelectedProfile(profileDoc.data() as ProfileData);
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const notifDate = timestamp.toDate();
    const diffInSeconds = Math.floor((now.getTime() - notifDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 mb-6">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#e04429" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold ml-4">Notifications</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400">Loading...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="notifications-off-outline" size={80} color="#666" />
          <Text className="text-gray-400 text-lg mt-6 text-center">
            No notifications yet
          </Text>
          <Text className="text-gray-500 text-sm mt-2 text-center">
            Start swapping to get notifications!
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-6">
          {notifications.map((notification) => {
            console.log('Rendering notification:', notification.senderName, 'Skills:', notification.senderSkills, 'Type:', notification.type);
            return (
            <View 
              key={notification.id}
              className="bg-[#2a2a2a] rounded-2xl p-4 mb-4"
            >
              {/* Date */}
              {notification.createdAt && (
                <Text className="text-gray-500 text-xs text-right mb-2">
                  {getTimeAgo(notification.createdAt)}
                </Text>
              )}
              {/* User Info */}
              <View className="flex-row items-center mb-3">
                {notification.type !== 'rating' && (
                  <TouchableOpacity onPress={() => handleProfileClick(notification.senderId)}>
                    {notification.senderPhoto ? (
                      <Image 
                        source={{ uri: notification.senderPhoto }}
                        style={{ width: 60, height: 60, borderRadius: 30 }}
                      />
                    ) : (
                      <View className="w-15 h-15 rounded-full bg-[#3a3a3a] items-center justify-center">
                        <Ionicons name="person" size={30} color="#666" />
                      </View>
                    )}
                  </TouchableOpacity>
                )}
                
                {notification.type === 'rating' ? (
                  // Rating notification layout
                  <View className="flex-1 flex-row items-center">
                    <View className="bg-orange-500 rounded-full p-3 mr-4">
                      <Ionicons name="star" size={30} color="#fff" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-lg font-bold mb-1">
                        New Rating Received! 🎉
                      </Text>
                      <Text className="text-gray-400 text-sm mb-2">
                        {notification.message || `${notification.senderName} rated you ${notification.rating} ${notification.rating === 1 ? 'star' : 'stars'}!`}
                      </Text>
                      {notification.newRating && (
                        <View className="flex-row items-center">
                          <Text className="text-orange-400 text-sm font-semibold mr-2">
                            Your new rating:
                          </Text>
                          <Ionicons name="star" size={14} color="#ffa500" />
                          <Text className="text-white text-sm font-bold ml-1">
                            {notification.newRating.toFixed(1)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity 
                      onPress={() => handleDismiss(notification)}
                      className="ml-2"
                    >
                      <Ionicons name="close-circle" size={28} color="#666" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  // Regular notification layout
                  <>
                    <View className="flex-1 ml-4">
                      <Text className="text-white text-lg font-bold">
                        {notification.senderName}
                      </Text>
                      <Text className="text-gray-400 text-sm">
                        {notification.type === 'accepted' 
                          ? 'accepted your invitation!' 
                          : 'wants to connect with you'}
                      </Text>
                      
                      {/* Skills */}
                      {notification.senderSkills && notification.senderSkills.length > 0 && notification.type !== 'accepted' && (
                        <View className="flex-row flex-wrap gap-2 mt-2">
                          {notification.senderSkills.slice(0, 3).map((skill, index) => (
                            <View key={index} style={{ backgroundColor: 'rgba(224, 68, 41, 0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#e04429' }}>
                              <Text className="text-white text-xs font-semibold">{skill}</Text>
                            </View>
                          ))}
                          {notification.senderSkills.length > 3 && (
                            <View style={{ backgroundColor: 'rgba(224, 68, 41, 0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#e04429' }}>
                              <Text className="text-white text-xs font-semibold">
                                {`...+${notification.senderSkills.length - 3}`}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                    
                    {/* Dismiss button for accepted notifications */}
                    {notification.type === 'accepted' && (
                      <TouchableOpacity 
                        onPress={() => handleDismiss(notification)}
                        className="ml-2"
                      >
                        <Ionicons name="close-circle" size={28} color="#666" />
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>

              {/* Accept/Reject Buttons (only for pending invitations) */}
              {notification.type !== 'accepted' && notification.type !== 'rating' && (
                <View className="flex-row justify-between mt-3">
                  <TouchableOpacity 
                    onPress={() => handleReject(notification)}
                    className="flex-1 bg-[#3a3a3a] py-3 rounded-full mr-2"
                  >
                    <Text className="text-white text-center font-semibold">
                      Reject
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleAccept(notification)}
                    className="flex-1 bg-[#e04429] py-3 rounded-full ml-2"
                  >
                    <Text className="text-white text-center font-semibold">
                      Accept
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            );
          })}
        </ScrollView>
      )}

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center' }}>
          <View className="bg-[#1a1a1a] rounded-3xl w-11/12 max-h-5/6" style={{ maxHeight: '80%' }}>
            {/* Header */}
            <View className="flex-row justify-between items-center p-4 border-b border-[#2a2a2a]">
              <Text className="text-white text-xl font-bold">Profile</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <Ionicons name="close" size={28} color="#e04429" />
              </TouchableOpacity>
            </View>

            {/* Profile Content */}
            {selectedProfile && (
              <ScrollView className="p-6">
                {/* Profile Picture */}
                <View className="items-center mb-6">
                  {selectedProfile.photoUri ? (
                    <Image 
                      source={{ uri: selectedProfile.photoUri }}
                      style={{ width: 120, height: 120, borderRadius: 60 }}
                    />
                  ) : (
                    <View className="w-30 h-30 rounded-full bg-[#2a2a2a] items-center justify-center">
                      <Ionicons name="person" size={60} color="#666" />
                    </View>
                  )}
                  <Text className="text-white text-2xl font-bold mt-4">{selectedProfile.fullName}</Text>
                  
                  {/* Location */}
                  {selectedProfile.location && (
                    <View className="flex-row items-center mt-2">
                      <Ionicons name="location" size={18} color="#e04429" />
                      <Text className="text-gray-300 ml-1">{selectedProfile.location}</Text>
                    </View>
                  )}
                  
                  {/* Rating */}
                  {selectedProfile.rating && (
                    <View className="flex-row items-center mt-2">
                      <Ionicons name="star" size={20} color="#f7ba2b" />
                      <Text className="text-white text-lg ml-2">
                        {selectedProfile.rating.toFixed(1)} ({selectedProfile.ratingCount || 0})
                      </Text>
                    </View>
                  )}
                </View>

                {/* Bio */}
                {selectedProfile.bio && (
                  <View className="mb-4">
                    <Text className="text-white text-lg font-semibold mb-2">About</Text>
                    <Text className="text-gray-300">{selectedProfile.bio}</Text>
                  </View>
                )}

                {/* Skills */}
                {selectedProfile.skills && selectedProfile.skills.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-white text-lg font-semibold mb-2">Skills</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedProfile.skills.map((skill, index) => (
                        <View key={index} style={{ backgroundColor: 'rgba(224, 68, 41, 0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#e04429' }}>
                          <Text className="text-white text-xs font-semibold">{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Availability */}
                {(selectedProfile.preference || selectedProfile.availability) && (
                  <View className="mb-4">
                    <Text className="text-white text-lg font-semibold mb-2">Availability</Text>
                    <Text className="text-gray-300">
                      {(() => {
                        const pref = selectedProfile.preference || selectedProfile.availability;
                        if (pref?.toLowerCase() === 'flexible') return 'Hybrid';
                        if (pref === 'online') return 'Online';
                        if (pref === 'in-person') return 'In-Person';
                        if (pref === 'hybrid') return 'Hybrid';
                        return pref;
                      })()}
                    </Text>
                  </View>
                )}

                {/* Joined At */}
                {selectedProfile.createdAt && (
                  <View className="mb-4">
                    <Text className="text-white text-lg font-semibold mb-2">Joined At</Text>
                    <Text className="text-gray-300">
                      {new Date(selectedProfile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}