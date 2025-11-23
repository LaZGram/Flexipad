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
	comingSoon?: boolean;
}

const GameModeCard: React.FC<GameModeCardProps> = ({
	title,
	description,
	icon,
	onPress,
	comingSoon = false,
}) => {
	return (
		<TouchableOpacity
			style={[styles.modeCard, comingSoon && styles.comingSoonCard]}
			onPress={comingSoon ? undefined : onPress}
			disabled={comingSoon}
		>
			<View style={styles.iconContainer}>
				{icon}
				{comingSoon && (
					<View style={styles.comingSoonBadge}>
						<Text style={styles.comingSoonText}>Soon</Text>
					</View>
				)}
			</View>
			<View style={styles.textContainer}>
				<Text style={[styles.modeTitle, comingSoon && styles.comingSoonTitle]}>
					{title}
				</Text>
				<Text style={[styles.modeDescription, comingSoon && styles.comingSoonDescription]}>
					{description}
				</Text>
			</View>
			{!comingSoon && (
				<MaterialIcons 
					name="chevron-right" 
					size={24} 
					color="#666" 
					style={styles.chevron}
				/>
			)}
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

	return (
		<ScrollView style={styles.container}>
			<Text
				style={[
					tw`text-center font-bold text-white my-4 mt-8 shadow-lg`,
					{
						backgroundColor: "#419E68",
						fontSize: 36,
						marginHorizontal: "-10%",
					},
				]}
			>
				Game Modes
			</Text>
			
			<View style={styles.content}>
				<Text style={styles.subtitle}>
					Choose your training mode to get started
				</Text>

				<View style={styles.modesContainer}>
					<GameModeCard
						title="Hit Mode"
						description="Configure hit detection, timing, and duration settings for reaction training"
						icon={
							<MaterialIcons 
								name="sports-martial-arts" 
								size={48} 
								color="#419E68" 
							/>
						}
						onPress={handleHitModePress}
					/>

					<GameModeCard
						title="Pattern Mode"
						description="Create custom light patterns and sequences for advanced training routines"
						icon={
							<FontAwesome5 
								name="project-diagram" 
								size={48} 
								color="#FFA500" 
							/>
						}
						onPress={handlePatternModePress}
					/>
				</View>

				<View style={styles.infoSection}>
					<Text style={styles.infoTitle}>Getting Started</Text>
					<Text style={styles.infoText}>
						• Connect your Flexipad devices from the Settings tab
					</Text>
					<Text style={styles.infoText}>
						• Choose a training mode above
					</Text>
					<Text style={styles.infoText}>
						• Configure your preferred settings
					</Text>
					<Text style={styles.infoText}>
						• Start training!
					</Text>
				</View>
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#eaf7ff",
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 20,
	},
	subtitle: {
		fontSize: 18,
		color: "#666",
		textAlign: "center",
		marginBottom: 30,
		fontWeight: "500",
	},
	modesContainer: {
		marginBottom: 40,
	},
	modeCard: {
		backgroundColor: "#ffffff",
		borderRadius: 15,
		padding: 20,
		marginBottom: 20,
		flexDirection: "row",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		borderWidth: 1,
		borderColor: "#e0e0e0",
	},
	comingSoonCard: {
		opacity: 0.7,
		backgroundColor: "#f8f8f8",
	},
	iconContainer: {
		position: "relative",
		marginRight: 15,
		width: 60,
		height: 60,
		justifyContent: "center",
		alignItems: "center",
	},
	comingSoonBadge: {
		position: "absolute",
		top: -5,
		right: -5,
		backgroundColor: "#FFA500",
		borderRadius: 10,
		paddingHorizontal: 6,
		paddingVertical: 2,
	},
	comingSoonText: {
		color: "white",
		fontSize: 10,
		fontWeight: "bold",
	},
	textContainer: {
		flex: 1,
		marginRight: 10,
	},
	modeTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 5,
	},
	comingSoonTitle: {
		color: "#888",
	},
	modeDescription: {
		fontSize: 14,
		color: "#666",
		lineHeight: 20,
	},
	comingSoonDescription: {
		color: "#aaa",
	},
	chevron: {
		marginLeft: "auto",
	},
	infoSection: {
		backgroundColor: "#f0f8ff",
		borderRadius: 10,
		padding: 20,
		marginBottom: 20,
	},
	infoTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 15,
	},
	infoText: {
		fontSize: 14,
		color: "#555",
		marginBottom: 8,
		lineHeight: 18,
	},
});

export default HomeScreen;