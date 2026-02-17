import React from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
} from "react-native";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import tw from "twrnc";

interface GameModeCardProps {
	title: string;
	description: string;
	icon: React.ReactNode;
	onPress: () => void;
}

const GameModeCard: React.FC<GameModeCardProps> = ({
	title,
	description,
	icon,
	onPress,
}) => {
	return (
		<TouchableOpacity
			style={styles.modeCard}
			onPress={onPress}
			activeOpacity={0.8}
		>
			<View style={styles.cardContent}>
				{icon}
				<Text style={styles.modeTitle}>{title}</Text>
				<Text style={styles.modeDescription}>{description}</Text>
			</View>
		</TouchableOpacity>
	);
};

const HomeScreen: React.FC = () => {
	const navigation = useNavigation<NavigationProp<any>>();

	const handleHitModePress = () => {
		navigation.navigate("Mode");
	};

	const handlePatternModePress = () => {
		navigation.navigate("PatternMode");
	};

	const handleForbiddenColorModePress = () => {
		navigation.navigate("ForbiddenColorMode");
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
					Flexipad Training
				</Text>
				<View style={styles.headerSection}>
					{/* <Text style={styles.title}>Flexipad Training</Text> */}
					<Text style={styles.subtitle}>เลือกโหมดการฝึกของคุณ</Text>
				</View>
			
			<View style={styles.modesContainer}>
				<GameModeCard
					title="Reaction Training"
					description="ทดสอบความเร็วและการตอบสนองของคุณ"
					icon={
						<MaterialIcons 
							name="flash-on" 
							size={42} 
							color="#ffffff" 
						/>
					}
					onPress={handleHitModePress}
				/>

				<GameModeCard
					title="Pattern Memory"
					description="จำรูปแบบ ตีให้ถูก ทดสอบความจำคุณ"
					icon={
						<FontAwesome5 
							name="brain" 
							size={38} 
							color="#ffffff" 
						/>
					}
					onPress={handlePatternModePress}
				/>

				<GameModeCard
					title="Forbidden Color"
					description="ตอบสนองต่อไฟสีเขียว และเลี่ยงไฟสีแดง"
					icon={
						<MaterialIcons 
							name="block" 
							size={40} 
							color="#ffffff" 
						/>
					}
					onPress={handleForbiddenColorModePress}
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#ffffff",
		paddingHorizontal: 24,
	},
	headerSection: {
		alignItems: "center",
		marginBottom: 48,
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#4e54a3",
		textAlign: "center",
		marginBottom: 8,
		letterSpacing: -0.5,
	},
	subtitle: {
		fontSize: 16,
		color: "#8e94c7",
		textAlign: "center",
		fontWeight: "500",
		letterSpacing: 0.3,
	},
	modesContainer: {
		flex: 1,
		justifyContent: "center",
		gap: 20,
		marginBottom: 80,
	},
	modeCard: {
		backgroundColor: "#4e54a3",
		borderRadius: 24,
		padding: 28,
		alignItems: "center",
		minHeight: 140,
		justifyContent: "center",
		shadowColor: "#4e54a3",
		shadowOffset: {
			width: 0,
			height: 6,
		},
		shadowOpacity: 0.25,
		shadowRadius: 12,
		elevation: 8,
	},
	cardContent: {
		alignItems: "center",
	},
	modeTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: "#ffffff",
		marginTop: 12,
		marginBottom: 6,
		letterSpacing: -0.3,
		textAlign: "center",
	},
	modeDescription: {
		fontSize: 14,
		color: "rgba(255,255,255,0.85)",
		textAlign: "center",
		letterSpacing: 0.2,
		fontWeight: "400",
		lineHeight: 18,
	},
});

export default HomeScreen;