import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

type ToastConfigProps = {
  visible: boolean;
  message: string;
  onClose: () => void;
};

const ToastConfig: React.FC<ToastConfigProps> = ({ visible, message, onClose }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* <Text style={styles.title}>Status</Text> */}
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '50%',
  },
  title: { fontSize: 14,   fontFamily: "SF Pro Display", fontWeight: 'bold', marginBottom: 10, textAlign: "center" },
  message: { fontSize: 12,   fontFamily: "SF Pro Display", lineHeight: 22, textAlign:"center" },
  button: {
    marginTop: 20,
    alignSelf: 'center',
    padding: 10,
    backgroundColor: '#316b83',
    borderRadius: 5,
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
});

export default ToastConfig;
