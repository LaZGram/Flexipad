import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PatternModeConfig, PatternModeState } from './types';
import { validatePatternModeConfig } from './validator';
import { ApiService, PatternTemplate } from '@/services/api.service';

interface PatternQRScanTabProps {
  onConfigImport: (config: Partial<PatternModeState>) => void;
  onStartGame: () => void;
}

const PatternQRScanTab: React.FC<PatternQRScanTabProps> = ({ onConfigImport, onStartGame }) => {
  const [showScanner, setShowScanner] = useState(false);
  const [lastImported, setLastImported] = useState<PatternModeConfig | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<PatternTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PatternTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      setTemplatesError(null);
      const data = await ApiService.getPatternTemplates();
      console.log('📦 Templates fetched from API:', JSON.stringify(data, null, 2));
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplatesError('Failed to load templates. Using offline mode.');
      // Fallback to local imports if API fails
      const sampleBeginner = require('../../pattern-level-based-beginner.json');
      const sampleExample = require('../../pattern-level-based-example.json');
      const sampleAdvanced = require('../../pattern-level-based-advanced.json');
      
      const fallbackTemplates = [
        {
          id: 'beginner',
          name: 'Beginner',
          description: '10 levels • Easy • Gentle progression',
          levels: 10,
          config: sampleBeginner,
        },
        {
          id: 'medium',
          name: 'Medium',
          description: '5 levels • Medium • Progressive',
          levels: 5,
          config: sampleExample,
        },
        {
          id: 'advanced',
          name: 'Advanced',
          description: '8 levels • Hard • Expert training',
          levels: 8,
          config: sampleAdvanced,
        },
      ];
      console.log('📦 Using fallback templates:', JSON.stringify(fallbackTemplates, null, 2));
      setTemplates(fallbackTemplates);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleConfigImport = (config: PatternModeConfig) => {
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
      repeatCount: config.gameSettings.repeatCount,
      // Include levelPatterns if provided
      levelPatterns: config.levelPatterns,
    };

    onConfigImport(stateConfig);
    setLastImported(config);
  };

  const handleTemplateClick = (template: PatternTemplate) => {
    console.log('🔍 Template clicked:', JSON.stringify(template, null, 2));
    setSelectedTemplate(template);
    setShowDetailsModal(true);
  };

  const handleSelectTemplate = () => {
    if (!selectedTemplate) return;

    const validation = validatePatternModeConfig(selectedTemplate.config);

    if (!validation.isValid || !validation.config) {
      Alert.alert(
        'Invalid Template',
        validation.error || 'Template is invalid.',
        [{ text: 'OK' }]
      );
      return;
    }

    handleConfigImport(validation.config);
    // Use the template id from the selected template object
    const templateId = selectedTemplate.id;
    setSelectedTemplateId(templateId);
    setShowDetailsModal(false);
    console.log('✅ Template selected:', templateId, 'selectedTemplate:', selectedTemplate);
  };

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

      handleConfigImport(validation.config);
      setShowScanner(false);

      Alert.alert(
        'Configuration Imported',
        `Successfully imported: ${validation.config.metadata.description || 'Unnamed configuration'}`,
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
    <ScrollView style={styles.container}>
      {loadingTemplates ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA500" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <View>
          {/* Templates Grid */}
          <View style={styles.templatesGrid}>
            {templates.map((template) => {
              const isSelected = selectedTemplateId === template.id;
              return (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateCard,
                    isSelected && styles.templateCardSelected,
                  ]}
                  onPress={() => handleTemplateClick(template)}
                  activeOpacity={0.7}
                >
                  <View style={styles.templateHeader}>
                    <View style={styles.templateTitleRow}>
                      <Text style={[styles.templateName, isSelected && styles.templateNameSelected]}>
                        {template.name}
                      </Text>
                      {isSelected && (
                        <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                      )}
                    </View>
                    <Text style={styles.templateLevels}>{template.levels} levels</Text>
                  </View>
                  <Text style={styles.templateDescription}>{template.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Start Button - Shows when template is selected */}
          {selectedTemplateId && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={onStartGame}
              activeOpacity={0.8}
            >
              <MaterialIcons name="play-arrow" size={24} color="#fff" />
              <Text style={styles.startButtonText}>Start Game</Text>
            </TouchableOpacity>
          )}

          {templatesError && (
            <View style={styles.errorBanner}>
              <MaterialIcons name="info-outline" size={16} color="#FF9800" />
              <Text style={styles.errorText}>Using offline templates</Text>
            </View>
          )}
        </View>
      )}

      {/* Template Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedTemplate?.name}</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{selectedTemplate?.description}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Configuration</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Total Levels:</Text>
                  <Text style={styles.detailText}>{selectedTemplate?.levels}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Mistake Behavior:</Text>
                  <Text style={styles.detailText}>
                    {selectedTemplate?.config.mistakeBehavior === 'restart' ? 'เริ่มใหม่ตั้งแต่ต้น' : 'เล่นต่อจนกว่าจะถูก'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Step Timing:</Text>
                  <Text style={styles.detailText}>{selectedTemplate?.config.patternSettings.stepTimingMs} ms</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Interval Timing:</Text>
                  <Text style={styles.detailText}>{selectedTemplate?.config.patternSettings.showPatternDurationMs} ms</Text>
                </View>
              </View>

              {selectedTemplate?.config.levelPatterns && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Level Patterns</Text>
                  {selectedTemplate.config.levelPatterns.map((level: any, index: number) => (
                    <View key={index} style={styles.levelRow}>
                      <Text style={styles.levelNumber}>Level {level.level}</Text>
                      <Text style={styles.levelPattern}>
                        Pattern: [{level.pattern.map((p: number) => p + 1).join(', ')}]
                      </Text>
                      <Text style={styles.levelDescription}>{level.description}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDetailsModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={handleSelectTemplate}
              >
                <MaterialIcons name="check" size={20} color="#fff" />
                <Text style={styles.selectButtonText}>Select This Template</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  templatesGrid: {
    padding: 16,
    gap: 12,
  },
  templateCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8f4',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  templateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  templateNameSelected: {
    color: '#4CAF50',
  },
  templateLevels: {
    fontSize: 13,
    color: '#999',
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  qrButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8E1',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#F57C00',
    marginLeft: 6,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4e54a3',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailKey: {
    fontSize: 14,
    color: '#666',
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  levelRow: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  levelNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  levelPattern: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  levelDescription: {
    fontSize: 12,
    color: '#999',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  selectButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default PatternQRScanTab;