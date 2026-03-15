import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import tw from 'twrnc';
import { ThemedText } from '@/components/ThemedText';
import { getApiUrl, API_CONFIG } from '@/config/api.config';

interface GameSession {
  id: string;
  playerName: string;
  date: string;
  lightOutMode: string;
  durationMode: string;
  duration: number;
  hits: number;
  misses: number;
  accuracy: number;
  averageReactionTime: number;
  reactionTimes?: number[];
  cycleTimes?: number[];
  delayTime?: number;
  timeout?: number;
  hitCount?: number;
  durationTimeout?: number;
  hitDuration?: number;
}

export default function HitModeHistoryScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<GameSession | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.HIT_MODE_SESSIONS), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform backend data to match frontend interface
      const transformedSessions = data.map((session: any) => ({
        id: session._id,
        playerName: session.playerName || 'Unknown',
        date: session.sessionDate,
        lightOutMode: session.lightOutMode,
        durationMode: session.durationMode,
        duration: session.totalTime,
        hits: session.userHitCount,
        misses: session.missCount,
        accuracy: session.hitPercentage || ((session.userHitCount / (session.userHitCount + session.missCount)) * 100),
        averageReactionTime: session.averageReactionTime,
        reactionTimes: session.reactionTimes || [],
        cycleTimes: session.cycleTimes || [],
        delayTime: session.delayTime,
        timeout: session.timeout,
        hitCount: session.hitCount,
        durationTimeout: session.durationTimeout,
        hitDuration: session.hitDuration,
      }));

      setSessions(transformedSessions.sort((a: GameSession, b: GameSession) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
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
    const secs = Math.round(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/Mode')} style={tw`p-2`}>
          <MaterialIcons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity onPress={loadHistory} style={tw`p-2`}>
          <MaterialIcons name="refresh" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#4e54a3" />
            <ThemedText style={styles.loadingText}>กำลังโหลด...</ThemedText>
          </View>
        ) : sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="history" size={80} color="#ccc" />
            <Text style={styles.emptyText}>ยังไม่มีประวัติการเล่น</Text>
            <Text style={styles.emptySubText}>เล่นเกมโหมดฮิตเพื่อดูสถิติของคุณที่นี่</Text>
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
                    {sessions.reduce((sum, s) => sum + s.hits, 0)}
                  </Text>
                  <Text style={styles.summaryLabel}>ฮิตทั้งหมด</Text>
                </View>
              </View>
            </View>

            {/* Session List */}
            {sessions.map((session, index) => (
              <TouchableOpacity 
                key={session.id} 
                style={styles.sessionCard}
                onPress={() => setSelectedSession(session)}
                activeOpacity={0.7}
              >
                <View style={styles.sessionHeader}>
                  <View>
                    <Text style={styles.sessionNumber}>เกมที่ #{sessions.length - index}</Text>
                    <Text style={styles.playerName}>👤 {session.playerName}</Text>
                  </View>
                  <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
                </View>

                <View style={styles.sessionModes}>
                  <View style={styles.modeBadge}>
                    <Text style={styles.modeLabel}>ดับไฟ:</Text>
                    <Text style={styles.modeValue}>{session.lightOutMode}</Text>
                  </View>
                  <View style={styles.modeBadge}>
                    <Text style={styles.modeLabel}>ระยะเวลา:</Text>
                    <Text style={styles.modeValue}>{session.durationMode}</Text>
                  </View>
                </View>

                <View style={styles.sessionStats}>
                  <View style={styles.statRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>ระยะเวลา</Text>
                      <Text style={styles.statValue}>{session.duration.toFixed(2)}s</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>ปฏิกิริยาเฉลี่ย</Text>
                      <Text style={styles.statValue}>
                        {session.averageReactionTime ? `${session.averageReactionTime.toFixed(2)}s` : 'N/A'}
                      </Text>
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
                        {Math.round(session.accuracy)}%
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={selectedSession !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSession(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>รายละเอียดเซสชัน</Text>
              <TouchableOpacity onPress={() => setSelectedSession(null)}>
                <MaterialIcons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedSession && (
                <>
                  {/* Game Configuration */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>การตั้งค่าเกม</Text>
                    <View style={styles.configCard}>
                      <Text style={styles.configSubtitle}>ผู้เล่น</Text>
                      <Text style={styles.configValue}>👤 {selectedSession.playerName}</Text>
                    </View>
                    <View style={styles.configCard}>
                      <Text style={styles.configSubtitle}>วันที่เซสชัน</Text>
                      <Text style={styles.configValue}>{formatDate(selectedSession.date)}</Text>
                    </View>
                    
                    <View style={styles.configCard}>
                      <Text style={styles.configSubtitle}>การตั้งค่าดับไฟ</Text>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>โหมด:</Text>
                        <Text style={styles.detailValue}>{selectedSession.lightOutMode}</Text>
                      </View>
                      {selectedSession.timeout ? (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>หมดเวลา:</Text>
                          <Text style={styles.detailValue}>{selectedSession.timeout}s</Text>
                        </View>
                      ) : null}
                      {selectedSession.hitCount ? (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>เป้าหมายจำนวนฮิต:</Text>
                          <Text style={styles.detailValue}>{selectedSession.hitCount} ครั้ง</Text>
                        </View>
                      ) : null}
                    </View>
                    
                    <View style={styles.configCard}>
                      <Text style={styles.configSubtitle}>การตั้งค่าระยะเวลา</Text>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>โหมด:</Text>
                        <Text style={styles.detailValue}>{selectedSession.durationMode}</Text>
                      </View>
                      {selectedSession.durationTimeout ? (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>หมดเวลาระยะเวลา:</Text>
                          <Text style={styles.detailValue}>{Math.floor(selectedSession.durationTimeout / 60)}m {selectedSession.durationTimeout % 60}s</Text>
                        </View>
                      ) : null}
                      {selectedSession.hitDuration ? (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>เป้าหมายระยะเวลาฮิต:</Text>
                          <Text style={styles.detailValue}>{selectedSession.hitDuration} ครั้ง</Text>
                        </View>
                      ) : null}
                    </View>
                    
                    {selectedSession.delayTime ? (
                      <View style={styles.configCard}>
                        <Text style={styles.configSubtitle}>การจับเวลา</Text>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>เวลาหน่วงไฟ:</Text>
                          <Text style={styles.detailValue}>{selectedSession.delayTime.toFixed(2)}s</Text>
                        </View>
                      </View>
                    ) : null}
                  </View>

                  {/* Performance Summary */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>สรุปผลการเล่น</Text>
                    <View style={styles.summaryStats}>
                      <View style={styles.summaryStatItem}>
                        <Text style={styles.summaryStatLabel}>เวลาทั้งหมด</Text>
                        <Text style={styles.summaryStatValue}>{selectedSession.duration.toFixed(2)}s</Text>
                      </View>
                      <View style={styles.summaryStatItem}>
                        <Text style={styles.summaryStatLabel}>ฮิต</Text>
                        <Text style={[styles.summaryStatValue, styles.hitText]}>{selectedSession.hits}</Text>
                      </View>
                      <View style={styles.summaryStatItem}>
                        <Text style={styles.summaryStatLabel}>พลาด</Text>
                        <Text style={[styles.summaryStatValue, styles.missText]}>{selectedSession.misses}</Text>
                      </View>
                      <View style={styles.summaryStatItem}>
                        <Text style={styles.summaryStatLabel}>ความแม่นยำ</Text>
                        <Text style={[styles.summaryStatValue, styles.accuracyText]}>{Math.round(selectedSession.accuracy)}%</Text>
                      </View>
                      <View style={styles.summaryStatItem}>
                        <Text style={styles.summaryStatLabel}>ปฏิกิริยาเฉลี่ย</Text>
                        <Text style={styles.summaryStatValue}>
                          {selectedSession.averageReactionTime ? `${selectedSession.averageReactionTime.toFixed(3)}s` : 'N/A'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Individual Press Times */}
                  {selectedSession.reactionTimes && selectedSession.reactionTimes.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>เวลาการกดแต่ละครั้ง</Text>
                      <Text style={styles.detailSubtitle}>
                        เวลาปฏิกิริยาการกดแต่ละครั้ง ({selectedSession.reactionTimes.filter((t: number) => t >= 0).length} ฮิต, {selectedSession.reactionTimes.filter((t: number) => t < 0).length} พลาด)
                      </Text>
                      {selectedSession.reactionTimes.map((time: number, index: number) => {
                        if (time < 0) {
                          // Display miss with timeout duration
                          return (
                            <View key={index} style={styles.timeItem}>
                              <View style={styles.timeItemHeader}>
                                <Text style={styles.timeItemNumber}>กดครั้งที่ #{index + 1}</Text>
                                <Text style={[styles.timeItemValue, { color: '#e63946' }]}>พลาด</Text>
                              </View>
                              <View style={styles.timeBar}>
                                <View 
                                  style={[
                                    styles.timeBarFill,
                                    { 
                                      width: '100%',
                                      backgroundColor: '#e63946'
                                    }
                                  ]} 
                                />
                              </View>
                            </View>
                          );
                        }
                        
                        const validTimes = selectedSession.reactionTimes!.filter((t: number) => t >= 0);
                        const maxTime = Math.max(...validTimes);
                        const widthPercent = Math.min((time / maxTime) * 100, 100);
                        const avgTime = validTimes.reduce((sum: number, t: number) => sum + t, 0) / validTimes.length;
                        const isSlower = time >= avgTime;
                        
                        return (
                          <View key={index} style={styles.timeItem}>
                            <View style={styles.timeItemHeader}>
                              <Text style={styles.timeItemNumber}>การกดครั้งที่ {index + 1}</Text>
                              <Text style={styles.timeItemValue}>{time.toFixed(3)}s</Text>
                            </View>
                            <View style={styles.timeBar}>
                              <View 
                                style={[
                                  styles.timeBarFill,
                                  { 
                                    width: `${widthPercent}%`,
                                    backgroundColor: isSlower ? '#e63946' : '#2b8a3e'
                                  }
                                ]} 
                              />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Cycle Times */}
                  {/* {selectedSession.cycleTimes && selectedSession.cycleTimes.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>🔄 Full Cycle Times</Text>
                      <Text style={styles.detailSubtitle}>
                        Complete time from light on to button press ({selectedSession.cycleTimes.length} cycles)
                      </Text>
                      <Text style={styles.detailSubtitle}>Includes: Delay Time + Reaction Time</Text>
                      {selectedSession.cycleTimes.map((time, index) => {
                        const maxTime = Math.max(...selectedSession.cycleTimes!);
                        const widthPercent = Math.min((time / maxTime) * 100, 100);
                        
                        return (
                          <View key={index} style={styles.timeItem}>
                            <View style={styles.timeItemHeader}>
                              <Text style={styles.timeItemNumber}>กดครั้งที่ #{index + 1}</Text>
                              <Text style={styles.timeItemValue}>{time.toFixed(3)}s</Text>
                            </View>
                            <View style={styles.timeBar}>
                              <View 
                                style={[
                                  styles.timeBarFill,
                                  { 
                                    width: `${widthPercent}%`,
                                    backgroundColor: '#4e54a3'
                                  }
                                ]} 
                              />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )} */}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#4e54a3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 10,
    marginTop: 32
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 32,
    marginVertical: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
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
  playerName: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
    fontWeight: '500',
  },
  sessionDate: {
    fontSize: 12,
    color: '#666666',
  },
  sessionModes: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  modeBadge: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 4,
  },
  modeLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  modeValue: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    width: '90%',
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  modalContent: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4e54a3',
    marginBottom: 12,
  },
  detailSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  configCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4e54a3',
  },
  configSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  configValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  summaryStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryStatItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  timeItem: {
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  timeItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeItemNumber: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeItemValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '700',
  },
  timeBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  timeBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
