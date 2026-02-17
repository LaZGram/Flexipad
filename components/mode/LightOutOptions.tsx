import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Dropdown from "@/components/Dropdown";
import { LightOutData } from "./types";

interface LightOutOptionsProps {
	lightOutData: LightOutData;
	onUpdate: (data: LightOutData) => void;
}

const LightOutOptions: React.FC<LightOutOptionsProps> = ({
	lightOutData,
	onUpdate,
}) => {
	if (lightOutData.lightOut === "Timeout") {
		// Show timeout dropdown full width
		return (
			<View style={styles.slider_container}>
				<View style={styles.dropdown_full_section}>
					<Text style={styles.slider_label}>
						หมดเวลา: {lightOutData.timeout} วินาที
					</Text>
					<View style={styles.dropdown_container}>
						<Dropdown
							data={[1, 2, 3, 4, 5]}
							placeholder="เลือกเวลาที่ต้องการให้ไฟดับ"
							onSelect={(value: number) =>
								onUpdate({ ...lightOutData, timeout: value })
							}
						/>
					</View>
				</View>
			</View>
		);
	} else if (lightOutData.lightOut === "Hit or Timeout") {
		// Show timeout and hit count dropdowns split half
		return (
			<View style={styles.slider_container}>
				<View style={styles.dropdown_row}>
					{/* Left side - Timeout Dropdown */}
					<View style={styles.dropdown_half_section}>
						<Text style={styles.slider_label}>
							หมดเวลา: {lightOutData.timeout} วินาที
						</Text>
						<View style={styles.dropdown_container}>
							<Dropdown
								data={[1, 2, 3, 4, 5]}
								placeholder="เลือกเวลาที่ต้องการให้ไฟดับ"
								onSelect={(value: number) =>
									onUpdate({ ...lightOutData, timeout: value })
								}
							/>
						</View>
					</View>

					{/* Right side - Hit Count Dropdown */}
					<View style={styles.dropdown_half_section}>
						<Text style={styles.slider_label}>
							จำนวนการกด: {lightOutData.hitCount}
						</Text>
						<View style={styles.dropdown_container}>
							<Dropdown
								data={[1, 2, 3, 4, 5, 6]}
								placeholder="เลือกจำนวนการกด"
								onSelect={(value: number) =>
									onUpdate({ ...lightOutData, hitCount: value })
								}
							/>
						</View>
					</View>
				</View>
			</View>
		);
	}
	return null;
};

const styles = StyleSheet.create({
	slider_container: {
		width: "100%",
		padding: 15,
		zIndex: 1,
	},
	dropdown_container: {
		position: "relative",
		zIndex: 4,
	},
	dropdown_row: {
		flexDirection: "row",
		justifyContent: "space-between",
		width: "100%",
		zIndex: 2,
	},
	dropdown_full_section: {
		width: "100%",
		zIndex: 3,
	},
	dropdown_half_section: {
		width: "48%",
		zIndex: 3,
	},
	slider_label: {
		fontSize: 14,
		color: "#333",
		marginBottom: 8,
	},
});

export default LightOutOptions;