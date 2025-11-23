import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import tw from "twrnc";

interface FinishButtonProps {
	onPress: () => void;
}

const FinishButton: React.FC<FinishButtonProps> = ({ onPress }) => {
	return (
		<TouchableOpacity style={styles.finish_button} onPress={onPress}>
			<Text style={styles.finish_button_text}>Finish</Text>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	finish_button: {
		backgroundColor: "#545454",
		padding: 15,
		borderRadius: 10,
		alignItems: "center",
		marginTop: 20,
		marginBottom: 20,
	},
	finish_button_text: {
		color: "#ffffff",
		fontSize: 18,
		fontWeight: "bold",
	},
});

export default FinishButton;