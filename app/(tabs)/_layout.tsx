import React from "react";
import { ModuleContextProvider } from "../../components/context/context";
import { Tabs } from "expo-router";
import { FontAwesome5, FontAwesome } from "@expo/vector-icons";
import { IconPositionProvider } from "../../components/IconPositionContext";

export default function TabLayout() {
	return (
		<IconPositionProvider>
			<ModuleContextProvider>
				<Tabs
					screenOptions={({ route }) => {
						// Hide certain tabs by route name (e.g., "ble")
						const showedTabs = ["connection", "setting", "home"];
						const isShowed = showedTabs.includes(route.name);

						return {
						tabBarActiveTintColor: "#2f95dc",
						tabBarInactiveTintColor: "gray",
						tabBarStyle: { backgroundColor: "#fff" },
						headerShown: false,
						tabBarItemStyle: {
							display: isShowed ? "flex" : "none",
						},
						};
					}}
				>
						<Tabs.Screen
							name="home"
							options={{
								tabBarLabel: "หน้าหลัก",
								tabBarIcon: ({ color, size }) => (
									<FontAwesome name="home" size={size} color={color} />
								),
							}}
						/>
						<Tabs.Screen
							name="connection"
							options={{
								tabBarLabel: "อุปกรณ์",
								tabBarIcon: ({ color, size }) => (
									<FontAwesome5 name="bluetooth" size={size} color={color} />
								),
							}}
						/>
						<Tabs.Screen
							name="Mode"
							options={{
								tabBarLabel: "Hit Mode",
								tabBarIcon: ({ color, size }) => (
									<FontAwesome5 name="running" size={size} color={color} />
								),
							}}
						/>
						<Tabs.Screen
							name="setting"
							options={{
								tabBarLabel: "การตั้งค่า",
								tabBarIcon: ({ color, size }) => (
									<FontAwesome5 name="cog" size={size} color={color} />
								),
							}}
						/>
						<Tabs.Screen
							name="start"
							options={{
								tabBarLabel: "Start",
								tabBarIcon: ({ color, size }) => (
									<FontAwesome
										name="hourglass-start"
										size={size}
										color={color}
									/>
								),
							}}
						/>
					</Tabs>
				</ModuleContextProvider>
			</IconPositionProvider>
	);
}
