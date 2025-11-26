import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import PadIncrementSelector from './PadIncrementSelector';
import MistakeBehaviorSelector from './MistakeBehaviorSelector';
import { PatternModeState } from './types';

interface PatternManualSetupTabProps {
  config: PatternModeState;
  onConfigChange: (updates: Partial<PatternModeState>) => void;
  onStartGame?: () => void;
}

const PatternManualSetupTab: React.FC<PatternManualSetupTabProps> = ({ config, onConfigChange, onStartGame }) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Game Configuration</Text>
      <Text style={styles.sectionDescription}>
        Configure how the pattern mode game will behave during IoT pad training
      </Text>

      <PadIncrementSelector
        value={config.padIncrementPerLevel}
        onChange={(value) => onConfigChange({ padIncrementPerLevel: value })}
      />

      <MistakeBehaviorSelector
        value={config.mistakeBehavior}
        onChange={(value) => onConfigChange({ mistakeBehavior: value })}
      />

      {/* Max Level Selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorTitle}>Maximum Level</Text>
        <Text style={styles.selectorDescription}>
          Set the maximum level to reach before the game ends
        </Text>
        <View style={styles.optionsGrid}>
          {[1, 2, 3, 5, 7, 10, 15, 20].map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.optionItem,
                config.maxLevel === level && styles.selectedOption
              ]}
              onPress={() => onConfigChange({ maxLevel: level })}
            >
              <Text style={[
                styles.optionText,
                config.maxLevel === level && styles.selectedOptionText
              ]}>
                {level} Levels
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Start Game Button */}
      {onStartGame && (
        <TouchableOpacity style={styles.startGameButton} onPress={onStartGame}>
          <MaterialIcons name="play-arrow" size={24} color="#fff" />
          <Text style={styles.startGameText}>Start IoT Pattern Game</Text>
        </TouchableOpacity>
      )}

      <View style={styles.additionalSettings}>
        <Text style={styles.settingsTitle}>IoT Pad Settings</Text>
        <Text style={styles.settingsDescription}>
          Configure connected IoT pad behavior and timing
        </Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Max Level to Reach:</Text>
          <Text style={styles.settingValue}>{config.maxLevel} levels</Text>
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Initial Sequence Length:</Text>
          <Text style={styles.settingValue}>{config.initialSequenceLength} pads</Text>
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Max Sequence Length:</Text>
          <Text style={styles.settingValue}>{config.maxSequenceLength} pads</Text>
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Step Timing:</Text>
          <Text style={styles.settingValue}>{config.stepTimingMs}ms</Text>
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Show Pattern Duration:</Text>
          <Text style={styles.settingValue}>{config.showPatternDurationMs}ms</Text>
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Input Timeout:</Text>
          <Text style={styles.settingValue}>{config.inputTimeoutMs}ms</Text>
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Difficulty:</Text>
          <Text style={styles.settingValue}>{config.difficulty}</Text>
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Sound Enabled:</Text>
          <Text style={styles.settingValue}>{config.soundEnabled ? 'Yes' : 'No'}</Text>
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Vibration Enabled:</Text>
          <Text style={styles.settingValue}>{config.vibrationEnabled ? 'Yes' : 'No'}</Text>
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Repeat Count:</Text>
          <Text style={styles.settingValue}>{config.repeatCount}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Configure these settings for optimal IoT pad performance. You can also import settings via QR code.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  additionalSettings: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingsDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  settingLabel: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
    color: '#4e54a3',
    fontWeight: '600',
    textAlign: 'right',
  },
  footer: {
    marginTop: 24,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fff9e6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffe066',
  },
  footerText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  startGameButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginVertical: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  startGameText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  selectorContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectorDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionItem: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#4e54a3',
    borderColor: '#007bff',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default PatternManualSetupTab;