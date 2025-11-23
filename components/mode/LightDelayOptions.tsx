import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Dropdown from "@/components/Dropdown";
import { LightDelayData, LIGHT_DELAY_OPTIONS, RANDOM_DELAY_RANGE } from "./types";

interface LightDelayOptionsProps {
	lightDelayData: LightDelayData;
	onUpdate: (data: LightDelayData) => void;
}

const LightDelayOptions: React.FC<LightDelayOptionsProps> = ({
	lightDelayData,
	onUpdate,
}) => {
	if (lightDelayData.lightDelay === "Fixed") {
		return (
			<View style={styles.slider_container}>
				<Text style={styles.slider_label}>
					Delay: {lightDelayData.delaytime.toFixed(2)} seconds
				</Text>
				<Dropdown
					data={LIGHT_DELAY_OPTIONS}
					placeholder="Select delay"
					onSelect={(value: number) =>
						onUpdate({ ...lightDelayData, delaytime: value })
					}
				/>
			</View>
		);
	} else if (lightDelayData.lightDelay === "Random") {
		return (
			<View style={styles.slider_container}>
				<Text style={styles.slider_label}>
					Random Delay Range: {RANDOM_DELAY_RANGE[0]} -{" "}
					{RANDOM_DELAY_RANGE[1]} seconds
				</Text>
				<Text style={styles.note}>
					Light will appear randomly between {RANDOM_DELAY_RANGE[0]} and{" "}
					{RANDOM_DELAY_RANGE[1]} seconds
				</Text>
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
	slider_label: {
		fontSize: 14,
		color: "#333",
		marginBottom: 8,
	},
	dropdown: {
		backgroundColor: "#f0f0f0",
		borderRadius: 8,
		padding: 10,
		marginTop: 5,
	},
	note: {
		color: "#666",
		fontSize: 12,
		marginTop: 5,
		fontStyle: "italic",
	},
});

export default LightDelayOptions;