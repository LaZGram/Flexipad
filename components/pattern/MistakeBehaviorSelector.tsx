import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface MistakeBehaviorSelectorProps {
  value: 'restart' | 'continue';
  onChange: (value: 'restart' | 'continue') => void;
}

const MistakeBehaviorSelector: React.FC<MistakeBehaviorSelectorProps> = ({ value, onChange }) => {
  const behaviors = [
    {
      key: 'restart' as const,
      title: 'เริ่มใหม่ตั้งแต่ต้น',
      icon: 'replay',
    },
    {
      key: 'continue' as const,
      title: 'เล่นต่อจนกว่าจะถูก',
      icon: 'repeat',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>เมื่อทำผิดหรือหมดเวลา</Text>
      
      <View style={styles.optionsContainer}>
        {behaviors.map((behavior) => (
          <TouchableOpacity
            key={behavior.key}
            style={[
              styles.option,
              value === behavior.key && styles.selectedOption
            ]}
            onPress={() => onChange(behavior.key)}
          >
            <View style={styles.optionHeader}>
              <View style={styles.leftSection}>
                <View style={[
                  styles.iconContainer,
                  value === behavior.key && styles.selectedIconContainer
                ]}>
                  <MaterialIcons
                    name={behavior.icon as any}
                    size={20}
                    color={value === behavior.key ? '#fff' : '#4e54a3'}
                  />
                </View>
                <Text style={[
                  styles.title,
                  value === behavior.key && styles.selectedTitle
                ]}>
                  {behavior.title}
                </Text>
              </View>
              <View style={styles.radioContainer}>
                <View style={[
                  styles.radioOuter,
                  value === behavior.key && styles.selectedRadioOuter
                ]}>
                  {value === behavior.key && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  optionsContainer: {
    gap: 10,
  },
  option: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0', 
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },
  selectedOption: {
    borderColor: '#4e54a3',
    backgroundColor: '#f8fbff',
  },

  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fbff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4e54a3',
  },
  selectedIconContainer: {
    backgroundColor: '#4e54a3',
    borderColor: '#0056b3',
  },
  radioContainer: {
    padding: 2,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioOuter: {
    borderColor: '#4e54a3',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4e54a3',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedTitle: {
    color: '#4e54a3',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  selectedDescription: {
    color: '#0056b3',
  },
});

export default MistakeBehaviorSelector;