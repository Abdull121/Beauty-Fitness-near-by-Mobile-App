import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import auth from '../Appwrite/auth'; 

export default function AdminProfileModal({ visible, onClose, username = 'Abdull121', owner = 'Owner' }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    try {
      // Show loading indicator
      setLoading(true)
      
      
      // Call your logout method
      const result = await auth.logout();
      if (!result) {
        setLoading(false)
        Alert.alert('Error', 'Logout failed. Please try again.');
        
        return;
      }
      console.log("Logout result:", result);
      setLoading(false)
      // Close the modal first
      onClose();
      
      // Reset navigation stack and go to the index page
      setTimeout(() => {
        // Using reset to clear the navigation stack
        router.replace({
          pathname: '/'
        });
      }, 100);
    } catch (error) {
      console.error("Logout error:", error);
      setLoading(false)
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const formatDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#6c3483', '#8e44ad']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHeader}
          >
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.profileIconContainer}>
              <Ionicons name="person-circle" size={80} color="#fff" />
            </View>
            
            <Text style={styles.usernameText}>{username}</Text>
            <Text style={styles.adminBadgeText}>{owner}</Text>
          </LinearGradient>
          
          <View style={styles.modalContent}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={22} color="#8e44ad" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Current Date/Time</Text>
                <Text style={styles.infoValue}>{formatDate()}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={22} color="#8e44ad" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Account Type</Text>
                <Text style={styles.infoValue}>{owner}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={22} color="#fff" />
                  <Text style={styles.logoutText}>Logout</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalHeader: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 30,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  profileIconContainer: {
    marginTop: 20,
    marginBottom: 15,
  },
  usernameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  adminBadgeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
  },
  modalContent: {
    padding: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoTextContainer: {
    marginLeft: 15,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 30,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});