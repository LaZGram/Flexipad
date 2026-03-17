import * as React from "react";
import {
	StyleSheet,
	Text,
	View,
	TouchableOpacity,
	FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBleManager } from "../../components/context/blecontext";
import { CHARACTERISTIC } from "@/enum/characteristic";
import { base64toDecManu } from "@/util/encode";
import tw from "twrnc";
import { hexToBase64 } from "@/util/encode";
import { MaterialIcons } from "@expo/vector-icons";
import { Device } from "react-native-ble-plx";

// Define the type for the module state
type ConnectedDevice = Device | null;

export default function Home() {
	const [isModalVisible, setIsModalVisible] = React.useState(false);
	const [modalContent, setModalContent] = React.useState("");
	const { connectedDevice, writeCharacteristic } = useBleManager();
	// const blemanager = new BleManager();
	const [module, setModule] = React.useState<ConnectedDevice[]>([]);
	const [selectedModule, setSelectedModule] = React.useState<number | null>(
		null
	);
	const [isCalibrating, setIsCalibrating] = React.useState(false);
	const isCalibratingRef = React.useRef(isCalibrating);
	React.useEffect(() => {
		const moduleTemp: ConnectedDevice[] = [];
		for (let i = 0; i < connectedDevice.length; i++) {
			moduleTemp.push(connectedDevice[i]?.device as Device);
		}
		setModule(moduleTemp);
	}, [connectedDevice]);
	const blink = async (device: Device) => {
		let redLight = true;
		const redColor = "/wAB";
		const blueColor = "AAD/";
		for (let i = 0; i < 10; i++) {
			await writeCharacteristic(
				device,
				CHARACTERISTIC.LED,
				redLight ? redColor : blueColor
			);
			redLight = !redLight;
			await new Promise((resolve) => setTimeout(resolve, 10));
		}
		//turn off the led light
		await writeCharacteristic(device, CHARACTERISTIC.LED, "AAAA");
	};

	const oneBlink = async (device: Device) => {
		const startTime = Date.now();
		
		try {
			let totalOnDelay = 0;
			let totalOffDelay = 0;
			
			// Repeat 100 times
			for (let i = 0; i < 100; i++) {
				
				// Turn on red LED
				const commandSentTime = Date.now();
				await writeCharacteristic(device, CHARACTERISTIC.LED, "/wAB");
				const commandCompleteTime = Date.now();
				const commandDelay = commandCompleteTime - commandSentTime;
				totalOnDelay += commandDelay;
				
				// Wait 1000ms
				await new Promise((resolve) => setTimeout(resolve, 1000));
				
				// Turn off LED
				const offCommandSentTime = Date.now();
				await writeCharacteristic(device, CHARACTERISTIC.LED, "AAAA");
				const offCommandCompleteTime = Date.now();
				const offCommandDelay = offCommandCompleteTime - offCommandSentTime;
				totalOffDelay += offCommandDelay;
			}
			
			const totalTime = Date.now() - startTime;
			const averageOnDelay = totalOnDelay / 100;
			const averageOffDelay = totalOffDelay / 100;
			const averageDelay = (totalOnDelay + totalOffDelay) / 200;
		} catch (error) {

		}
	};
	const hit = async (device: Device) => {
		try {
			// Turn on red LED
			await writeCharacteristic(device, CHARACTERISTIC.LED, "/wAB");
			const lightOnTime = Date.now();
			console.log(`[${lightOnTime}] ✓ Red LED ON - Waiting for your hit...`);
			
			// Find the connected device wrapper to access button monitoring
			const deviceWrapper = connectedDevice.find(d => d?.device.id === device.id);
			if (!deviceWrapper) {
				await writeCharacteristic(device, CHARACTERISTIC.LED, "AAAA");
				return;
			}
			
			// Wait for button press
			const buttonPressed = await new Promise<boolean>((resolve) => {
				let previousState = deviceWrapper.button;
				const checkInterval = setInterval(() => {
					const currentState = deviceWrapper.button;
					// Detect rising edge (button was released, now pressed)
					if (currentState && !previousState) {
						clearInterval(checkInterval);
						resolve(true);
					}
					previousState = currentState;
				}, 10); // Check every 10ms for fast response
				
				// Timeout after 30 seconds
				setTimeout(() => {
					clearInterval(checkInterval);
					resolve(false);
				}, 30000);
			});
			
			const hitTime = Date.now();
			
			// Turn off LED
			await writeCharacteristic(device, CHARACTERISTIC.LED, "AAAA");
			
			if (buttonPressed) {
				const reactionTime = hitTime - lightOnTime;

			} else {
			}
		} catch (error) {
			// Make sure to turn off LED on error
			await writeCharacteristic(device, CHARACTERISTIC.LED, "AAAA");
		}
	};
	const playMusic = async (device: Device) => {
		await writeCharacteristic(
			device, // Correct: pass Device object
			CHARACTERISTIC.MUSIC, // Correct: characteristic first
			hexToBase64("616161")
		);
		await new Promise((resolve) => setTimeout(resolve, 10));
		await writeCharacteristic(device, CHARACTERISTIC.MUSIC, hexToBase64("0"));
	};

	const DeviceCard = ({
		device,
		pad_no,
	}: {
		device: Device;
		pad_no: number;
	}) => (
		<View style={styles.cardcontainer}>
			<View style={styles.left}>
				<View style={styles.iconAndButton}>
					<MaterialIcons name="wb-twilight" size={70} color="black" />
					<TouchableOpacity
						style={styles.blinkbuttonBelow}
						onPress={async () => await blink(device)}
					>
						<Text style={{ color: "#EDEEF1" }}>กะพริบ</Text>
					</TouchableOpacity>
					{/* <TouchableOpacity
						style={styles.oneBlinkButtonBelow}
						onPress={async () => await oneBlink(device)}
					>
						<Text style={{ color: "#EDEEF1" }}>One Blink</Text>
					</TouchableOpacity> */}
					{/* <TouchableOpacity
						style={styles.hitButtonBelow}
						onPress={async () => await hit(device)}
					>
						<Text style={{ color: "#EDEEF1" }}>Hit</Text>
					</TouchableOpacity> */}
					<TouchableOpacity
						style={styles.identify_buttonBelow}
						onPress={async () => await playMusic(device)}
					>
						<Text style={{ color: "#EDEEF1" }}>เสียง</Text>
					</TouchableOpacity>
				</View>
			</View>
			<View style={styles.right}>
				<Text style={styles.Normal_text}>ปุ่มกดหมายเลข : {pad_no + 1}</Text>
				<Text style={styles.Normal_text}>รหัส : {device.id}</Text>
				{/* <Text
					style={[tw`text-sm`, styles.defaultBatteryText, styles.Normal_text]}
				>
					Battery Percentage:{" "}
					{device?.manufacturerData
						? `${base64toDecManu(device?.manufacturerData).toFixed(2)} V`
						: "N/A"}
				</Text> */}
			</View>
		</View>
	);

	return (
		<SafeAreaView style={styles.container}>
			<Text
				style={[
					tw`text-center font-bold text-white my-4 mt-2 shadow-lg`,
					{ backgroundColor: "#4e54a3", fontSize: 36 },
				]}
			>
				Devices
			</Text>
			<View style={tw`bg-white shadow-lg`}>
				<Text style={tw`text-lg font-bold text-black rounded-lg p-2 `}>
					อุปกรณ์ที่เชื่อมต่อ
				</Text>
			</View>
			<FlatList
				data={connectedDevice.filter((d) => d != null)}
				keyExtractor={(item, index) =>
					item ? item.device.id : `null-${index}`
				}
				renderItem={({ item, index }) =>
					item && <DeviceCard device={item.device} pad_no={index} />
				}
				ListEmptyComponent={
					<Text style={tw`mx-4 my-2`}>ไม่มีอุปกรณ์เชื่อมต่อ</Text>
				}
			/>
			<View style={styles.footer}></View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#ffffff",
	},
	footer: {
		padding: 10,
		backgroundColor: "#ffffff",
		flexDirection: "row",
		justifyContent: "space-around",
	},
	cardcontainer: {
		marginTop: 5,
		padding: 15,
		backgroundColor: "#fff",
		marginBottom: 10,
		borderRadius: 5,
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 4,
		elevation: 2,
		flexDirection: "row",
	},
	cardcontent: {
		flexDirection: "column",
	},
	blinkbutton: {
		backgroundColor: "#e0e0e0",
		paddingHorizontal: 16,
		paddingVertical: 6,
		borderRadius: 12,
		position: "absolute",
		marginRight: -100,
		marginTop: 40,
	},
	defaultBatteryText: {
		color: "#4CAF50",
	},
	left: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	right: {
		flex: 1,
	},
	iconAndButton: {
		flexDirection: "column", // จัดเรียงแนวตั้ง
		alignItems: "center", // จัดกึ่งกลางแนวนอน
		gap: 10, // ระยะห่างระหว่าง icon กับปุ่ม
	},
	blinkbuttonBelow: {
		backgroundColor: "#4e54a3",
		paddingHorizontal: 16,
		paddingVertical: 3,
		borderRadius: 12,
		marginTop: "-3%",
	},
	oneBlinkButtonBelow: {
		backgroundColor: "#6c757d",
		paddingHorizontal: 16,
		paddingVertical: 3,
		borderRadius: 12,
		marginTop: "-3%",
	},
	hitButtonBelow: {
		backgroundColor: "#28a745",
		paddingHorizontal: 16,
		paddingVertical: 3,
		borderRadius: 12,
		marginTop: "-3%",
	},
	identify_buttonBelow: {
		backgroundColor: "#ff0000",
		paddingHorizontal: 16,
		paddingVertical: 3,
		borderRadius: 12,
		marginTop: "-3%",
	},
	Normal_text: {
		marginVertical: "8%",
		fontSize: 16,
	},
});
