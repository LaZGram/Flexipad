import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import QRScannerModal from "./qr/QRScannerModal";
import ConfigPreviewModal from "./qr/ConfigPreviewModal";
import { QRConfigValidator, QRConfigConverter } from "./qr/validator";
import { QRConfigurationData } from "./qr/types";
import { LightOutData, LightDelayData, DurationData } from "./types";

interface QRScanTabProps {
	onScanPress: () => void;
	onConfigImport: (
		lightOutData: LightOutData,
		lightDelayData: LightDelayData,
		durationData: DurationData,
		metadata: any
	) => void;
}

const QRScanTab: React.FC<QRScanTabProps> = ({ onScanPress, onConfigImport }) => {
	const [showScanner, setShowScanner] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const [scannedConfig, setScannedConfig] = useState<QRConfigurationData | null>(null);
	const [lastScanResult, setLastScanResult] = useState<string | null>(null);

	const handleScanPress = () => {
		setShowScanner(true);
		onScanPress(); // Keep original callback for compatibility
	};

	const handleQRScanned = (data: string) => {
		setShowScanner(false);
		setLastScanResult(data);
		
		try {
			// Parse JSON
			const parsedData = JSON.parse(data);
			
			// Validate configuration
			const validation = QRConfigValidator.validateConfiguration(parsedData);
			
			if (!validation.isValid) {
				// Show validation errors
				const errorMessages = validation.errors.map(error => `• ${error.message}`).join('\n');
				Alert.alert(
					'Invalid QR Code',
					`The scanned QR code contains invalid configuration data:\n\n${errorMessages}`,
					[{ text: 'OK' }]
				);
				return;
			}

			// Show warnings if any (but still allow import)
			if (validation.warnings.length > 0) {
				const warningMessages = validation.warnings.map(warning => `• ${warning.message}`).join('\n');
				Alert.alert(
					'Configuration Warnings',
					`The configuration has some warnings:\n\n${warningMessages}\n\nYou can still import this configuration.`,
					[
						{ text: 'Cancel', style: 'cancel' },
						{ text: 'Continue', onPress: () => showConfigPreview(parsedData) }
					]
				);
			} else {
				showConfigPreview(parsedData);
			}

		} catch (error) {
			Alert.alert(
				'Invalid QR Code',
				'The scanned QR code does not contain valid JSON data. Please scan a valid configuration QR code.',
				[{ text: 'OK' }]
			);
		}
	};

	const showConfigPreview = (configData: QRConfigurationData) => {
		setScannedConfig(configData);
		setShowPreview(true);
	};

	const handleConfigConfirm = () => {
		if (!scannedConfig) return;

		try {
			// Convert QR config to app format
			const { lightOutData, lightDelayData, durationData } = QRConfigConverter.convertToAppFormat(scannedConfig);
			
			// Import the configuration
			onConfigImport(lightOutData, lightDelayData, durationData, scannedConfig.metadata);
			
			// Close preview modal
			setShowPreview(false);
			setScannedConfig(null);
			
			// Show success message
			Alert.alert(
				'Configuration Imported',
				`Successfully imported "${scannedConfig.metadata.name || 'configuration'}" settings. Switch to Manual Setup tab to see the imported values.`,
				[{ text: 'OK' }]
			);

		} catch (error) {
			Alert.alert(
				'Import Error',
				'Failed to import configuration. Please try again.',
				[{ text: 'OK' }]
			);
		}
	};

	const handleConfigReject = () => {
		setShowPreview(false);
		setScannedConfig(null);
	};

	const handleGenerateExampleQR = () => {
		// For testing purposes - generate example QR data
		const exampleConfig = {
			version: "1.0.0",
			type: "hit_mode_config",
			metadata: {
				name: "Example Quick Training",
				description: "Fast reaction training session",
				created_at: new Date().toISOString(),
				created_by: "Demo"
			},
			configuration: {
				lightOut: {
					mode: "Hit",
					hitCount: 5
				},
				lightDelay: {
					mode: "Fixed",
					delayTime: 0.5
				},
				duration: {
					mode: "Hit",
					hitCount: 10
				}
			}
		};

		const jsonString = JSON.stringify(exampleConfig, null, 2);
		
		Alert.alert(
			'Example QR Data',
			'Here\'s an example configuration JSON that you can use to generate a QR code for testing:',
			[
				{ text: 'Copy to Clipboard', onPress: () => {
					// In a real app, you'd use Clipboard.setString(jsonString)
					console.log('Example QR JSON:', jsonString);
				}},
				{ text: 'Test Import', onPress: () => handleQRScanned(jsonString) },
				{ text: 'Cancel' }
			]
		);
	};

	return (
		<>
			<View style={styles.container}>
				<View style={styles.content}>
					<MaterialIcons 
						name="qr-code-scanner" 
						size={80} 
						color="#419E68" 
						style={styles.icon}
					/>
					
					<Text style={styles.title}>
						Import Configuration
					</Text>
					
					<Text style={styles.description}>
						Scan a QR code to import a prepared pattern in JSON format, so you don't have to fill in the fields manually.
					</Text>

					<TouchableOpacity style={styles.scanButton} onPress={handleScanPress}>
						<MaterialIcons name="qr-code-scanner" size={24} color="#ffffff" />
						<Text style={styles.scanButtonText}>
							Scan QR Code
						</Text>
					</TouchableOpacity>

					{/* Test button for development */}
					<TouchableOpacity style={styles.testButton} onPress={handleGenerateExampleQR}>
						<MaterialIcons name="code" size={20} color="#666" />
						<Text style={styles.testButtonText}>
							View Example QR Data
						</Text>
					</TouchableOpacity>

					<View style={styles.infoBox}>
						<Text style={styles.infoTitle}>What can be imported:</Text>
						<Text style={styles.infoText}>• Light out conditions</Text>
						<Text style={styles.infoText}>• Light delay settings</Text>
						<Text style={styles.infoText}>• Duration parameters</Text>
						<Text style={styles.infoText}>• All timing configurations</Text>
					</View>

					{lastScanResult && (
						<View style={styles.lastScanBox}>
							<Text style={styles.lastScanTitle}>Last Scan Result:</Text>
							<Text style={styles.lastScanText} numberOfLines={3}>
								{lastScanResult.length > 100 ? `${lastScanResult.substring(0, 100)}...` : lastScanResult}
							</Text>
						</View>
					)}
				</View>
			</View>

			{/* QR Scanner Modal */}
			<QRScannerModal
				visible={showScanner}
				onClose={() => setShowScanner(false)}
				onScan={handleQRScanned}
			/>

			{/* Config Preview Modal */}
			<ConfigPreviewModal
				visible={showPreview}
				onClose={handleConfigReject}
				onConfirm={handleConfigConfirm}
				onReject={handleConfigReject}
				configData={scannedConfig}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 25,
		paddingTop: 20,
	},
	content: {
		alignItems: "center",
		paddingVertical: 40,
	},
	icon: {
		marginBottom: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 15,
		textAlign: "center",
	},
	description: {
		fontSize: 16,
		color: "#666",
		textAlign: "center",
		lineHeight: 24,
		marginBottom: 30,
		paddingHorizontal: 20,
	},
	scanButton: {
		backgroundColor: "#419E68",
		paddingHorizontal: 30,
		paddingVertical: 15,
		borderRadius: 10,
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
		marginBottom: 30,
	},
	scanButtonText: {
		color: "#ffffff",
		fontSize: 18,
		fontWeight: "bold",
		marginLeft: 10,
	},
	infoBox: {
		backgroundColor: "#f0f8ff",
		borderRadius: 10,
		padding: 20,
		width: "100%",
		borderWidth: 1,
		borderColor: "#e0e8ff",
	},
	infoTitle: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 10,
	},
	infoText: {
		fontSize: 14,
		color: "#666",
		marginBottom: 5,
		lineHeight: 18,
	},
	testButton: {
		backgroundColor: "#f8f8f8",
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 8,
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 20,
		borderWidth: 1,
		borderColor: "#ddd",
	},
	testButtonText: {
		color: "#666",
		fontSize: 14,
		marginLeft: 8,
	},
	lastScanBox: {
		backgroundColor: "#f0f8ff",
		borderRadius: 8,
		padding: 15,
		marginTop: 20,
		borderWidth: 1,
		borderColor: "#e0e8ff",
		width: "100%",
	},
	lastScanTitle: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 8,
	},
	lastScanText: {
		fontSize: 12,
		color: "#666",
		fontFamily: "monospace",
		lineHeight: 16,
	},
});

export default QRScanTab;