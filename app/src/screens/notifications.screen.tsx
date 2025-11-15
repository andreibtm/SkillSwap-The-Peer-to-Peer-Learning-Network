import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
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
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

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

      const [pendingSnapshot, acceptedSnapshot] = await Promise.all([
        getDocs(pendingQuery),
        getDocs(acceptedQuery)
      ]);

      const notifs: Notification[] = [];
      
      // Load notifications with sender skills
      for (const docSnapshot of pendingSnapshot.docs) {
        const notifData = docSnapshot.data();
        const senderDoc = await getDoc(doc(db, 'profiles', notifData.senderId));
        const senderSkills = senderDoc.exists() ? senderDoc.data()?.skills || [] : [];
        
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
        
        notifs.push({
          id: docSnapshot.id,
          ...notifData,
          senderSkills
        } as Notification);
      }

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

      Alert.alert('Accepted!', `You're now connected with ${notification.senderName}`);
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

      Alert.alert('Rejected', 'Invitation rejected');
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
          {notifications.map((notification) => (
            <View 
              key={notification.id}
              className="bg-[#2a2a2a] rounded-2xl p-4 mb-4"
            >
              {/* User Info */}
              <View className="flex-row items-center mb-3">
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
                      {notification.senderSkills.slice(0, 2).map((skill, index) => (
                        <View key={index} className="bg-[#5a3825] px-3 py-1 rounded-full">
                          <Text className="text-orange-200 text-xs">{skill}</Text>
                        </View>
                      ))}
                      {notification.senderSkills.length > 2 && (
                        <View className="bg-[#5a3825] px-3 py-1 rounded-full">
                          <Text className="text-orange-200 text-xs">
                            ...+{notification.senderSkills.length - 2}
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
              </View>

              {/* Accept/Reject Buttons (only for pending invitations) */}
              {notification.type !== 'accepted' && (
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
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}