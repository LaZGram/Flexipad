import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TabHeaderProps {
  activeTab: 'manual' | 'qr';
  onTabChange: (tab: 'manual' | 'qr') => void;
}

const TabHeader: React.FC<TabHeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'manual' && styles.activeTab]}
        onPress={() => onTabChange('manual')}
      >
        <Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText]}>
          Manual Setup
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'qr' && styles.activeTab]}
        onPress={() => onTabChange('qr')}
      >
        <Text style={[styles.tabText, activeTab === 'qr' && styles.activeTabText]}>
          Scan QR
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#4e54a3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default TabHeader;