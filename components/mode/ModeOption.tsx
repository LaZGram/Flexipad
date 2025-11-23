import React, { useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	Animated,
	StyleSheet,
} from "react-native";
import { MaterialIcons, Entypo } from "@expo/vector-icons";
import { ModeOptionProps } from "./types";

const ModeOption: React.FC<ModeOptionProps> = ({
	mode_type,
	mode_selected,
	set_mode_selected,
	options,
	description,
	icon_name,
	render_additional_options,
}) => {
	const [contentHeight, setContentHeight] = useState(0);
	const [is_options_visible, set_is_options_visible] = useState(false);
	const [animation] = useState(new Animated.Value(0));

	const max_height = animation.interpolate({
		inputRange: [0, 1],
		outputRange: [0, contentHeight + 300],
	});

	const toggle_options = () => {
		set_is_options_visible(!is_options_visible);
		Animated.timing(animation, {
			toValue: is_options_visible ? 0 : 1,
			duration: 300,
			useNativeDriver: false,
		}).start();
	};

	return (
		<View style={styles.mode_section}>
			<TouchableOpacity style={styles.block} onPress={toggle_options}>
				<View style={styles.row}>
					<View style={styles.icon_container}>
						{icon_name === "light" ? (
							<MaterialIcons name="wb-twilight" size={30} color="black" />
						) : (
							<Entypo name="back-in-time" size={30} color="black" />
						)}
					</View>
					<View style={styles.text_container}>
						<Text style={styles.label_header}>{mode_type}</Text>
						<Text style={styles.label_text}>{description}</Text>
					</View>
				</View>
			</TouchableOpacity>

			<Animated.View
				style={[styles.options_container, { maxHeight: max_height }]}
			>
				<View
					style={styles.options_content}
					onLayout={(event) => {
						setContentHeight(event.nativeEvent.layout.height);
					}}
				>
					<View style={styles.options_row}>
						{options.map((option) => (
							<TouchableOpacity
								key={option}
								style={[
									styles.option_item,
									mode_selected === option && styles.selected_option,
								]}
								onPress={() => set_mode_selected(option)}
							>
								<Text
									style={[
										styles.option_text,
										mode_selected === option && styles.selected_option_text,
									]}
								>
									{option}
								</Text>
							</TouchableOpacity>
						))}
					</View>
					{render_additional_options && render_additional_options()}
				</View>
			</Animated.View>
		</View>
	);
};

const styles = StyleSheet.create({
	mode_section: {
		marginBottom: 20,
		zIndex: 1,
	},
	option_text: {
		color: "#000000",
		fontSize: 16,
	},
	option_item: {
		padding: 10,
		borderRadius: 5,
		backgroundColor: "#f3da74",
		borderWidth: 1,
		borderColor: "#ddd",
	},
	selected_option_text: {
		color: "#ffffff",
	},
	selected_option: {
		backgroundColor: "#000000",
	},
	block: {
		borderWidth: 1,
		borderColor: "#000000",
		backgroundColor: "#ffffff",
		borderRadius: 10,
		padding: 20,
		marginBottom: 0,
		width: "100%",
	},
	row: {
		flexDirection: "row",
		width: "100%",
	},
	icon_container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		borderRightWidth: 1,
		borderRightColor: "#000000",
		paddingHorizontal: 10,
	},
	text_container: {
		flex: 2.25,
		alignItems: "flex-start",
		justifyContent: "center",
		paddingHorizontal: 10,
	},
	label_header: {
		fontSize: 18,
		color: "#000000",
	},
	label_text: {
		fontSize: 16,
		color: "#555",
	},
	options_container: {
		overflow: "hidden",
		backgroundColor: "#f5f5f5",
		marginTop: -10,
		marginBottom: 20,
		borderBottomLeftRadius: 10,
		borderBottomRightRadius: 10,
		borderWidth: 1,
		borderColor: "#000000",
		borderTopWidth: 0,
		padding: 10,
		zIndex: 2,
	},
	options_content: {
		width: "100%",
		position: "relative",
		zIndex: 3,
	},
	options_row: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-around",
		padding: 10,
	},
});

export default ModeOption;