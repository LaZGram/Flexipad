import React from "react";
import { View } from "react-native";
import ModeOption from "./ModeOption";
import LightOutOptions from "./LightOutOptions";
import LightDelayOptions from "./LightDelayOptions";
import DurationOptions from "./DurationOptions";
import FinishButton from "./FinishButton";
import { LightOutData, LightDelayData, DurationData } from "./types";

interface ManualSetupTabProps {
	lightOutData: LightOutData;
	lightDelayData: LightDelayData;
	durationData: DurationData;
	onLightOutUpdate: (data: LightOutData) => void;
	onLightDelayUpdate: (data: LightDelayData) => void;
	onDurationUpdate: (data: DurationData) => void;
	onLightOutSelect: (option: string) => void;
	onLightDelaySelect: (option: string) => void;
	onDurationSelect: (option: string) => void;
	onFinish: () => void;
}

const ManualSetupTab: React.FC<ManualSetupTabProps> = ({
	lightOutData,
	lightDelayData,
	durationData,
	onLightOutUpdate,
	onLightDelayUpdate,
	onDurationUpdate,
	onLightOutSelect,
	onLightDelaySelect,
	onDurationSelect,
	onFinish,
}) => {
	return (
		<View style={{ paddingHorizontal: 25, paddingTop: 20 }}>
			<ModeOption
				mode_type="การดับไฟ"
				mode_selected={lightOutData.lightOut}
				set_mode_selected={onLightOutSelect}
				options={["Hit", "Timeout", "Hit or Timeout"]}
				description="ตั้งค่าเงื่อนไขการดับไฟ"
				icon_name="light"
				render_additional_options={() => (
					<LightOutOptions 
						lightOutData={lightOutData} 
						onUpdate={onLightOutUpdate} 
					/>
				)}
			/>

			<ModeOption
				mode_type="ดีเลย์ไฟ"
				mode_selected={lightDelayData.lightDelay}
				set_mode_selected={onLightDelaySelect}
				options={["None", "Fixed", "Random"]}
				description="ตั้งค่าดีเลย์ไฟ"
				icon_name="light"
				render_additional_options={() => (
					<LightDelayOptions 
						lightDelayData={lightDelayData} 
						onUpdate={onLightDelayUpdate} 
					/>
				)}
			/>

			<ModeOption
				mode_type="เงื่อนไขการจบ"
				mode_selected={durationData.duration}
				set_mode_selected={onDurationSelect}
				options={["Hit", "Timeout", "Hit or Timeout"]}
				description="ตั้งค่าพารามิเตอร์เงื่อนไขในการฝึก"
				icon_name="time"
				render_additional_options={() => (
					<DurationOptions 
						durationData={durationData} 
						onUpdate={onDurationUpdate} 
					/>
				)}
			/>

			<FinishButton onPress={onFinish} />
		</View>
	);
};

export default ManualSetupTab;