import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastConfigProps = {
  visible: boolean;
  message: string;
  onClose: () => void;
};

const { width } = Dimensions.get('window');

const ToastConfig: React.FC<ToastConfigProps> = ({ visible, message, onClose }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="information-circle-outline" size={32} color="#316b83" />
            </View>
            <Text style={styles.message}>{message}</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: width * 0.8,
    maxWidth: 340,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  message: { 
    fontSize: 15, 
    color: '#1F2937',
    textAlign: "center",
    lineHeight: 24,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    width: '100%',
  },
  button: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F8FAFC',
  },
  buttonText: { 
    color: '#316b83', 
    fontSize: 16, 
    fontWeight: '700' 
  },
});

export default ToastConfig;
