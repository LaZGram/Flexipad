import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ApiService, SessionRecord } from '@/services/api.service';

const SessionDetailScreen: React.FC = () => {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;

      try {
        setLoading(true);
        const data = await ApiService.getSessionById(sessionId);
        setSession(data);
      } catch (err) {
        console.error('Error fetching session:', err);
        setError('โหลดรายละเอียดเซสชันไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins} minutes ${secs} seconds` : `${secs} seconds`;
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4e54a3" />
        </ThemedView>
      </ThemedView>
    );
  }

  if (error || !session) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centerContent}>
          <ThemedText style={styles.errorText}>{error || 'ไม่พบเซสชัน'}</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <ThemedView style={styles.headerCard}>
        <ThemedText style={styles.padTitle}>แผ่นกด {session.padId + 1}</ThemedText>
        <ThemedText style={styles.date}>{formatDate(session.createdAt)}</ThemedText>
      </ThemedView>

      {/* Summary Stats */}
      <ThemedView style={styles.card}>
        <ThemedText style={styles.cardTitle}>สรุป</ThemedText>
        <ThemedView style={styles.summaryGrid}>
          <ThemedView style={styles.summaryItem}>
            <ThemedText style={styles.summaryValue}>{session.hitCount}</ThemedText>
            <ThemedText style={styles.summaryLabel}>ฮิต</ThemedText>
          </ThemedView>
          <ThemedView style={styles.summaryItem}>
            <ThemedText style={styles.summaryValue}>{session.missCount}</ThemedText>
            <ThemedText style={styles.summaryLabel}>พลาด</ThemedText>
          </ThemedView>
          <ThemedView style={styles.summaryItem}>
            <ThemedText style={styles.summaryValue}>{session.totalRounds}</ThemedText>
            <ThemedText style={styles.summaryLabel}>รอบทั้งหมด</ThemedText>
          </ThemedView>
          <ThemedView style={styles.summaryItem}>
            <ThemedText style={styles.summaryValue}>{session.accuracy.toFixed(0)}%</ThemedText>
            <ThemedText style={styles.summaryLabel}>ความแม่นยำ</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {/* Performance */}
      <ThemedView style={styles.card}>
        <ThemedText style={styles.cardTitle}>ผลงาน</ThemedText>
        <ThemedView style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>ปฏิกิริยาเฉลี่ย</ThemedText>
          <ThemedText style={styles.infoValue}>{session.averageReactionTime}ms</ThemedText>
        </ThemedView>
        {/* <ThemedView style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Session Duration</ThemedText>
          <ThemedText style={styles.infoValue}>{formatDuration(session.sessionDuration)}</ThemedText>
        </ThemedView> */}
      </ThemedView>

      {/* Game Config */}
      <ThemedView style={styles.card}>
        <ThemedText style={styles.cardTitle}>🎮 การตั้งค่าเกม</ThemedText>
        
        <ThemedView style={styles.configGrid}>
          {/* Red Probability */}
          <ThemedView style={[styles.configBadge, styles.configBadgeRed]}>
            <ThemedView style={styles.configIconContainer}>
              <ThemedText style={styles.configIcon}>🔴</ThemedText>
            </ThemedView>
            <ThemedView style={styles.configContent}>
              <ThemedText style={styles.configBadgeLabel}>โอกาสสีแดง</ThemedText>
              <ThemedText style={styles.configBadgeValue}>{(session.gameConfig.redProbability * 100).toFixed(0)}%</ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Red Display Duration */}
          <ThemedView style={[styles.configBadge, styles.configBadgeRed]}>
            <ThemedView style={styles.configIconContainer}>
              <ThemedText style={styles.configIcon}>⏱️</ThemedText>
            </ThemedView>
            <ThemedView style={styles.configContent}>
              <ThemedText style={styles.configBadgeLabel}>ระยะเวลาแสดงสีแดง</ThemedText>
              <ThemedText style={styles.configBadgeValue}>{session.gameConfig.redDisplayDuration}ms</ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Green Timeout */}
          <ThemedView style={[styles.configBadge, styles.configBadgeGreen]}>
            <ThemedView style={styles.configIconContainer}>
              <ThemedText style={styles.configIcon}>🟢</ThemedText>
            </ThemedView>
            <ThemedView style={styles.configContent}>
              <ThemedText style={styles.configBadgeLabel}>หมดเวลาสีเขียว</ThemedText>
              <ThemedText style={styles.configBadgeValue}>{session.gameConfig.greenTimeout}ms</ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Session Time Limit */}
          <ThemedView style={[styles.configBadge, styles.configBadgeTime]}>
            <ThemedView style={styles.configIconContainer}>
              <ThemedText style={styles.configIcon}>⏰</ThemedText>
            </ThemedView>
            <ThemedView style={styles.configContent}>
              <ThemedText style={styles.configBadgeLabel}>ระยะเวลาเซสชัน</ThemedText>
              <ThemedText style={styles.configBadgeValue}>{session.gameConfig.sessionTimeLimit}s</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {/* Press Records */}
      {session.pressRecords && session.pressRecords.length > 0 && (
        <ThemedView style={styles.card}>
          <ThemedText style={styles.cardTitle}>บันทึกการกด ({session.pressRecords.length})</ThemedText>
          <ThemedView style={styles.recordsList}>
            {session.pressRecords.map((record, index) => (
              <ThemedView
                key={index}
                style={[
                  styles.recordItem,
                  record.result === 'hit' ? styles.recordHit : styles.recordMiss,
                ]}
              >
                <ThemedView style={styles.recordHeader}>
                  <ThemedText style={styles.recordNumber}>#{record.pressNumber}</ThemedText>
                  <ThemedText style={styles.recordColor}>{record.color.toUpperCase()}</ThemedText>
                  <ThemedText
                    style={[
                      styles.recordResult,
                      record.result === 'hit' ? styles.resultHit : styles.resultMiss,
                    ]}
                  >
                    {record.result === 'hit' ? '✓ HIT' : '✗ MISS'}
                  </ThemedText>
                </ThemedView>
                <ThemedText style={styles.recordTime}>
                  {record.reactionTime > 0 ? `${record.reactionTime}ms` : 'timeout'}
                </ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        </ThemedView>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  errorText: {
    fontSize: 16,
    color: '#e63946',
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  padTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4e54a3',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#666666',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    backgroundColor: 'transparent',
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4e54a3',
    marginBottom: 4,
    lineHeight: 32,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666666',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'transparent',
  },
  infoLabel: {
    fontSize: 15,
    color: '#666666',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  recordsList: {
    gap: 8,
    backgroundColor: 'transparent',
  },
  recordItem: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    backgroundColor: 'transparent',
  },
  recordHit: {
    backgroundColor: '#d3f9d8',
    borderLeftColor: '#2b8a3e',
  },
  recordMiss: {
    backgroundColor: '#ffe0e0',
    borderLeftColor: '#e63946',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  recordNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  recordColor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    textTransform: 'uppercase',
  },
  recordResult: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  resultHit: {
    color: '#2b8a3e',
  },
  resultMiss: {
    color: '#e63946',
  },
  recordTime: {
    fontSize: 12,
    color: '#666666',
  },
  configGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: 'transparent',
  },
  configBadge: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  configBadgeRed: {
    backgroundColor: '#ffe5e5',
    borderLeftColor: '#ff6b6b',
  },
  configBadgeGreen: {
    backgroundColor: '#e7f5e7',
    borderLeftColor: '#51cf66',
  },
  configBadgeTime: {
    backgroundColor: '#e3f2fd',
    borderLeftColor: '#4e54a3',
  },
  configIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  configIcon: {
    fontSize: 20,
  },
  configContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  configBadgeLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
    fontWeight: '500',
  },
  configBadgeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
});

export default SessionDetailScreen;
