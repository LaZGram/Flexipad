import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

interface SessionCardProps {
  session: {
    id: string;
    padId: number;
    hitCount: number;
    missCount: number;
    totalRounds: number;
    accuracy: number;
    sessionDuration: number;
    averageReactionTime: number;
    createdAt: string;
  };
  onPress: () => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onPress }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <ThemedView style={styles.card}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.padLabel}>แผ่นกด {session.padId + 1}</ThemedText>
          <ThemedText style={styles.date}>{formatDate(session.createdAt)}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.statsRow}>
          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statValue}>{session.hitCount}</ThemedText>
            <ThemedText style={styles.statLabel}>ฮิต</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statValue}>{session.missCount}</ThemedText>
            <ThemedText style={styles.statLabel}>พลาด</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statValue}>{session.accuracy.toFixed(0)}%</ThemedText>
            <ThemedText style={styles.statLabel}>ความแม่นยำ</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.footer}>
          <ThemedText style={styles.footerText}>
            {session.totalRounds} รอบ • {formatDuration(session.sessionDuration)}
          </ThemedText>
          {session.averageReactionTime > 0 && (
            <ThemedText style={styles.footerText}>
              {session.averageReactionTime}ms เฉลี่ย
            </ThemedText>
          )}
        </ThemedView>
      </ThemedView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  padLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4e54a3',
  },
  date: {
    fontSize: 13,
    color: '#666666',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: 'transparent',
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    backgroundColor: 'transparent',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
  },
});

export default SessionCard;
