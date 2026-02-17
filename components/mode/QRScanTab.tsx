import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Modal } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import QRScannerModal from "./qr/QRScannerModal";
import ConfigPreviewModal from "./qr/ConfigPreviewModal";
import { QRConfigValidator, QRConfigConverter } from "./qr/validator";
import { QRConfigurationData } from "./qr/types";
import { LightOutData, LightDelayData, DurationData, RoundPadData } from "./types";
import { ApiService, HitTemplate } from "@/services/api.service";

interface QRScanTabProps {
	onScanPress: () => void;
	onConfigImport: (
		lightOutData: LightOutData,
		lightDelayData: LightDelayData,
		durationData: DurationData,
		metadata: any,
		roundPads?: RoundPadData[]
	) => void;
}

const QRScanTab: React.FC<QRScanTabProps> = ({ onScanPress, onConfigImport }) => {
	const [showScanner, setShowScanner] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const [scannedConfig, setScannedConfig] = useState<QRConfigurationData | null>(null);
	const [lastScanResult, setLastScanResult] = useState<string | null>(null);
	
	// Template selection state
	const [templates, setTemplates] = useState<HitTemplate[]>([]);
	const [loadingTemplates, setLoadingTemplates] = useState(true);
	const [templatesError, setTemplatesError] = useState<string | null>(null);
	const [selectedTemplate, setSelectedTemplate] = useState<HitTemplate | null>(null);
	const [showDetailsModal, setShowDetailsModal] = useState(false);

	useEffect(() => {
		fetchTemplates();
	}, []);

	const fetchTemplates = async () => {
		try {
			setLoadingTemplates(true);
			setTemplatesError(null);
			const data = await ApiService.getHitModeTemplates();
			console.log('📦 Hit mode templates fetched from API:', JSON.stringify(data, null, 2));
			setTemplates(data);
		} catch (error) {
			console.error('Error fetching hit mode templates:', error);
			setTemplatesError('ไม่สามารถโหลดเทมเพลตจากเซิร์ฟเวอร์ได้');
			
			// Fallback to example template
			const fallbackTemplates: HitTemplate[] = [{
				_id: 'example-1',
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
						hitCount: 5
					},
					roundPads: [
						{ round: 1, pad: 1 },
						{ round: 2, pad: 1 },
						{ round: 3, pad: 1 },
						{ round: 4, pad: 1 },
						{ round: 5, pad: 2 }
					]
				},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			}];
			console.log('📦 Using fallback template');
			setTemplates(fallbackTemplates);
		} finally {
			setLoadingTemplates(false);
		}
	};

	const handleTemplateClick = (template: HitTemplate) => {
		console.log('🔍 Template clicked:', JSON.stringify(template, null, 2));
		setSelectedTemplate(template);
		setShowDetailsModal(true);
	};

	const handleSelectTemplate = () => {
		if (!selectedTemplate) return;

		// Convert template to QRConfigurationData format
		const configData: QRConfigurationData = {
			version: selectedTemplate.version,
			type: selectedTemplate.type,
			metadata: selectedTemplate.metadata,
			configuration: selectedTemplate.configuration
		};

		// Validate configuration
		const validation = QRConfigValidator.validateConfiguration(configData);

		if (!validation.isValid) {
			const errorMessages = validation.errors.map(error => `• ${error.message}`).join('\n');
			Alert.alert(
				'เทมเพลตไม่ถูกต้อง',
				`เทมเพลตมีข้อมูลการตั้งค่าที่ไม่ถูกต้อง:\n\n${errorMessages}`,
				[{ text: 'ตกลง' }]
			);
			return;
		}

		try {
			// Convert to app format
			const { lightOutData, lightDelayData, durationData, roundPads } = QRConfigConverter.convertToAppFormat(configData);
			
			// Import the configuration
			onConfigImport(lightOutData, lightDelayData, durationData, configData.metadata, roundPads);
			
			// Close modal
			setShowDetailsModal(false);
			
			// Show success message
			Alert.alert(
				'นำเข้าการตั้งค่าสำเร็จ',
				`นำเข้าการตั้งค่า "${selectedTemplate.metadata.name}" สำเร็จแล้ว ไปที่แท็บตั้งค่าด้วยตนเองเพื่อดูค่าที่นำเข้า`,
				[{ text: 'ตกลง' }]
			);
		} catch (error) {
			Alert.alert(
				'ข้อผิดพลาดในการนำเข้า',
				'ไม่สามารถนำเข้าเทมเพลตได้ กรุณาลองใหม่อีกครั้ง',
				[{ text: 'ตกลง' }]
			);
		}
	};

	const handleScanPress = () => {
		setShowScanner(true);
		onScanPress();
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
					'QR Code ไม่ถูกต้อง',
					`QR code ที่สแกนมีข้อมูลการตั้งค่าที่ไม่ถูกต้อง:\n\n${errorMessages}`,
					[{ text: 'ตกลง' }]
				);
				return;
			}

			// Show warnings if any (but still allow import)
			if (validation.warnings.length > 0) {
				const warningMessages = validation.warnings.map(warning => `• ${warning.message}`).join('\n');
				Alert.alert(
					'คำเตือนการตั้งค่า',
					`การตั้งค่ามีคำเตือนบางประการ:\n\n${warningMessages}\n\nคุณยังสามารถนำเข้าการตั้งค่านี้ได้`,
					[
						{ text: 'ยกเลิก', style: 'cancel' },
						{ text: 'ดำเนินการต่อ', onPress: () => showConfigPreview(parsedData) }
					]
				);
			} else {
				showConfigPreview(parsedData);
			}

		} catch (error) {
			Alert.alert(
				'QR Code ไม่ถูกต้อง',
				'QR code ที่สแกนไม่มีข้อมูล JSON ที่ถูกต้อง กรุณาสแกน QR code การตั้งค่าที่ถูกต้อง',
				[{ text: 'ตกลง' }]
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
			const { lightOutData, lightDelayData, durationData, roundPads } = QRConfigConverter.convertToAppFormat(scannedConfig);
			
			// Import the configuration
			onConfigImport(lightOutData, lightDelayData, durationData, scannedConfig.metadata, roundPads);
			
			// Close preview modal
			setShowPreview(false);
			setScannedConfig(null);
			
			// Show success message
			Alert.alert(
				'นำเข้าการตั้งค่าสำเร็จ',
				`นำเข้าการตั้งค่า "${scannedConfig.metadata.name || 'configuration'}" สำเร็จแล้ว ไปที่แท็บตั้งค่าด้วยตนเองเพื่อดูค่าที่นำเข้า`,
				[{ text: 'ตกลง' }]
			);

		} catch (error) {
			Alert.alert(
				'ข้อผิดพลาดในการนำเข้า',
				'ไม่สามารถนำเข้าการตั้งค่าได้ กรุณาลองใหม่อีกครั้ง',
				[{ text: 'ตกลง' }]
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
					hitCount: 5
				},
				roundPads: [
					{ round: 1, pad: 1 },
					{ round: 2, pad: 1 },
					{ round: 3, pad: 1 },
					{ round: 4, pad: 1 },
					{ round: 5, pad: 2 }
				]
			}
		};

		const jsonString = JSON.stringify(exampleConfig, null, 2);
		
		Alert.alert(
			'ตัวอย่างข้อมูล QR',
			'นี่คือตัวอย่าง JSON การตั้งค่าที่คุณสามารถใช้สร้าง QR code เพื่อทดสอบ:',
			[
				{ text: 'คัดลอกไปยังคลิปบอร์ด', onPress: () => {
					// In a real app, you'd use Clipboard.setString(jsonString)
					console.log('Example QR JSON:', jsonString);
				}},
				{ text: 'ทดสอบการนำเข้า', onPress: () => handleQRScanned(jsonString) },
				{ text: 'ยกเลิก' }
			]
		);
	};

	return (
		<>
			<View style={styles.container}>
				<View style={styles.content}>

					{/* Loading State */}
					{loadingTemplates && (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="large" color="#419E68" />
						<Text style={styles.loadingText}>กำลังโหลดเทมเพลต...</Text>
						</View>
					)}

					{/* Error State */}
					{!loadingTemplates && templatesError && (
						<View style={styles.errorContainer}>
							<MaterialIcons name="error-outline" size={32} color="#f44336" />
							<Text style={styles.errorText}>{templatesError}</Text>
							<TouchableOpacity style={styles.retryButton} onPress={fetchTemplates}>
							<Text style={styles.retryButtonText}>ลองใหม่</Text>
							</TouchableOpacity>
						</View>
					)}

					{/* Templates List */}
					{!loadingTemplates && templates.length > 0 && (
						<ScrollView style={styles.templatesList} showsVerticalScrollIndicator={false}>
							{templates.map((template) => (
								<TouchableOpacity
									key={template._id}
									style={styles.templateCard}
									onPress={() => handleTemplateClick(template)}
								>
									<View style={styles.templateHeader}>
										<Text style={styles.templateName}>{template.metadata.name}</Text>
										<MaterialIcons name="arrow-forward-ios" size={20} color="#419E68" />
									</View>
									<Text style={styles.templateDescription} numberOfLines={2}>
										{template.metadata.description}
									</Text>
									<View style={styles.templateMeta}>
										<Text style={styles.templateMetaText}>
										โดย {template.metadata.created_by}
										</Text>
										<Text style={styles.templateMetaText}>
											{new Date(template.metadata.created_at).toLocaleDateString()}
										</Text>
									</View>
								</TouchableOpacity>
							))}
						</ScrollView>
					)}

				</View>
			</View>

			{/* Template Details Modal */}
			<Modal
				visible={showDetailsModal}
				transparent
				animationType="fade"
				onRequestClose={() => setShowDetailsModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>{selectedTemplate?.metadata.name}</Text>
							<TouchableOpacity onPress={() => setShowDetailsModal(false)}>
								<MaterialIcons name="close" size={24} color="#666" />
							</TouchableOpacity>
						</View>

						<ScrollView style={styles.modalBody}>
							<View style={styles.detailSection}>
							<Text style={styles.detailLabel}>คำอธิบาย</Text>
							<Text style={styles.detailValue}>{selectedTemplate?.metadata.description}</Text>
						</View>

						<View style={styles.detailSection}>
							<Text style={styles.detailLabel}>การตั้งค่า</Text>
								<View style={styles.detailRow}>
								<Text style={styles.detailKey}>โหมดไฟดับ:</Text>
								<Text style={styles.detailText}>{selectedTemplate?.configuration.lightOut.mode}</Text>
							</View>
							
							{selectedTemplate?.configuration.lightOut.hitCount && (
								<View style={styles.detailRow}>
									<Text style={styles.detailKey}>จำนวนครั้ง:</Text>
									<Text style={styles.detailText}>{selectedTemplate.configuration.lightOut.hitCount}</Text>
								</View>
							)}

							<View style={styles.detailRow}>
								<Text style={styles.detailKey}>โหมดหน่วงเวลา:</Text>
								<Text style={styles.detailText}>{selectedTemplate?.configuration.lightDelay.mode}</Text>
							</View>

							{selectedTemplate?.configuration.lightDelay.delayTime && (
								<View style={styles.detailRow}>
									<Text style={styles.detailKey}>เวลาหน่วง:</Text>
									<Text style={styles.detailText}>{selectedTemplate.configuration.lightDelay.delayTime}s</Text>
								</View>
							)}

							<View style={styles.detailRow}>
								<Text style={styles.detailKey}>โหมดระยะเวลา:</Text>
								<Text style={styles.detailText}>{selectedTemplate?.configuration.duration.mode}</Text>
							</View>

							{selectedTemplate?.configuration.duration.hitCount && (
								<View style={styles.detailRow}>
									<Text style={styles.detailKey}>จำนวนครั้งทั้งหมด:</Text>
									</View>
								)}

								{selectedTemplate?.configuration.roundPads && selectedTemplate.configuration.roundPads.length > 0 && (
									<View style={styles.detailSection}>
									<Text style={styles.detailLabel}>แผ่นกดแต่ละรอบ</Text>
									{selectedTemplate.configuration.roundPads.map((rp, index) => (
										<View key={index} style={styles.detailRow}>
											<Text style={styles.detailKey}>รอบที่ {rp.round}:</Text>
											<Text style={styles.detailText}>แผ่นที่ {rp.pad}</Text>
											</View>
										))}
									</View>
								)}
							</View>

							<View style={styles.detailSection}>
							<Text style={styles.detailLabel}>สร้างโดย</Text>
								<Text style={styles.detailValue}>{selectedTemplate?.metadata.created_by}</Text>
								<Text style={styles.detailSubValue}>
									{selectedTemplate && new Date(selectedTemplate.metadata.created_at).toLocaleString()}
								</Text>
							</View>
						</ScrollView>

						<View style={styles.modalFooter}>
							<TouchableOpacity
								style={styles.cancelButton}
								onPress={() => setShowDetailsModal(false)}
							>
							<Text style={styles.cancelButtonText}>ยกเลิก</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.selectButton}
							onPress={handleSelectTemplate}
						>
							{/* <MaterialIcons name="check" size={20} color="#fff" /> */}
							<Text style={styles.selectButtonText}>เลือกเทมเพลต</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

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
		paddingVertical: 20,
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
	loadingContainer: {
		padding: 40,
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 12,
		fontSize: 14,
		color: '#666',
	},
	errorContainer: {
		padding: 20,
		alignItems: 'center',
		backgroundColor: '#fff5f5',
		borderRadius: 10,
		marginBottom: 20,
	},
	errorText: {
		marginTop: 8,
		fontSize: 14,
		color: '#f44336',
		textAlign: 'center',
	},
	retryButton: {
		marginTop: 12,
		backgroundColor: '#419E68',
		paddingHorizontal: 20,
		paddingVertical: 8,
		borderRadius: 8,
	},
	retryButtonText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: 'bold',
	},
	templatesList: {
		width: '100%',
		maxHeight: 400,
		marginBottom: 20,
	},
	templateCard: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: '#e0e0e0',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	templateHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	templateName: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
		flex: 1,
	},
	templateDescription: {
		fontSize: 14,
		color: '#666',
		marginBottom: 8,
		lineHeight: 20,
	},
	templateMeta: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	templateMetaText: {
		fontSize: 12,
		color: '#999',
	},
	divider: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 20,
		width: '100%',
	},
	dividerLine: {
		flex: 1,
		height: 1,
		backgroundColor: '#ddd',
	},
	dividerText: {
		marginHorizontal: 16,
		fontSize: 14,
		color: '#999',
		fontWeight: 'bold',
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
		marginBottom: 20,
	},
	scanButtonText: {
		color: "#ffffff",
		fontSize: 18,
		fontWeight: "bold",
		marginLeft: 10,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		backgroundColor: '#fff',
		borderRadius: 16,
		width: '90%',
		maxHeight: '80%',
		overflow: 'hidden',
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#e0e0e0',
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#333',
		flex: 1,
	},
	modalBody: {
		padding: 20,
	},
	detailSection: {
		marginBottom: 20,
	},
	detailLabel: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 8,
	},
	detailValue: {
		fontSize: 14,
		color: '#666',
		lineHeight: 20,
	},
	detailSubValue: {
		fontSize: 12,
		color: '#999',
		marginTop: 4,
	},
	detailRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: 6,
		borderBottomWidth: 1,
		borderBottomColor: '#f0f0f0',
	},
	detailKey: {
		fontSize: 14,
		color: '#666',
		flex: 1,
	},
	detailText: {
		fontSize: 14,
		color: '#333',
		fontWeight: '500',
	},
	modalFooter: {
		flexDirection: 'row',
		padding: 16,
		borderTopWidth: 1,
		borderTopColor: '#e0e0e0',
		gap: 12,
	},
	cancelButton: {
		flex: 1,
		backgroundColor: '#f5f5f5',
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	cancelButtonText: {
		color: '#666',
		fontSize: 16,
		fontWeight: 'bold',
	},
	selectButton: {
		flex: 1,
		backgroundColor: '#419E68',
		paddingVertical: 12,
		borderRadius: 8,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
	},
	selectButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
});

export default QRScanTab;