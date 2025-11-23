import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  TabHeader,
  PatternManualSetupTab,
  PatternQRScanTab,
  PatternModeState 
} from '@/components/pattern';
import IoTPatternGameScreen from '@/components/pattern/IoTPatternGameScreen';

const PatternMode: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'manual' | 'qr'>('manual');
  const [showGame, setShowGame] = useState(false);
  
  // Pattern Mode State with sensible defaults
  const [patternConfig, setPatternConfig] = useState<PatternModeState>({
    padIncrementPerLevel: 1,
    mistakeBehavior: 'restart',
    initialSequenceLength: 1,
    maxSequenceLength: 10,
    maxLevel: 5, // Default to 5 levels
    stepTimingMs: 1000,
    showPatternDurationMs: 2000,
    inputTimeoutMs: 3000,
    soundEnabled: true,
    vibrationEnabled: true,
    difficulty: 'medium',
    repeatCount: 3,
  });

  const handlePatternConfigImport = (updates: Partial<PatternModeState>) => {
    setPatternConfig(prev => ({ ...prev, ...updates }));
  };

  const handlePatternConfigChange = (updates: Partial<PatternModeState>) => {
    setPatternConfig(prev => ({ ...prev, ...updates }));
  };

  const handleStartGame = () => {
    setShowGame(true);
  };

  const handleBackToConfig = () => {
    setShowGame(false);
  };

  if (showGame) {
    return (
      <IoTPatternGameScreen 
        config={patternConfig} 
        onBack={handleBackToConfig}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pattern Mode Configuration</Text>
        <Text style={styles.subtitle}>
          Configure sequence patterns and game behavior for IoT pad training
        </Text>
      </View>

      <View style={styles.content}>
        <TabHeader activeTab={activeTab} onTabChange={setActiveTab} />
        
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'manual' ? (
            <PatternManualSetupTab
              config={patternConfig}
              onConfigChange={handlePatternConfigChange}
              onStartGame={handleStartGame}
            />
          ) : (
            <PatternQRScanTab
              onConfigImport={handlePatternConfigImport}
            />
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tabContent: {
    flex: 1,
  },
});

export default PatternMode;