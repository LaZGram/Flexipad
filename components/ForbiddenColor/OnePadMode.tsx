import React, { useState, useCallback } from 'react';
import { StyleSheet, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

interface GameConfig {
  redProbability: number;
  redDisplayDuration: number;
  greenTimeout: number;
  enableGreenTimeout: boolean;
  sessionTimeLimit: number;
}

interface OnePadModeProps {
  availablePads: number[];
  sendLedCommand: (padId: number, color: 'red' | 'green' | 'off') => Promise<void>;
}

const OnePadMode: React.FC<OnePadModeProps> = ({ availablePads, sendLedCommand }) => {
  const router = useRouter();
  const [selectedPad, setSelectedPad] = useState<number | null>(null);
  const [config, setConfig] = useState<GameConfig>({
    redProbability: 0.3,
    redDisplayDuration: 800,
    greenTimeout: 3000,
    enableGreenTimeout: true,
    sessionTimeLimit: 60,
  });

  const handlePadSelection = useCallback((padIndex: number) => {
    setSelectedPad(padIndex);
    console.log(`📍 [One Pad] Selected pad ${padIndex + 1}`);
  }, []);

  const handleBlinkPad = useCallback(async () => {
    if (selectedPad === null) return;
    
    console.log(`💡 [One Pad] Blinking pad ${selectedPad + 1}...`);
    
    const colors: Array<'red' | 'green'> = ['red', 'green'];
    
    for (let i = 0; i < 5; i++) {
      const color = colors[i % 2];
      await sendLedCommand(selectedPad, color);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    await sendLedCommand(selectedPad, 'off');
    console.log(`✅ [One Pad] Blink complete`);
  }, [selectedPad, sendLedCommand]);

  const handleStartGame = useCallback(() => {
    if (selectedPad === null) {
      Alert.alert('เลือกแผ่นกด', 'กรุณาเลือกแผ่นกดก่อนเริ่มเกม');
      return;
    }
    
    console.log(`🚀 [One Pad] Starting game on pad ${selectedPad + 1}`);
    router.push({
      pathname: '/one-pad-gameplay',
      params: { 
        padId: selectedPad.toString(),
        config: JSON.stringify(config)
      }
    });
  }, [selectedPad, router, config]);

  return (
    <ThemedView style={styles.container}>
      {/* Pad Selection */}
      <ThemedView style={styles.selectionCard}>
        <ThemedText style={styles.sectionTitle}>เลือกแผ่นกด</ThemedText>
        <ThemedView style={styles.padsGrid}>
          {availablePads.map((padIndex) => {
            const isSelected = selectedPad === padIndex;
            
            return (
              <ThemedView 
                key={padIndex}
                style={[
                  styles.pad,
                  isSelected && styles.padSelected,
                  !isSelected && styles.padOff,
                ]}
                onTouchEnd={() => handlePadSelection(padIndex)}
              >
                <ThemedText style={styles.padNumber}>{padIndex + 1}</ThemedText>
                {isSelected && <ThemedText style={styles.selectedLabel}>✓</ThemedText>}
              </ThemedView>
            );
          })}
        </ThemedView>
        {selectedPad === null && (
          <ThemedText style={styles.selectionHint}>แตะแผ่นกดเพื่อเลือก</ThemedText>
        )}
        {selectedPad !== null && (
          <ThemedText style={styles.selectedText}>เลือกแล้ว: แผ่นกด {selectedPad + 1}</ThemedText>
        )}
      </ThemedView>

      {/* Game Configuration */}
      <ThemedView style={styles.configCard}>
        <ThemedText style={styles.sectionTitle}>การตั้งค่าเกม</ThemedText>
        
        {/* Red Probability */}
        <ThemedView style={styles.configItem}>
          <ThemedView style={styles.configLabelContainer}>
            <ThemedText style={styles.configItemLabel}>โอกาสสีแดง</ThemedText>
            <ThemedText style={styles.configItemHint}>ค่าระหว่าง 0 ถึง 100%</ThemedText>
          </ThemedView>
          <TextInput
            style={styles.inputModern}
            value={(config.redProbability * 100).toString()}
            onChangeText={(text) => {
              const value = parseInt(text);
              if (!isNaN(value) && value >= 0 && value <= 100) {
                setConfig({ ...config, redProbability: value/100 });
              }
            }}
            keyboardType="number-pad"
            placeholder="30"
            placeholderTextColor="#999"
          />
        </ThemedView>

        {/* Red Display Duration */}
        <ThemedView style={styles.configItem}>
          <ThemedView style={styles.configLabelContainer}>
            <ThemedText style={styles.configItemLabel}>ระยะเวลาแสดงสีแดง</ThemedText>
            <ThemedText style={styles.configItemHint}>มิลลิวินาที</ThemedText>
          </ThemedView>
          <TextInput
            style={styles.inputModern}
            value={config.redDisplayDuration.toString()}
            onChangeText={(text) => {
              const value = parseInt(text);
              if (!isNaN(value) && value > 0) {
                setConfig({ ...config, redDisplayDuration: value });
              }
            }}
            keyboardType="number-pad"
            placeholder="800"
            placeholderTextColor="#999"
          />
        </ThemedView>

        {/* Enable Green Timeout */}
        <ThemedView style={styles.configItem}>
          <ThemedView style={styles.configLabelContainer}>
            <ThemedText style={styles.configItemLabel}>เปิดใช้หมดเวลาสีเขียว</ThemedText>
            <ThemedText style={styles.configItemHint}>จำกัดเวลาการกดสีเขียว</ThemedText>
          </ThemedView>
          <ThemedView 
            style={[
              styles.toggleButtonModern,
              config.enableGreenTimeout && styles.toggleButtonModernActive
            ]}
            onTouchEnd={() => setConfig({ ...config, enableGreenTimeout: !config.enableGreenTimeout })}
          >
            <ThemedText style={[
              styles.toggleTextModern,
              config.enableGreenTimeout && styles.toggleTextModernActive
            ]}>
              {config.enableGreenTimeout ? 'ON' : 'OFF'}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Green Timeout (conditional) */}
        {config.enableGreenTimeout && (
          <ThemedView style={styles.configItem}>
            <ThemedView style={styles.configLabelContainer}>
              <ThemedText style={styles.configItemLabel}>หมดเวลาสีเขียว</ThemedText>
              <ThemedText style={styles.configItemHint}>มิลลิวินาที</ThemedText>
            </ThemedView>
            <TextInput
              style={styles.inputModern}
              value={config.greenTimeout.toString()}
              onChangeText={(text) => {
                const value = parseInt(text);
                if (!isNaN(value) && value > 0) {
                  setConfig({ ...config, greenTimeout: value });
                }
              }}
              keyboardType="number-pad"
              placeholder="3000"
              placeholderTextColor="#999"
            />
          </ThemedView>
        )}

        {/* Session Time Limit */}
        <ThemedView style={styles.configItem}>
          <ThemedView style={styles.configLabelContainer}>
            <ThemedText style={styles.configItemLabel}>ระยะเวลาเซสชัน</ThemedText>
            <ThemedText style={styles.configItemHint}>วินาที</ThemedText>
          </ThemedView>
          <TextInput
            style={styles.inputModern}
            value={config.sessionTimeLimit.toString()}
            onChangeText={(text) => {
              const value = parseInt(text);
              if (!isNaN(value) && value > 0) {
                setConfig({ ...config, sessionTimeLimit: value });
              }
            }}
            keyboardType="number-pad"
            placeholder="60"
            placeholderTextColor="#999"
          />
        </ThemedView>
      </ThemedView>

      {/* Controls */}
      <ThemedView style={styles.controls}>
        <ThemedView 
          style={[
            styles.button, 
            styles.startButton,
            selectedPad === null && styles.disabledButton
          ]}
          onTouchEnd={handleStartGame}
        >
          <ThemedText style={styles.buttonText}>ต่อไป</ThemedText>
        </ThemedView>

        <ThemedView 
          style={[
            styles.button,
            styles.blinkButton,
            selectedPad === null && styles.disabledButton
          ]}
          onTouchEnd={selectedPad !== null ? handleBlinkPad : undefined}
        >
          <ThemedText style={styles.buttonText}>ทดสอบแผ่นกดที่เลือก</ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  selectionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  selectionHint: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  selectedText: {
    fontSize: 15,
    color: '#4e54a3',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },
  configCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: 'transparent',
  },
  configLabelContainer: {
    flex: 1,
    marginRight: 16,
    backgroundColor: 'transparent',
  },
  configItemLabel: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '600',
    marginBottom: 3,
  },
  configItemHint: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '400',
  },
  inputModern: {
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '600',
    textAlign: 'right',
    minWidth: 100,
  },
  toggleButtonModern: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 70,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
  },
  toggleButtonModernActive: {
    backgroundColor: '#4e54a3',
    borderColor: '#4e54a3',
  },
  toggleTextModern: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '700',
  },
  toggleTextModernActive: {
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4e54a3',
    marginBottom: 12,
    textAlign: 'center',
  },
  padsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    flexWrap: 'wrap',
    gap: 12,
  },
  pad: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    position: 'relative',
  },
  padOff: {
    backgroundColor: '#e9ecef',
    borderColor: '#ddd',
  },
  padSelected: {
    backgroundColor: '#cdcee7',
    borderColor: '#4e54a3',
  },
  padNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedLabel: {
    position: 'absolute',
    top: -2,
    right: 4,
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  controls: {
    gap: 12,
    backgroundColor: 'transparent',
    marginTop: 8,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#4e54a3',
  },
  blinkButton: {
    backgroundColor: '#6c757d',
  },
  disabledButton: {
    backgroundColor: '#e9ecef',
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default OnePadMode;