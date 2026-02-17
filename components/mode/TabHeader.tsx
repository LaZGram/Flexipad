import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface TabHeaderProps {
	activeTab: "manual" | "qr";
	onTabChange: (tab: "manual" | "qr") => void;
}

const TabHeader: React.FC<TabHeaderProps> = ({ activeTab, onTabChange }) => {
	return (
		<View style={styles.tabContainer}>
			<TouchableOpacity
				style={[
					styles.tab,
					activeTab === "manual" && styles.activeTab,
				]}
				onPress={() => onTabChange("manual")}
			>
				<Text
					style={[
						styles.tabText,
						activeTab === "manual" && styles.activeTabText,
					]}
				>
					ตั้งค่าด้วยตนเอง
				</Text>
			</TouchableOpacity>
			
			<TouchableOpacity
				style={[
					styles.tab,
					activeTab === "qr" && styles.activeTab,
				]}
				onPress={() => onTabChange("qr")}
			>
				<Text
					style={[
						styles.tabText,
						activeTab === "qr" && styles.activeTabText,
					]}
				>
					โหลดชุดรูปแบบ
				</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	tabContainer: {
		flexDirection: "row",
		backgroundColor: "#ffffff",
		marginHorizontal: 25,
		marginTop: 20,
		borderRadius: 10,
		padding: 4,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 3,
	},
	tab: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
	activeTab: {
		backgroundColor: "#4e54a3",
	},
	tabText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#666",
	},
	activeTabText: {
		color: "#ffffff",
	},
});

export default TabHeader;