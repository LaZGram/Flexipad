import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface PadIncrementSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

const PadIncrementSelector: React.FC<PadIncrementSelectorProps> = ({ value, onChange }) => {
  const incrementOptions = [1, 2, 3, 4, 5];

  const handleDecrease = () => {
    if (value > 1) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (value < 5) {
      onChange(value + 1);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>จำนวน Pad ที่เพิ่มขึ้นต่อเลเวล</Text>
      
      <View style={styles.selectorContainer}>
        <TouchableOpacity
          style={[styles.button, value <= 1 && styles.disabledButton]}
          onPress={handleDecrease}
          disabled={value <= 1}
        >
          <MaterialIcons 
            name="remove" 
            size={20} 
            color={value <= 1 ? '#ccc' : '#4e54a3'} 
          />
        </TouchableOpacity>
        
        <View style={styles.valueContainer}>
          <Text style={styles.value}>+{value}</Text>
          <Text style={styles.unit}>ปุ่ม{value !== 1 ? 's' : ''}</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.button, value >= 5 && styles.disabledButton]}
          onPress={handleIncrease}
          disabled={value >= 5}
        >
          <MaterialIcons 
            name="add" 
            size={20} 
            color={value >= 5 ? '#ccc' : '#4e54a3'} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.optionsContainer}>
        {incrementOptions.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionButton,
              value === option && styles.selectedOption
            ]}
            onPress={() => onChange(option)}
          >
            <Text style={[
              styles.optionText,
              value === option && styles.selectedOptionText
            ]}>
              +{option}
            </Text>
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
  selectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  valueContainer: {
    alignItems: 'center',
    marginHorizontal: 32,
    minWidth: 80,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4e54a3',
  },
  unit: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#4e54a3',
    borderColor: '#0056b3',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default PadIncrementSelector;