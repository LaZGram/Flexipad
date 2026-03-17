import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { 
  TabHeader,
  PatternManualSetupTab,
  PatternQRScanTab,
  PatternModeState 
} from '@/components/pattern';
import IoTPatternGameScreen from '@/components/pattern/IoTPatternGameScreen';
import tw from 'twrnc';

const PatternMode: React.FC = () => {
  const router = useRouter();
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
    repeatCount: 3,
  });

  const handlePatternConfigImport = (updates: Partial<PatternModeState>) => {
    setPatternConfig(prev => ({ ...prev, ...updates }));
  };

  const handlePatternConfigChange = (updates: Partial<PatternModeState>) => {
    // Clear levelPatterns when manual config is changed to prevent using imported patterns
    setPatternConfig(prev => ({ ...prev, ...updates, levelPatterns: undefined }));
  };

  const handleStartGame = () => {
    setShowGame(true);
  };

  const handleBackToConfig = () => {
    setShowGame(false);
  };

  const handleViewHistory = () => {
    router.push('/(tabs)/history/pattern-history');
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
        <View style={styles.headerTop}>
          <View style={styles.headerTextContainer}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/home')}
              style={tw`p-1`}
            >
              <MaterialIcons name="arrow-back" size={32} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Pattern Mode</Text>
          </View>
          <TouchableOpacity 
            style={styles.historyButton}
            onPress={handleViewHistory}
          >
            <MaterialIcons name="history" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <TabHeader activeTab={activeTab} onTabChange={(tab) => {
          setActiveTab(tab);
          // Clear levelPatterns when switching to manual tab
          if (tab === 'manual') {
            setPatternConfig(prev => ({ ...prev, levelPatterns: undefined }));
          }
        }} />
        
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
              onStartGame={handleStartGame}
            />
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4e54a3',
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 10,
    marginTop: 10
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffffff',
    marginBottom: 4,
  },
  historyButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 12,
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