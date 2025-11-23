import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import QRScannerModal from '../mode/qr/QRScannerModal';
import { PatternModeConfig, PatternModeState } from './types';
import { validatePatternModeConfig } from './validator';

interface PatternQRScanTabProps {
  onConfigImport: (config: Partial<PatternModeState>) => void;
}

const PatternQRScanTab: React.FC<PatternQRScanTabProps> = ({ onConfigImport }) => {
  const [showScanner, setShowScanner] = useState(false);
  const [lastImported, setLastImported] = useState<PatternModeConfig | null>(null);

  const handleQRScan = (data: string) => {
    try {
      const parsedData = JSON.parse(data);
      const validation = validatePatternModeConfig(parsedData);

      if (!validation.isValid || !validation.config) {
        Alert.alert(
          'Invalid Configuration',
          validation.error || 'The QR code does not contain valid Pattern Mode configuration data.',
          [{ text: 'OK' }]
        );
        return;
      }

      const config = validation.config;
      
      // Convert to state format
      const stateConfig: Partial<PatternModeState> = {
        padIncrementPerLevel: config.padIncrementPerLevel,
        mistakeBehavior: config.mistakeBehavior,
        initialSequenceLength: config.patternSettings.initialSequenceLength,
        maxSequenceLength: config.patternSettings.maxSequenceLength,
        stepTimingMs: config.patternSettings.stepTimingMs,
        showPatternDurationMs: config.patternSettings.showPatternDurationMs,
        inputTimeoutMs: config.patternSettings.inputTimeoutMs,
        soundEnabled: config.gameSettings.soundEnabled,
        vibrationEnabled: config.gameSettings.vibrationEnabled,
        difficulty: config.gameSettings.difficulty,
        repeatCount: config.gameSettings.repeatCount,
      };

      onConfigImport(stateConfig);
      setLastImported(config);
      setShowScanner(false);

      Alert.alert(
        'Configuration Imported',
        `Successfully imported Pattern Mode configuration: ${config.metadata.description || 'Unnamed configuration'}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      Alert.alert(
        'Import Error',
        'Failed to parse QR code data. Please make sure it contains valid JSON.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.scanSection}>
        <MaterialIcons name="qr-code-scanner" size={48} color="#007bff" />
        <Text style={styles.title}>Import Pattern Mode Configuration</Text>
        <Text style={styles.description}>
          Scan a QR code to quickly import pattern mode settings for your IoT pads, including pad increment, 
          mistake behavior, timing, and other game parameters optimized for physical pad training.
        </Text>
        
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setShowScanner(true)}
        >
          <MaterialIcons name="camera-alt" size={20} color="#fff" />
          <Text style={styles.scanButtonText}>Scan QR Code</Text>
        </TouchableOpacity>
      </View>

      {lastImported && (
        <View style={styles.importedSection}>
          <View style={styles.importedHeader}>
            <MaterialIcons name="check-circle" size={20} color="#28a745" />
            <Text style={styles.importedTitle}>Last Imported Configuration</Text>
          </View>
          
          <View style={styles.configSummary}>
            <Text style={styles.configTitle}>
              {lastImported.metadata.description || 'Pattern Mode Config'}
            </Text>
            <Text style={styles.configVersion}>
              Version: {lastImported.metadata.version}
            </Text>
            <Text style={styles.configDate}>
              Created: {lastImported.metadata.createdDate}
            </Text>
            
            <View style={styles.configDetails}>
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Pad Increment:</Text>
                <Text style={styles.configValue}>+{lastImported.padIncrementPerLevel} per level</Text>
              </View>
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Mistake Behavior:</Text>
                <Text style={styles.configValue}>
                  {lastImported.mistakeBehavior === 'restart' ? 'Restart from Beginning' : 'Continue Until Correct'}
                </Text>
              </View>
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Initial Length:</Text>
                <Text style={styles.configValue}>{lastImported.patternSettings.initialSequenceLength} pads</Text>
              </View>
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Difficulty:</Text>
                <Text style={styles.configValue}>{lastImported.gameSettings.difficulty}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <QRScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleQRScan}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scanSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fbff',
    borderRadius: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  importedSection: {
    backgroundColor: '#f8fff8',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d4edda',
  },
  importedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  importedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
    marginLeft: 8,
  },
  configSummary: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
  },
  configTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  configVersion: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  configDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  configDetails: {
    gap: 4,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  configLabel: {
    fontSize: 12,
    color: '#666',
  },
  configValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
});

export default PatternQRScanTab;