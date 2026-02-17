import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Modal } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import tw from 'twrnc';
import { getApiUrl, API_CONFIG } from '@/config/api.config';

interface PressRecord {
  pressNumber: number;
  color: 'red' | 'green' | 'off';
  result: 'hit' | 'miss';
  reactionTime: number;
  timestamp: number;
}

interface GameSession {
  id: string;
  date: string;
  duration: number;
  hits: number;
  misses: number;
  accuracy: number;
  averageReactionTime: number;
  padsUsed: number;
  pressRecords?: PressRecord[];
  pressTimes?: number[];
  config?: {
    redProbability?: number;
    redDisplayDuration?: number;
    greenTimeout?: number;
    enableGreenTimeout?: boolean;
    sessionTimeLimit?: number;
  };
  // Additional fields from backend
  padId?: number;
  sessionStartTime?: number;
  sessionDuration?: number;
  totalRounds?: number;
  gameConfig?: {
    redProbability?: number;
    redDisplayDuration?: number;
    greenTimeout?: number;
    enableGreenTimeout?: boolean;
    sessionTimeLimit?: number;
  };
  createdAt?: string;
}

const ForbiddenColorHistoryScreen = () => {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<GameSession | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      console.log('📡 Fetching forbidden color history from backend...');
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ONE_PAD_MODE_SESSIONS));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Loaded sessions:', data.length);
      
      // Transform backend data to match our interface
      const transformedSessions = data.map((session: any) => ({
        id: session._id || session.id,
        date: session.createdAt || new Date().toISOString(),
        duration: session.sessionDuration || session.duration || 0,
        hits: session.hitCount || session.hits || 0,
        misses: session.missCount || session.misses || 0,
        accuracy: session.accuracy || 0,
        averageReactionTime: session.averageReactionTime || 0,
        padsUsed: 1, // One pad mode
        pressRecords: session.pressRecords || [],
        pressTimes: session.pressTimes || [],
        config: session.gameConfig || session.config || {},
      }));
      
      setSessions(transformedSessions.sort((a: GameSession, b: GameSession) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
    } catch (error) {
      console.error('❌ Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    // Note: This only clears the local display, not the backend database
    setSessions([]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const handleSessionPress = (session: GameSession) => {
    setSelectedSession(session);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedSession(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/ForbiddenColorMode')}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={32} color="#fff" />
        </TouchableOpacity>
        
        <Text
          style={[
            tw`text-center font-bold text-white`,
            styles.headerTitle,
          ]}
        >
          History
        </Text>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={loadHistory}
        >
          <MaterialIcons name="refresh" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>กำลังโหลด...</ThemedText>
          </View>
        ) : sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              ยังไม่มีประวัติเกม เล่นเกมเพื่อดูสถิติของคุณ!
            </ThemedText>
          </View>
        ) : (
          <>
            {/* Summary Stats */}
            <View style={styles.summaryCard}>
              <ThemedText style={styles.summaryTitle}>สถิติรวม</ThemedText>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{sessions.length}</Text>
                  <Text style={styles.summaryLabel}>เกม</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {Math.round(
                      sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length
                    )}%
                  </Text>
                  <Text style={styles.summaryLabel}>ความแม่นยำเฉลี่ย</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {Math.round(
                      sessions.reduce((sum, s) => sum + s.averageReactionTime, 0) / sessions.length
                    )}ms
                  </Text>
                  <Text style={styles.summaryLabel}>ปฏิกิริยาเฉลี่ย</Text>
                </View>
              </View>
            </View>

            {/* Session List */}
            {sessions.map((session, index) => (
              <TouchableOpacity 
                key={session.id} 
                style={styles.sessionCard}
                onPress={() => handleSessionPress(session)}
                activeOpacity={0.7}
              >
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionNumber}>เกมที่ #{sessions.length - index}</Text>
                  <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
                </View>

                <View style={styles.sessionStats}>
                  <View style={styles.statRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>ระยะเวลา</Text>
                      <Text style={styles.statValue}>{formatDuration(session.duration)}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>แผ่นกด</Text>
                      <Text style={styles.statValue}>{session.padsUsed}</Text>
                    </View>
                  </View>

                  <View style={styles.statRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>ฮิต</Text>
                      <Text style={[styles.statValue, styles.hitText]}>{session.hits}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>พลาด</Text>
                      <Text style={[styles.statValue, styles.missText]}>{session.misses}</Text>
                    </View>
                  </View>

                  <View style={styles.statRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>ความแม่นยำ</Text>
                      <Text style={[styles.statValue, styles.accuracyText]}>
                        {session.accuracy}%
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>ปฏิกิริยาเฉลี่ย</Text>
                      <Text style={styles.statValue}>{session.averageReactionTime}ms</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {/* Clear History Button */}
            {/* <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearHistory}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>Clear History</Text>
            </TouchableOpacity> */}
          </>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDetailModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeDetailModal}
          />
          <View style={styles.detailBox}>
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
            >
              {selectedSession && (
                <>
                  <Text style={styles.detailTitle}>รายละเอียดการฝึก</Text>
                  
                  {/* Game Configuration */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>การตั้งค่าเกม</Text>
                    <View style={styles.configCard}>
                      <View style={styles.configRow}>
                        <Text style={styles.configLabel}>แผ่นกดที่ใช้:</Text>
                        <Text style={styles.configValue}>{selectedSession.padsUsed}</Text>
                      </View>
                      <View style={styles.configRow}>
                        <Text style={styles.configLabel}>ระยะเวลาเซสชัน:</Text>
                        <Text style={styles.configValue}>{selectedSession.duration}s</Text>
                      </View>
                      {selectedSession.config && (
                        <>
                          {selectedSession.config.redProbability !== undefined && (
                            <View style={styles.configRow}>
                              <Text style={styles.configLabel}>โอกาสสีแดง:</Text>
                              <Text style={styles.configValue}>{(selectedSession.config.redProbability * 100).toFixed(0)}%</Text>
                            </View>
                          )}
                          {selectedSession.config.redDisplayDuration !== undefined && (
                            <View style={styles.configRow}>
                              <Text style={styles.configLabel}>ระยะเวลาแสดงสีแดง:</Text>
                              <Text style={styles.configValue}>{selectedSession.config.redDisplayDuration}ms</Text>
                            </View>
                          )}
                          {selectedSession.config.greenTimeout !== undefined && (
                            <View style={styles.configRow}>
                              <Text style={styles.configLabel}>หมดเวลาสีเขียว:</Text>
                              <Text style={styles.configValue}>{selectedSession.config.greenTimeout}ms</Text>
                            </View>
                          )}
                        </>
                      )}
                    </View>
                  </View>

                  {/* Performance Summary */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>สรุปผลงาน</Text>
                    <View style={styles.summaryStats}>
                      <View style={styles.summaryStatItem}>
                        <Text style={[styles.summaryStatValue, { color: '#2b8a3e' }]}>{selectedSession.hits}</Text>
                        <Text style={styles.summaryStatLabel}>ฮิต</Text>
                      </View>
                      <View style={styles.summaryStatItem}>
                        <Text style={[styles.summaryStatValue, { color: '#e63946' }]}>{selectedSession.misses}</Text>
                        <Text style={styles.summaryStatLabel}>พลาด</Text>
                      </View>
                      <View style={styles.summaryStatItem}>
                        <Text style={[styles.summaryStatValue, { color: '#4e54a3' }]}>{selectedSession.accuracy.toFixed(1)}%</Text>
                        <Text style={styles.summaryStatLabel}>ความแม่นยำ</Text>
                      </View>
                      <View style={styles.summaryStatItem}>
                        <Text style={styles.summaryStatValue}>{selectedSession.averageReactionTime}ms</Text>
                        <Text style={styles.summaryStatLabel}>เวลาเฉลี่ย</Text>
                      </View>
                    </View>
                  </View>

                  {/* Individual Press Times */}
                  {selectedSession.pressRecords && selectedSession.pressRecords.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>เวลากดแต่ละครั้ง</Text>
                      <View style={styles.pressTimesContainer}>
                        {selectedSession.pressRecords.map((record, index) => (
                          <View 
                            key={index} 
                            style={[
                              styles.pressTimeRow,
                              record.result === 'miss' && styles.missRow
                            ]}
                          >
                            <Text style={styles.pressNumber}>กดครั้งที่ #{record.pressNumber}</Text>
                            <View style={styles.pressDetails}>
                              <Text style={[
                                styles.pressColor,
                                record.color === 'red' ? styles.redColor : styles.greenColor
                              ]}>
                                {record.color === 'red' ? '🔴' : '🟢'} {record.color.toUpperCase()}
                              </Text>
                              <Text style={[
                                styles.pressResult,
                                record.result === 'hit' ? styles.hitResult : styles.missResult
                              ]}>
                                {record.result === 'hit' ? '✓' : '✗'}
                              </Text>
                              <Text style={styles.pressTime}>
                                {record.reactionTime > 0 ? `${record.reactionTime}ms` : 'Timeout'}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Fallback: Show press times if pressRecords not available */}
                  {(!selectedSession.pressRecords || selectedSession.pressRecords.length === 0) && 
                   selectedSession.pressTimes && selectedSession.pressTimes.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>⏱️ เวลาปฏิกิริยา</Text>
                      <View style={styles.pressTimesContainer}>
                        {selectedSession.pressTimes.map((time, index) => (
                          <View key={index} style={styles.pressTimeRow}>
                            <Text style={styles.pressNumber}>กดครั้งที่ #{index + 1}</Text>
                            <Text style={styles.pressTime}>{time}ms</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={closeDetailModal}
                  >
                    <Text style={styles.closeButtonText}>ปิด</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4e54a3',
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 10,
    marginTop: 32
  },
  headerTitle: {
    fontSize: 28,
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  refreshButton: {
    padding: 4,
    width: 40,
  },
  scrollContent: {
    padding: 16,
    alignItems: 'stretch',
    paddingBottom: 10,
  },
  emptyContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 32,
    marginVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#4e54a3',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#e0e0e0',
    textAlign: 'center',
  },
  sessionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4e54a3',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sessionNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4e54a3',
  },
  sessionDate: {
    fontSize: 12,
    color: '#666666',
  },
  sessionStats: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  hitText: {
    color: '#2b8a3e',
  },
  missText: {
    color: '#e63946',
  },
  accuracyText: {
    color: '#4e54a3',
  },
  clearButton: {
    backgroundColor: '#e63946',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  detailBox: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
  },
  scrollView: {
    width: '100%',
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4e54a3',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
  },
  configCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  configLabel: {
    fontSize: 14,
    color: '#666666',
  },
  configValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  summaryStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },

  summaryStatItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#666666',
  },
  pressTimesContainer: {
    gap: 8,
  },
  pressTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4e54a3',
  },
  missRow: {
    backgroundColor: '#fff5f5',
    borderLeftColor: '#e63946',
  },
  pressNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    minWidth: 55,
  },
  pressDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pressColor: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 65,
  },
  redColor: {
    color: '#e63946',
  },
  greenColor: {
    color: '#2b8a3e',
  },
  pressResult: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 20,
  },
  hitResult: {
    color: '#2b8a3e',
  },
  missResult: {
    color: '#e63946',
  },
  pressTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4e54a3',
    minWidth: 60,
    textAlign: 'right',
  },
  closeButton: {
    backgroundColor: '#4e54a3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ForbiddenColorHistoryScreen;
