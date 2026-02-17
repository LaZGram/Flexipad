import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from 'twrnc';
import { ApiService, HitTemplate } from '@/services/api.service';

interface HitModeHistoryProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate?: (template: HitTemplate) => void;
}

export default function HitModeHistory({ visible, onClose, onSelectTemplate }: HitModeHistoryProps) {
  const [templates, setTemplates] = useState<HitTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<HitTemplate | null>(null);

  useEffect(() => {
    if (visible) {
      fetchTemplates();
    }
  }, [visible]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getHitModeTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถโหลดประวัติได้');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTemplateItem = ({ item }: { item: HitTemplate }) => (
    <TouchableOpacity
      style={styles.templateCard}
      onPress={() => setSelectedTemplate(item)}
    >
      <View style={styles.templateHeader}>
        <Text style={styles.templateName}>{item.metadata.name}</Text>
        <Text style={styles.templateDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={styles.templateDescription}>{item.metadata.description}</Text>
      <View style={styles.templateMeta}>
        <Text style={styles.metaText}>โดย: {item.metadata.created_by}</Text>
        <Text style={styles.metaText}>รอบ: {item.configuration.roundPads?.length || 0}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderDetailModal = () => {
    if (!selectedTemplate) return null;

    const { configuration } = selectedTemplate;

    return (
      <Modal
        visible={!!selectedTemplate}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTemplate(null)}
      >
        <View style={styles.detailOverlay}>
          <View style={styles.detailContainer}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>{selectedTemplate.metadata.name}</Text>
              <TouchableOpacity onPress={() => setSelectedTemplate(null)}>
                <MaterialIcons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.detailContent}>
              <Text style={styles.detailDescription}>{selectedTemplate.metadata.description}</Text>
              
              <View style={styles.configSection}>
                <Text style={styles.configTitle}>Light Out</Text>
                <Text style={styles.configText}>
                  โหมด: {configuration.lightOut.mode}
                  {configuration.lightOut.hitCount && ` (${configuration.lightOut.hitCount} ครั้ง)`}
                  {configuration.lightOut.timeout && ` (${configuration.lightOut.timeout} วินาที)`}
                </Text>
              </View>

              <View style={styles.configSection}>
                <Text style={styles.configTitle}>Light Delay</Text>
                <Text style={styles.configText}>
                  โหมด: {configuration.lightDelay.mode}
                  {configuration.lightDelay.delayTime && ` (${configuration.lightDelay.delayTime} วินาที)`}
                  {configuration.lightDelay.randomRange && 
                    ` (${configuration.lightDelay.randomRange.min}-${configuration.lightDelay.randomRange.max} วินาที)`}
                </Text>
              </View>

              <View style={styles.configSection}>
                <Text style={styles.configTitle}>Duration</Text>
                <Text style={styles.configText}>
                  โหมด: {configuration.duration.mode}
                  {configuration.duration.hitCount && ` (${configuration.duration.hitCount} ครั้ง)`}
                  {configuration.duration.timeoutDuration && 
                    ` (${configuration.duration.timeoutDuration.minutes}:${configuration.duration.timeoutDuration.seconds})`}
                </Text>
              </View>

              {configuration.roundPads && configuration.roundPads.length > 0 && (
                <View style={styles.configSection}>
                  <Text style={styles.configTitle}>Round Pads ({configuration.roundPads.length} รอบ)</Text>
                  <View style={styles.roundPadsContainer}>
                    {configuration.roundPads.slice(0, 10).map((rp, index) => (
                      <Text key={index} style={styles.roundPadText}>
                        รอบ {rp.round}: แผ่น {rp.pad}
                      </Text>
                    ))}
                    {configuration.roundPads.length > 10 && (
                      <Text style={styles.roundPadText}>... และอีก {configuration.roundPads.length - 10} รอบ</Text>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.metaInfo}>
                <Text style={styles.metaInfoText}>สร้างโดย: {selectedTemplate.metadata.created_by}</Text>
                <Text style={styles.metaInfoText}>สร้างเมื่อ: {formatDate(selectedTemplate.createdAt)}</Text>
              </View>
            </View>

            {onSelectTemplate && (
              <TouchableOpacity
                style={styles.useButton}
                onPress={() => {
                  onSelectTemplate(selectedTemplate);
                  setSelectedTemplate(null);
                  onClose();
                }}
              >
                <Text style={styles.useButtonText}>ใช้เทมเพลตนี้</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={tw`p-2`}>
              <MaterialIcons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Hit Mode</Text>
            <TouchableOpacity onPress={fetchTemplates} style={tw`p-2`}>
              <MaterialIcons name="refresh" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4e54a3" />
              <Text style={styles.loadingText}>กำลังโหลด...</Text>
            </View>
          ) : templates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="history" size={80} color="#ccc" />
              <Text style={styles.emptyText}>ยังไม่มีประวัติ</Text>
              <Text style={styles.emptySubText}>สร้างเทมเพลต Hit Mode ของคุณเลย</Text>
            </View>
          ) : (
            <FlatList
              data={templates}
              renderItem={renderTemplateItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </Modal>

      {renderDetailModal()}
    </>
  );
}

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
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  },
  listContainer: {
    padding: 15,
  },
  templateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  templateDate: {
    fontSize: 12,
    color: '#999',
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  templateMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    color: '#4e54a3',
    fontWeight: '600',
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '100%',
    maxHeight: '80%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  detailContent: {
    padding: 20,
    maxHeight: 500,
  },
  detailDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  configSection: {
    marginBottom: 15,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4e54a3',
    marginBottom: 5,
  },
  configText: {
    fontSize: 14,
    color: '#666',
  },
  roundPadsContainer: {
    marginTop: 5,
  },
  roundPadText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 3,
  },
  metaInfo: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  metaInfoText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 3,
  },
  useButton: {
    backgroundColor: '#4e54a3',
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  useButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
