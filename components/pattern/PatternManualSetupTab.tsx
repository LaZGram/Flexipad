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
        <Text style={styles.selectorTitle}>เลเวล</Text>
        <View style={styles.optionsGrid}>
          {[1, 2, 3, 4, 5].map(level => (
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
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Start Game Button */}
      {onStartGame && (
        <TouchableOpacity style={styles.startButton} onPress={onStartGame}>
          <MaterialIcons name="play-arrow" size={28} color="#fff" />
          <Text style={styles.startButtonText}>เริ่มเกม</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 4,
  },
  selectorContainer: {
    marginBottom: 20,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionItem: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    minWidth: 25,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#4e54a3',
    borderColor: '#4e54a3',
  },
  optionText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '700',
  },
  startButton: {
    backgroundColor: '#4e54a3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default PatternManualSetupTab;