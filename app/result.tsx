import tw from "twrnc"; // Import utility-first styles
import * as FileSystem from "expo-file-system";
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from "react-native";
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl, API_CONFIG } from '@/config/api.config';

const saveToCSV = async (
  data: Array<{ description: string; value: string | number }>
) => {
  const now = new Date();

  // Format date with desired pattern
  const formattedDateTime = now
    .toLocaleString("en-GB", {
      second: "2-digit",
      minute: "2-digit",
      hour: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Bangkok",
      hour12: false,
    })
    .replace(/,/g, "");

  // Format filename
  const filename = `training_result_${formattedDateTime.replace(
    /[/:]/g,
    "-"
  )}.csv`;

  // Add formatted date header
  const dataWithHeader = [
    { description: `Date: ${formattedDateTime}`, value: "" },
    { description: "", value: "" }, // Empty line for spacing
    ...data,
  ];

  try {
    let csvContent = dataWithHeader
      .map((row) => `${row.description},${row.value}`)
      .join("\n");

    if (Platform.OS === "web") {
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
    } else {
      let directoryUri = "";

      if (Platform.OS === "android") {
        // Request directory permissions on Android
        const permissions =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permissions.granted) {
          Alert.alert(
            "Permission Denied",
            "Cannot save file without directory permissions."
          );
          return;
        }

        directoryUri = permissions.directoryUri;
        Alert.alert("Directory Selected", `Saving file to:\n${directoryUri}`);
      } else {
        // Use default document directory for other platforms
        directoryUri = FileSystem.documentDirectory!;
      }

      // Define the file name
      const fileName = `training_details_${Date.now()}.csv`;
      let fileUri = "";

      if (Platform.OS === "android") {
        // Use StorageAccessFramework to save the file on Android
        fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          directoryUri,
          fileName,
          "text/csv"
        );

        await FileSystem.StorageAccessFramework.writeAsStringAsync(
          fileUri,
          csvContent,
          {
            encoding: FileSystem.EncodingType.UTF8,
          }
        );
      } else {
        // Write file to standard directory on other platforms
        fileUri = `${directoryUri}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, csvContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }

      // Notify the user
      Alert.alert("File Saved", `File successfully saved to:\n${fileUri}`);
    }
  } catch (error) {
    Alert.alert("Error", "Failed to export data");
    console.error(error);
  }
};

const FullResult = ({
  isHitMode,
  isTimeMode,
  isHitModeDur,
  isTimeModeDur,
  onClose,
  lightOut,
  timeout,
  hitCount,
  delayTime,
  duration,
  minDuration,
  secDuration,
  hitDuration,
  playTime,
  userHitCount,
  averageReactionTime,
  reaction_time,
  cycle_times,
  missCount,
}: {
  isHitMode: boolean;
  isTimeMode: boolean;
  isHitModeDur: boolean;
  isTimeModeDur: boolean;
  onClose: () => void;
  lightOut: string;
  timeout: number;
  hitCount: number;
  delayTime: number;
  duration: string;
  minDuration: number;
  secDuration: number;
  hitDuration: number;
  playTime: number;
  userHitCount: number;
  averageReactionTime: number;
  reaction_time: number[];
  cycle_times: number[];
  missCount: number;
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [playerName, setPlayerName] = useState("");

  // Helper to handle CSV export
  function calculateAverageReactionTime(times: number[]): number {
    // Filter out misses (marked as -1)
    const validTimes = times.filter(t => t >= 0);
    if (validTimes.length > 0) {
      const sum = validTimes.reduce((acc, val) => acc + val, 0);
      const average = sum / validTimes.length;
      return average; // Convert to seconds
    }
    return 0; // Return 0 if no times available
  }

  // Show name input modal
  const handleSaveClick = () => {
    if (isSaved) {
      Alert.alert('Already Saved', 'This session has already been saved.');
      return;
    }
    setShowNameModal(true);
  };

  // Save to backend database
  const handleSaveToDatabase = async () => {
    if (!playerName.trim()) {
      Alert.alert('Name Required', 'Please enter your name before saving.');
      return;
    }

    setShowNameModal(false);
    setIsSaving(true);
    try {
      const sessionData = {
        playerName: playerName.trim(),
        lightOutMode: lightOut,
        timeout: isTimeMode ? timeout : null,
        hitCount: isHitMode ? hitCount : null,
        delayTime: delayTime,
        durationMode: duration,
        durationTimeout: isTimeModeDur ? minDuration * 60 + secDuration : null,
        hitDuration: isHitModeDur ? hitDuration : null,
        totalTime: playTime,
        userHitCount: userHitCount,
        missCount: missCount,
        averageReactionTime: calculateAverageReactionTime(reaction_time),
        reactionTimes: reaction_time,
        cycleTimes: cycle_times || [],
        hitPercentage: isHitMode && hitDuration > 0 ? Math.min((userHitCount / hitDuration) * 100, 100) : null,
        sessionDate: new Date().toISOString(),
      };

      console.log('📤 Sending to backend:', JSON.stringify(sessionData, null, 2));

      // Save to backend
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.HIT_MODE_SESSIONS), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setIsSaved(true);
      Alert.alert('Success', 'Session saved successfully!');
    } catch (error) {
      console.error('❌ Error saving session:', error);
      Alert.alert('Error', 'Failed to save session to database.');
    } finally {
      setIsSaving(false);
    }
  };

  // Navigate to history
  const handleViewHistory = () => {
    router.push('/hit-mode-history');
  };

  const handleExport = () => {
    const data = [
      { description: "Lights Out - Mode", value: lightOut },
      ...(isTimeMode
        ? [{ description: "Time Out", value: `${timeout} seconds` }]
        : []),
      ...(isHitMode
        ? [{ description: "Hit Count", value: `${hitCount.toFixed(2)} times` }]
        : []),
      {
        description: "Light Delay Time",
        value: `${delayTime.toFixed(2)} seconds`,
      },
      { description: "Duration - Mode", value: duration },
      ...(isTimeModeDur
        ? [
            {
              description: "Duration - Time Out",
              value: `${minDuration * 60 + secDuration} seconds`,
            },
          ]
        : []),
      ...(isHitModeDur
        ? [
            {
              description: "Hit Duration",
              value: `${hitDuration.toFixed(2)} times`,
            },
          ]
        : []),
      {
        description: "Total Time",
        value: `${playTime.toFixed(2)} seconds`,
      },
      //   {
      //     description: "(Avg) Reaction Time",
      //     value: `${averageReactionTime.toFixed(2)} seconds`,
      //   },
      {
        description: "Average Reaction Time",
        value:
          reaction_time && reaction_time.length > 0
            ? `${calculateAverageReactionTime(reaction_time).toFixed(
                2
              )} seconds`
            : "- seconds",
      },

      { description: "User Hit Count", value: `${userHitCount} times` },
      { description: "Miss Count", value: `${missCount} times` },
      ...(isHitMode && hitDuration > 0
        ? [
            {
              description: "Hit Percentage",
              value: `${Math.min(
                (userHitCount / hitDuration) * 100,
                100
              ).toFixed(2)} %`,
            },
          ]
        : []),
    ];

    saveToCSV(data);
  };

  return (
    <Modal animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.detailBox}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
          <Text style={styles.sectionTitle}>รายละเอียดการฝึก</Text>
          <Text style={styles.separator}>---------------</Text>

          <View style={styles.col}>
            <Text style={styles.label}>การดับไฟ</Text>
            <View style={styles.row}>
              <Text style={styles.label}>• โหมด </Text>
              <Text style={styles.output}>{lightOut}</Text>
            </View>
            {isTimeMode && (
              <View style={styles.row}>
                <Text style={styles.label}>• ไฟดับภายใน </Text>
                <Text style={styles.output}>{timeout}</Text>
              </View>
            )}
            {isHitMode && (
              <View style={styles.row}>
                <Text style={styles.label}>• จำนวนครั้งที่ต้องตี</Text>
                <Text style={styles.output}>{hitCount + " ครั้ง"}</Text>
              </View>
            )}
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>ดีเลย์ไฟ</Text>
            <Text style={styles.output}>
              {delayTime.toFixed(2) + " วินาที"}
            </Text>
          </View>

          <View style={styles.col}>
            <Text style={styles.label}>เงื่อนไขการจบ</Text>
            <View style={styles.row}>
              <Text style={styles.label}>• โหมด</Text>
              <Text style={styles.output}>{duration}</Text>
            </View>
            {isTimeModeDur && (
              <View style={styles.row}>
                <Text style={styles.label}>• หมดเวลา</Text>
                <Text style={styles.output}>
                  {minDuration * 60 + secDuration + " วินาที"}
                </Text>
              </View>
            )}
            {isHitModeDur && (
              <View style={styles.row}>
                <Text style={styles.label}>• จำนวนครั้งที่ต้องตี</Text>
                <Text style={styles.output}>
                  {hitDuration.toFixed(2) + " ครั้ง"}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>การวัดผล</Text>
          <Text style={styles.separator}>---------------</Text>

          <View style={styles.row}>
            <Text style={styles.label}>เวลาทั้งหมด</Text>
            <Text style={styles.output}>
              {(playTime).toFixed(2) + " วินาที"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>เวลาเฉลี่ยต่อการกด</Text>
            <Text style={styles.output}>
              {reaction_time.length > 0
                ? calculateAverageReactionTime(reaction_time).toFixed(2) +
                  " วินาที"
                : "-" + " วินาที"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>จำนวนครั้งที่ตี</Text>
            <Text style={styles.output}>{userHitCount + " ครั้ง"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>จำนวนครั้งที่พลาด</Text>
            <Text style={[styles.output, { color: missCount > 0 ? '#DC143C' : '#2E7D32' }]}>{missCount + " ครั้ง"}</Text>
          </View>
          
          {/* Individual Press Times */}
          {reaction_time && reaction_time.length > 0 && (
            <View style={styles.col}>
              <Text style={styles.label}>เวลาแต่ละครั้งที่กด:</Text>
              {reaction_time.map((time, index) => (
                <View key={index} style={styles.row}>
                  <Text style={styles.label}>• กดครั้งที่ {index + 1}</Text>
                  <Text style={[styles.output, time < 0 && { color: '#DC143C' }]}>
                    {time < 0 ? `พลาด` : `${time.toFixed(3)} วินาที`}
                  </Text>
                </View>
              ))}
            </View>
          )}
          
          {isHitMode && (
            <View style={styles.row}>
              <Text style={styles.label}>• เปอร์เซ็นต์การตี</Text>
              <Text style={styles.output}>
                {hitDuration > 0
                  ? Math.min((userHitCount / hitDuration) * 100, 100).toFixed(
                      2
                    ) + " %"
                  : "-"}
              </Text>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.button, styles.saveButton, isSaved && styles.disabledButton]} 
            onPress={handleSaveClick}
            disabled={isSaving || isSaved}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{isSaved ? 'Saved ✓' : 'Save'}</Text>
            )}
          </TouchableOpacity>
          
          {/* <TouchableOpacity style={[styles.button, styles.historyButton]} onPress={handleViewHistory}>
            <Text style={styles.buttonText}>View History</Text>
          </TouchableOpacity> */}

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Finish</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity style={styles.button} onPress={handleExport}>
            <Text style={styles.buttonText}>Export CSV</Text>
          </TouchableOpacity> */}
          </ScrollView>
        </View>
      </View>

      {/* Player Name Input Modal */}
      <Modal
        visible={showNameModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.nameInputBox}>
            <Text style={styles.nameInputTitle}>Enter Player Name</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Your name"
              value={playerName}
              onChangeText={setPlayerName}
              autoFocus={true}
              maxLength={50}
            />
            <View style={styles.nameModalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowNameModal(false);
                  setPlayerName("");
                }}
              >
                <Text style={styles.buttonText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={handleSaveToDatabase}
              >
                <Text style={styles.buttonText}>ยืนยัน</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e1f4f3" }, // Container style with background color
  header: {
    textAlign: "center", // Center align the text
    fontSize: 24, // Font size
    fontWeight: "bold", // Bold font weight
    marginVertical: 20, // Vertical margin
  },
  iconContainer: { position: "absolute", alignItems: "center" }, // Absolute positioning for icons
  playButton: {
    backgroundColor: "#2f95dc", // Button background color
    paddingVertical: 12, // Vertical padding
    paddingHorizontal: 20, // Horizontal padding
    borderRadius: 10, // Rounded corners
    alignSelf: "center", // Center the button horizontally
    marginTop: 20, // Top margin
  },
  result_container: {
    flex: 1,
    backgroundColor: "#E6F7F4",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
    alignItems: "center",
    justifyContent: "center",
  },
  detailBox: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    width: "80%",
    maxHeight: "90%",
    alignItems: "center",
  },
  scrollView: {
    width: "100%",
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 20,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginVertical: 8,
  },
  separator: {
    fontSize: 12,
    color: "#000000",
    marginBottom: 12,
  },
  col: {
    flexDirection: "column",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: "#000000",
  },
  output: {
    fontSize: 14,
    color: "#2E7D32",
  },
  buttonText: {
    color: "white", // Text color
    fontWeight: "bold", // Bold font weight
    fontSize: 16, // Font size
  },
  buttonText2: {
    color: "red", // Text color
    // marginTop: ,
    fontWeight: "bold", // Bold font weight
    fontSize: 16, // Font size
  },
  hitCountContainer: {
    marginTop: 30, // Top margin
    alignItems: "center", // Center align the hit count
  },
  hitCountText: {
    fontSize: 20, // Font size for hit count
    fontWeight: "bold", // Bold font weight
    color: "#333", // Text color
    marginTop: 5,
  },
  button: {
    backgroundColor: "#4A4A4A",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 10,
    alignItems: "center",
    width: "70%",
  },
  saveButton: {
    backgroundColor: "#4e54a3",
  },
  historyButton: {
    backgroundColor: "#2b8a3e",
  },
  disabledButton: {
    backgroundColor: "#9e9e9e",
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  nameInputBox: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    maxWidth: 400,
    alignItems: "center",
  },
  nameInputTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  nameInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  nameModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#9e9e9e",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#4e54a3",
  },
});

export default FullResult;