import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import SessionCard from './SessionCard';
import { ApiService, SessionRecord } from '@/services/api.service';

const OnePadHistoryScreen: React.FC = () => {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await ApiService.getOnePadSessions();
      
      // Sort by date descending (newest first)
      const sorted = data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setSessions(sorted);
    } catch (err) {
      console.error('Error fetching sessions:', err);
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
    fetchSessions();
  }, [fetchSessions]);

  const handleRefresh = useCallback(() => {
    fetchSessions(true);
  }, [fetchSessions]);

  const handleCardPress = useCallback((sessionId: string) => {
    router.push({
      pathname: '/(tabs)/history/session-detail',
      params: { sessionId },
    });
  }, [router]);

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
          <ThemedView style={styles.retryButton} onTouchEnd={() => fetchSessions()}>
            <ThemedText style={styles.retryButtonText}>ลองใหม่</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>ประวัติโหมดแผ่นเดียว</ThemedText>
        <ThemedText style={styles.subtitle}>
          {sessions.length} {sessions.length === 1 ? 'เซสชัน' : 'เซสชัน'}
        </ThemedText>
      </ThemedView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {sessions.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>ยังไม่มีเซสชัน</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              เล่นเกมเพื่อดูประวัติของคุณที่นี่
            </ThemedText>
          </ThemedView>
        ) : (
          sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onPress={() => handleCardPress(session.id)}
            />
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  scrollContent: {
    padding: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  errorText: {
    fontSize: 16,
    color: '#e63946',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 40,
  },
  retryButton: {
    backgroundColor: '#4e54a3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: 'transparent',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});

export default OnePadHistoryScreen;
