import React from "react";
import { View, Text, StyleSheet } from "react-native";
import CounterInput from "react-native-counter-input";
import Dropdown from "@/components/Dropdown";
import { DurationData, HIT_COUNT_OPTIONS } from "./types";

interface DurationOptionsProps {
	durationData: DurationData;
	onUpdate: (data: DurationData) => void;
}

const DurationOptions: React.FC<DurationOptionsProps> = ({
	durationData,
	onUpdate,
}) => {
	if (durationData.duration === "Hit") {
		return (
			<View style={styles.slider_container}>
				<Text style={styles.slider_label}>
					จำนวนครั้งที่ต้องตี: {durationData.hitduration} ครั้ง
				</Text>
				<Dropdown
					data={HIT_COUNT_OPTIONS}
					placeholder="เลือกจำนวนครั้งที่ต้องตี"
					onSelect={(value: number) =>
						onUpdate({
							...durationData,
							hitduration: value,
						})
					}
				/>
			</View>
		);
	} else if (
		durationData.duration === "Timeout" ||
		durationData.duration === "Hit or Timeout"
	) {
		return (
			<View style={styles.duration_container}>
				<Text style={styles.slider_label}>
					ระยะเวลา: {durationData.minDuration} นาที {durationData.secDuration} วินาที
				</Text>
				<View style={styles.counter_container}>
					<CounterInput
						min={0}
						max={59}
						onChange={(value) =>
							onUpdate({ ...durationData, minDuration: value })
						}
						horizontal={true}
						style={styles.counter}
					/>
					<CounterInput
						min={0}
						max={59}
						onChange={(value) =>
							onUpdate({ ...durationData, secDuration: value })
						}
						horizontal={true}
						style={styles.counter}
					/>
				</View>
				{durationData.duration === "Hit or Timeout" && (
					<>
						<Text style={styles.slider_label}>
							จำนวนครั้งที่ต้องตี: {durationData.hitduration}
						</Text>
						<Dropdown
							data={HIT_COUNT_OPTIONS}
							placeholder="เลือกจำนวนครั้งที่ต้องตี"
							onSelect={(value: number) =>
								onUpdate({
									...durationData,
									hitduration: value,
								})
							}
						/>
					</>
				)}
			</View>
		);
	}
	return null;
};

const styles = StyleSheet.create({
	duration_container: {
		marginTop: 10,
	},
	counter_container: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginTop: 10,
	},
	counter: {
		width: 120,
		marginHorizontal: 10,
	},
	slider_container: {
		width: "100%",
		padding: 15,
		zIndex: 1,
	},
	slider_label: {
		fontSize: 14,
		color: "#333",
		marginBottom: 8,
		marginTop: 5,
	},
	dropdown: {
		backgroundColor: "#f0f0f0",
		borderRadius: 8,
		padding: 10,
		marginTop: 5,
	},
});

export default DurationOptions;