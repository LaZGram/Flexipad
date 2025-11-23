import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Modal, TextInput, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ visible, onClose, onScan }) => {
  const [qrData, setQrData] = useState('');

  const handleManualInput = () => {
    if (!qrData.trim()) {
      Alert.alert('Error', 'Please enter QR code data');
      return;
    }
    onScan(qrData.trim());
    setQrData('');
  };

  const handleClose = () => {
    setQrData('');
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <MaterialIcons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Enter QR Code Data</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.content}>
          <Text style={styles.instruction}>
            Paste your QR code JSON data below:
          </Text>
          
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={10}
            value={qrData}
            onChangeText={setQrData}
            placeholder="Paste QR code JSON data here..."
            textAlignVertical="top"
          />
          
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleManualInput}
          >
            <MaterialIcons name="check" size={24} color="#fff" />
            <Text style={styles.submitText}>Import Configuration</Text>
          </TouchableOpacity>
          
          <Text style={styles.note}>
            Note: QR scanner will be available after building with native modules. 
            For now, you can manually paste the configuration data.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instruction: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'monospace',
    flex: 1,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#007bff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default QRScannerModal;