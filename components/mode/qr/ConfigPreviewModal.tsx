import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { QRConfigurationData } from './types';

interface ConfigPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onReject: () => void;
  configData: QRConfigurationData | null;
}

const ConfigPreviewModal: React.FC<ConfigPreviewModalProps> = ({
  visible,
  onClose,
  onConfirm,
  onReject,
  configData
}) => {
  if (!visible || !configData) return null;

  const { metadata, configuration } = configData;

  const formatDuration = (minutes: number, seconds: number) => {
    if (minutes === 0) return `${seconds}s`;
    if (seconds === 0) return `${minutes}m`;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <MaterialIcons name="qr-code" size={24} color="#419E68" />
          <Text style={styles.headerTitle}>Import Configuration</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Metadata Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuration Info</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{metadata.name || 'Unnamed Configuration'}</Text>
            </View>
            {metadata.description && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Description:</Text>
                <Text style={styles.value}>{metadata.description}</Text>
              </View>
            )}
            {metadata.created_by && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Created by:</Text>
                <Text style={styles.value}>{metadata.created_by}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.label}>Version:</Text>
              <Text style={styles.value}>{configData.version}</Text>
            </View>
          </View>

          {/* Light Out Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Light Out Settings</Text>
            <View style={styles.configRow}>
              <MaterialIcons name="wb-twilight" size={20} color="#419E68" />
              <Text style={styles.configLabel}>Mode:</Text>
              <Text style={styles.configValue}>{configuration.lightOut.mode}</Text>
            </View>
            {configuration.lightOut.hitCount && (
              <View style={styles.configRow}>
                <View style={styles.iconPlaceholder} />
                <Text style={styles.configLabel}>Hit Count:</Text>
                <Text style={styles.configValue}>{configuration.lightOut.hitCount}</Text>
              </View>
            )}
            {configuration.lightOut.timeout && (
              <View style={styles.configRow}>
                <View style={styles.iconPlaceholder} />
                <Text style={styles.configLabel}>Timeout:</Text>
                <Text style={styles.configValue}>{configuration.lightOut.timeout}s</Text>
              </View>
            )}
          </View>

          {/* Light Delay Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Light Delay Settings</Text>
            <View style={styles.configRow}>
              <MaterialIcons name="timer" size={20} color="#419E68" />
              <Text style={styles.configLabel}>Mode:</Text>
              <Text style={styles.configValue}>{configuration.lightDelay.mode}</Text>
            </View>
            {configuration.lightDelay.delayTime && (
              <View style={styles.configRow}>
                <View style={styles.iconPlaceholder} />
                <Text style={styles.configLabel}>Delay:</Text>
                <Text style={styles.configValue}>{configuration.lightDelay.delayTime}s</Text>
              </View>
            )}
            {configuration.lightDelay.randomRange && (
              <View style={styles.configRow}>
                <View style={styles.iconPlaceholder} />
                <Text style={styles.configLabel}>Range:</Text>
                <Text style={styles.configValue}>
                  {configuration.lightDelay.randomRange.min}s - {configuration.lightDelay.randomRange.max}s
                </Text>
              </View>
            )}
          </View>

          {/* Duration Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Duration Settings</Text>
            <View style={styles.configRow}>
              <MaterialIcons name="schedule" size={20} color="#419E68" />
              <Text style={styles.configLabel}>Mode:</Text>
              <Text style={styles.configValue}>{configuration.duration.mode}</Text>
            </View>
            {configuration.duration.hitCount && (
              <View style={styles.configRow}>
                <View style={styles.iconPlaceholder} />
                <Text style={styles.configLabel}>Hit Count:</Text>
                <Text style={styles.configValue}>{configuration.duration.hitCount}</Text>
              </View>
            )}
            {configuration.duration.timeoutDuration && (
              <View style={styles.configRow}>
                <View style={styles.iconPlaceholder} />
                <Text style={styles.configLabel}>Duration:</Text>
                <Text style={styles.configValue}>
                  {formatDuration(
                    configuration.duration.timeoutDuration.minutes,
                    configuration.duration.timeoutDuration.seconds
                  )}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.rejectButton} onPress={onReject}>
            <MaterialIcons name="close" size={20} color="#FF6B6B" />
            <Text style={styles.rejectButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
            <MaterialIcons name="check" size={20} color="#fff" />
            <Text style={styles.confirmButtonText}>Import</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    maxHeight: 400,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    width: 80,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconPlaceholder: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  configLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    width: 80,
  },
  configValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    backgroundColor: '#fff',
  },
  rejectButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#419E68',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default ConfigPreviewModal;