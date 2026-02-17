import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, View, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import { ApiService, PatternSessionRecord } from '@/services/api.service';
import tw from 'twrnc';

const PatternSessionDetailScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [session, setSession] = useState<PatternSessionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionDetail = async () => {
      try {
        setLoading(true);
        const data = await ApiService.getPatternSessionById(sessionId);
        setSession(data);
      } catch (err) {
        console.error('Error fetching session detail:', err);
        setError('โหลดรายละเอียดเซสชันไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSessionDetail();
    }
  }, [sessionId]);

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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centerContent}>
          <ActivityIndicator size="large" color="#FFA500" />
          <ThemedText style={styles.loadingText}>กำลังโหลดเซสชัน...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (error || !session) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centerContent}>
          <MaterialIcons name="error-outline" size={64} color="#f44336" />
          <ThemedText style={styles.errorText}>{error || 'ไม่พบเซสชัน'}</ThemedText>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ThemedText style={styles.backButtonText}>กลับ</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          tw`flex-row items-center justify-center my-4 mt-8 shadow-lg`,
          {
            backgroundColor: "#4e54a3",
            marginHorizontal: "-10%",
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/history/pattern-history')}
          style={tw`absolute left-4 ml-4 p-2`}
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
          ประวัติ
        </Text>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <MaterialIcons name="emoji-events" size={32} color="#FFA500" />
            <View style={styles.headerInfo}>
              <ThemedText style={styles.headerTitle}>ระดับ {session.finalLevel}</ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                {session.gameMode === 'restart' ? 'เริ่มใหม่ตั้งแต่ต้น' : 'เล่นต่อจนกว่าจะถูก'}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.dateText}>{formatDate(session.createdAt)}</ThemedText>
        </View>

        {/* Summary Stats */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>สรุปเซสชัน</ThemedText>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialIcons name="access-time" size={24} color="#2196F3" />
              <ThemedText style={styles.statValue}>{formatDuration(session.totalTimeSpent)}</ThemedText>
              <ThemedText style={styles.statLabel}>เวลาทั้งหมด</ThemedText>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="layers" size={24} color="#4CAF50" />
              <ThemedText style={styles.statValue}>{session.finalLevel}</ThemedText>
              <ThemedText style={styles.statLabel}>ระดับสูงสุด</ThemedText>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="check-circle" size={24} color="#FFA500" />
              <ThemedText style={styles.statValue}>
                {session.levelStats.filter(ls => ls.completed).length}
              </ThemedText>
              <ThemedText style={styles.statLabel}>เสร็จสิ้น</ThemedText>
            </View>
            {session.gameMode === 'restart' && (
              <View style={styles.statCard}>
                <MaterialIcons name="error-outline" size={24} color="#f44336" />
                <ThemedText style={styles.statValue}>
                  {session.levelStats.reduce((sum, ls) => sum + ls.failureCount, 0)}
                </ThemedText>
                <ThemedText style={styles.statLabel}>ความล้มเหลวทั้งหมด</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Level-by-Level Details */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>รายละเอียดแต่ละระดับ</ThemedText>
          {session.levelStats.map((levelStat, index) => (
            <View key={`${levelStat.level}-${levelStat.startTime}`} style={styles.levelCard}>
              <View style={styles.levelHeader}>
                <View style={styles.levelTitleRow}>
                  <ThemedText style={styles.levelNumber}>ระดับ {levelStat.level}</ThemedText>
                  {levelStat.completed && (
                    <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                  )}
                </View>
              </View>
              
              <View style={styles.levelStats}>
                {session.gameMode === 'continue' ? (
                  <View style={styles.levelStatRow}>
                    <MaterialIcons name="timer" size={16} color="#666" />
                    <ThemedText style={styles.levelStatLabel}>เวลา:</ThemedText>
                    <ThemedText style={styles.levelStatValue}>
                      {formatDuration(levelStat.timeSpent)}
                    </ThemedText>
                  </View>
                ) : (
                  <View style={styles.levelStatRow}>
                    <MaterialIcons name="error-outline" size={16} color="#666" />
                    <ThemedText style={styles.levelStatLabel}>ความล้มเหลว:</ThemedText>
                    <ThemedText style={styles.levelStatValue}>
                      {levelStat.failureCount}
                    </ThemedText>
                  </View>
                )}
                
                <View style={styles.levelStatRow}>
                  <MaterialIcons name="flag" size={16} color="#666" />
                  <ThemedText style={styles.levelStatLabel}>สถานะ:</ThemedText>
                  <ThemedText style={[
                    styles.levelStatValue,
                    levelStat.completed ? styles.completedText : styles.incompleteText
                  ]}>
                    {levelStat.completed ? 'เสร็จสิ้น' : 'ยังไม่เสร็จ'}
                  </ThemedText>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Game Mode Info */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>โหมดเกม</ThemedText>
          <View style={styles.infoCard}>
            <MaterialIcons 
              name={session.gameMode === 'restart' ? 'replay' : 'trending-up'} 
              size={24} 
              color="#FFA500" 
            />
            <View style={styles.infoContent}>
              <ThemedText style={styles.infoTitle}>
                {session.gameMode === 'restart' ? 'เริ่มใหม่ตั้งแต่ต้น' : 'เล่นต่อจนกว่าจะถูก'}
              </ThemedText>
              <ThemedText style={styles.infoDescription}>
                {session.gameMode === 'restart' 
                  ? 'เมื่อผิด: เริ่มใหม่จากระดับ 1'
                  : 'เมื่อผิด: ลองจำรูปแบบปัจจุบันจนกว่าจะถูก'}
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  levelCard: {
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
  levelHeader: {
    marginBottom: 12,
  },
  levelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  levelStats: {
    gap: 8,
  },
  levelStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelStatLabel: {
    fontSize: 14,
    color: '#666',
  },
  levelStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  completedText: {
    color: '#4CAF50',
  },
  incompleteText: {
    color: '#999',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default PatternSessionDetailScreen;
