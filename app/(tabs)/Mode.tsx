import React, { useState } from "react";
import {
	View,
	Text,
	ScrollView,
	StyleSheet,
	Alert,
} from "react-native";
import tw from "twrnc";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import TabHeader from "@/components/mode/TabHeader";
import ManualSetupTab from "@/components/mode/ManualSetupTab";
import QRScanTab from "@/components/mode/QRScanTab";
import { LightOutData, LightDelayData, DurationData } from "@/components/mode/types";

const ModeScreen: React.FC = () => {
	const navigation = useNavigation<NavigationProp<any>>();
	const [activeTab, setActiveTab] = useState<"manual" | "qr">("manual");
	const [light_out_data, set_light_out_data] = useState<LightOutData>({
		lightOut: "",
		timeout: 0,
		hitCount: 0,
	});

	const [light_delay_data, set_light_delay_data] = useState<LightDelayData>({
		lightDelay: "",
		delaytime: 0,
		randomDelay: null,
	});

	const [duration_data, set_duration_data] = useState<DurationData>({
		duration: "",
		hitduration: 0,
		minDuration: 0,
		secDuration: 0,
	});

	const get_random_delay = (): number => {
		return parseFloat((Math.random() * (5.0 - 0.5) + 0.5).toFixed(2));
	};

	const handle_light_out_select = (option: string) => {
		const new_data = { ...light_out_data, lightOut: option };
		if (option === "Hit") {
			new_data.hitCount = 1;
			new_data.timeout = 0;
		} else if (option === "Timeout") {
			new_data.hitCount = 0;
		} else if (option === "Hit or Timeout") {
			new_data.hitCount = 1;
		}
		set_light_out_data(new_data);
	};

	const handle_light_delay_select = (option: string) => {
		const new_data = { ...light_delay_data, lightDelay: option };
		if (option === "Random") {
			new_data.randomDelay = get_random_delay();
			new_data.delaytime = 0;
		} else if (option === "None") {
			new_data.delaytime = 0;
			new_data.randomDelay = null;
		}
		set_light_delay_data(new_data);
	};

	const handle_duration_select = (option: string) => {
		const new_data = { ...duration_data, duration: option };
		if (option === "Hit") {
			new_data.minDuration = 0;
			new_data.secDuration = 0;
		} else if (option === "Timeout") {
			new_data.hitduration = 0;
		}
		set_duration_data(new_data);
	};

	const handle_qr_scan = () => {
		// This is now handled within the QRScanTab component
		console.log("QR Code scanning initiated");
	};

	const handle_config_import = (
		lightOutData: LightOutData,
		lightDelayData: LightDelayData,
		durationData: DurationData,
		metadata: any
	) => {
		// Import the configuration data
		set_light_out_data(lightOutData);
		set_light_delay_data(lightDelayData);
		set_duration_data(durationData);
		
		// Switch to manual setup tab to show imported values
		setActiveTab("manual");
		
		console.log("Configuration imported:", { lightOutData, lightDelayData, durationData, metadata });
	};

	const handle_finish = () => {
		if (
			!light_out_data.lightOut ||
			!light_delay_data.lightDelay ||
			!duration_data.duration
		) {
			Alert.alert("ยังเลือกโหมดไม่ครบ", "เลือกโหมดให้ครบเพื่อไปขั้นตอนถัดไป");
			return;
		}
		navigation.navigate("start", {
			lightOut: light_out_data.lightOut,
			hitCount: light_out_data.hitCount,
			timeout: light_out_data.timeout,
			lightDelay: light_delay_data.lightDelay,
			delaytime: light_delay_data.delaytime,
			duration: duration_data.duration,
			hitduration: duration_data.hitduration,
			minDuration: duration_data.minDuration,
			secDuration: duration_data.secDuration,
		});
		console.log(
			`go to the start page ${light_out_data.lightOut} ${light_out_data.hitCount} ${light_out_data.timeout} ${light_delay_data.lightDelay} ${light_delay_data.delaytime} ${duration_data.duration} ${duration_data.hitduration} ${duration_data.minDuration} ${duration_data.secDuration}`
		);
	};

	return (
		<View style={styles.container}>
			<Text
				style={[
					tw`text-center font-bold text-white my-4 mt-8 shadow-lg`,
					{
						backgroundColor: "#4e54a3",
						fontSize: 36,
						marginHorizontal: "-10%",
					},
				]}
			>
				Hit Mode
			</Text>
			
			<TabHeader 
				activeTab={activeTab} 
				onTabChange={setActiveTab} 
			/>

			<ScrollView style={styles.scroll_view}>
				{activeTab === "manual" ? (
					<ManualSetupTab
						lightOutData={light_out_data}
						lightDelayData={light_delay_data}
						durationData={duration_data}
						onLightOutUpdate={set_light_out_data}
						onLightDelayUpdate={set_light_delay_data}
						onDurationUpdate={set_duration_data}
						onLightOutSelect={handle_light_out_select}
						onLightDelaySelect={handle_light_delay_select}
						onDurationSelect={handle_duration_select}
						onFinish={handle_finish}
					/>
				) : (
					<QRScanTab 
						onScanPress={handle_qr_scan} 
						onConfigImport={handle_config_import}
					/>
				)}
			</ScrollView>
		</View>
	);
};
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#eaf7ff",
	},
	scroll_view: {
		flex: 1,
	},
});

export default ModeScreen;
