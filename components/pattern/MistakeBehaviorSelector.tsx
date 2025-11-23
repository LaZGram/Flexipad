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
      title: 'Restart from Beginning',
      description: 'When player makes a mistake or times out, restart from level 1',
      icon: 'replay',
    },
    {
      key: 'continue' as const,
      title: 'Continue Until Correct',
      description: 'Player keeps trying current step until they get it right',
      icon: 'repeat',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Behavior on Mistake/Timeout</Text>
      <Text style={styles.description}>
        What happens when player hits wrong pad or doesn't hit in time
      </Text>
      
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
              <View style={[
                styles.iconContainer,
                value === behavior.key && styles.selectedIconContainer
              ]}>
                <MaterialIcons
                  name={behavior.icon as any}
                  size={20}
                  color={value === behavior.key ? '#fff' : '#007bff'}
                />
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
            
            <View style={styles.textContainer}>
              <Text style={[
                styles.title,
                value === behavior.key && styles.selectedTitle
              ]}>
                {behavior.title}
              </Text>
              <Text style={[
                styles.optionDescription,
                value === behavior.key && styles.selectedDescription
              ]}>
                {behavior.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fff',
  },
  selectedOption: {
    borderColor: '#007bff',
    backgroundColor: '#f8fbff',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fbff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#007bff',
  },
  selectedIconContainer: {
    backgroundColor: '#007bff',
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
    borderColor: '#007bff',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007bff',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedTitle: {
    color: '#007bff',
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