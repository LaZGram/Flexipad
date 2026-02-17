import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Alert, View, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ApiService, PatternSessionRecord } from '@/services/api.service';
import { MaterialIcons } from '@expo/vector-icons';
import tw from "twrnc";

const PatternHistoryScreen: React.FC = () => {
  const router = useRouter();
  const [sessions, setSessions] = useState<PatternSessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'continue' | 'restart'>('all');

  const fetchSessions = useCallback(async (isRefresh = false, mode: 'all' | 'continue' | 'restart' = 'all') => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = mode === 'all' 
        ? await ApiService.getPatternSessions()
        : await ApiService.getPatternSessions(mode);
      
      // Sort by date descending (newest first)
      const sorted = data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setSessions(sorted);
    } catch (err) {
      console.error('Error fetching pattern sessions:', err);
      setError('โหลดประวัติไม่สำเร็จ ตรวจสอบการเชื่อมต่อเซิร์ฟเวอร์');
      
      if (!isRefresh) {
        Alert.alert(
          'ข้อผิดพลาดการเชื่อมต่อ',
          'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ ตรวจสอบว่าเซิร์ฟเวอร์กำลังทำงาน',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions(false, filterMode);
  }, [filterMode]);

  const handleRefresh = useCallback(() => {
    fetchSessions(true, filterMode);
  }, [fetchSessions, filterMode]);

  const handleCardPress = useCallback((sessionId: string) => {
    router.push({
      pathname: '/(tabs)/history/pattern-session-detail',
      params: { sessionId },
    });
  }, [router]);

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4e54a3" />
          <ThemedText style={styles.loadingText}>กำลังโหลดประวัติ...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centerContent}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchSessions()}>
            <ThemedText style={styles.retryButtonText}>ลองใหม่</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      {/* <View
        style={[
          tw`flex-row items-center justify-center my-4 mt-8 shadow-lg`,
          {
            backgroundColor: "#4e54a3",
            marginHorizontal: "-10%",
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/PatternMode')}
          style={tw`absolute left-4 ml-6 p-2`}
        >
          <MaterialIcons name="arrow-back" size={32} color="#fff" />
        </TouchableOpacity>
        <Text
          style={[
            tw`text-center font-bold text-white`,
            {
              fontSize: 36,
            },
          ]}
        >
          History
        </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/PatternMode')} style={tw`p-2`}>
          <MaterialIcons name="refresh" size={28} color="#fff" />
        </TouchableOpacity>
      </View> */}
      {/* --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/PatternMode')} style={tw`p-2`}>
          <MaterialIcons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity onPress={handleRefresh} style={tw`p-2`}>
          <MaterialIcons name="refresh" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      {/* --- */}
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterMode === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterMode('all')}
        >
          <ThemedText style={[styles.filterButtonText, filterMode === 'all' && styles.filterButtonTextActive]}>
            ทั้งหมด
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterMode === 'continue' && styles.filterButtonActive]}
          onPress={() => setFilterMode('continue')}
        >
          <ThemedText style={[styles.filterButtonText, filterMode === 'continue' && styles.filterButtonTextActive]}>
            โหมดเล่นต่อ
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterMode === 'restart' && styles.filterButtonActive]}
          onPress={() => setFilterMode('restart')}
        >
          <ThemedText style={[styles.filterButtonText, filterMode === 'restart' && styles.filterButtonTextActive]}>
            โหมดเริ่มใหม่
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4e54a3']}
            tintColor="#4e54a3"
          />
        }
      >
        {sessions.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <MaterialIcons name="history" size={64} color="#ccc" />
            <ThemedText style={styles.emptyText}>ยังไม่มีเซสชันโหมดจำรูปแบบ</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              เล่นเกมให้จบเพื่อดูประวัติของคุณที่นี่
            </ThemedText>
          </ThemedView>
        ) : (
          sessions.map((session) => (
            <TouchableOpacity
              key={session._id}
              style={styles.card}
              onPress={() => handleCardPress(session._id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.levelBadge}>
                  <MaterialIcons name="emoji-events" size={20} color="#FFA500" />
                  <ThemedText style={styles.levelText}>ระดับ {session.finalLevel}</ThemedText>
                </View>
                <View style={[
                  styles.modeBadge,
                  session.gameMode === 'restart' ? styles.restartBadge : styles.continueBadge
                ]}>
                  <ThemedText style={styles.modeText}>
                    {session.gameMode === 'restart' ? 'เริ่มใหม่' : 'เล่นต่อ'}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.statRow}>
                  <MaterialIcons name="access-time" size={16} color="#666" />
                  <ThemedText style={styles.statLabel}>ระยะเวลา:</ThemedText>
                  <ThemedText style={styles.statValue}>
                    {formatDuration(session.totalTimeSpent)}
                  </ThemedText>
                </View>

                <View style={styles.statRow}>
                  <MaterialIcons name="layers" size={16} color="#666" />
                  <ThemedText style={styles.statLabel}>ระดับ:</ThemedText>
                  <ThemedText style={styles.statValue}>
                    {session.levelStats.filter(ls => ls.completed).length} เสร็จสิ้น
                  </ThemedText>
                </View>

                {session.gameMode === 'restart' && (
                  <View style={styles.statRow}>
                    <MaterialIcons name="error-outline" size={16} color="#666" />
                    <ThemedText style={styles.statLabel}>ความล้มเหลว:</ThemedText>
                    <ThemedText style={styles.statValue}>
                      {session.levelStats.reduce((sum, ls) => sum + ls.failureCount, 0)}
                    </ThemedText>
                  </View>
                )}
              </View>

              <View style={styles.cardFooter}>
                <ThemedText style={styles.dateText}>{formatDate(session.createdAt)}</ThemedText>
                <MaterialIcons name="chevron-right" size={24} color="#ccc" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4e54a3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#f5f5f5',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#4e54a3',
    borderColor: '#4e54a3',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  continueBadge: {
    backgroundColor: '#E3F2FD',
  },
  restartBadge: {
    backgroundColor: '#FFEBEE',
  },
  modeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  cardContent: {
    gap: 8,
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
});

export default PatternHistoryScreen;
