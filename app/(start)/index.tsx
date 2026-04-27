import { useConnection } from "@/hooks/useConnection";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View, Image, Text, TouchableOpacity, ActivityIndicator } from "react-native";

export default function StartScreen() {
	const router = useRouter();
	const { isConnectionActive, connect } = useConnection();

	// Navigate to Assistant screen when we have the connection details.
	useEffect(() => {
		if (isConnectionActive) {
			router.navigate("../assistant");
		}
	}, [isConnectionActive, router]);

	let connectText: string;

	if (isConnectionActive) {
		connectText = "Connecting...";
	} else {
		connectText = "Ready to assist";
	}

	return (
		<View style={styles.container}>
			{/* <Image style={styles.logo} source={require("../../assets/images/start-logo.png")} />
			<Text style={styles.text}>Chat live with radium voice AI agent</Text> */}

			<TouchableOpacity
				onPress={() => {
					connect();
				}}
				style={styles.button}
				activeOpacity={0.7}
				disabled={isConnectionActive} // Disable button while loading
			>
				{isConnectionActive ? (
					<ActivityIndicator size="large" color="#ffffff" style={styles.activityIndicator} />
				) : (
					<Image style={styles.logo} source={require("../../assets/images/start-logo.png")} />
				)}
			</TouchableOpacity>

			<Text style={styles.buttonText}>{connectText}</Text>
			<Text
				style={{
					...styles.buttonText,
					fontWeight: 300,
					letterSpacing: 0,
					fontSize: 12,
					marginTop: 10,
					color: "#e2e2e2",
				}}
			>
				Tap to start a conversation
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	logo: {
		width: 59,
		height: 56,
		// marginBottom: 16,
	},
	text: {
		color: "#ffffff",
		marginBottom: 24,
	},
	activityIndicator: {
		// marginEnd: 8,
		width: 59,
		height: 56,
	},
	button: {
		flexDirection: "row",
		backgroundColor: "#002CF2",
		padding: 30,
		borderRadius: 999,
		alignItems: "center",
		justifyContent: "center",
		// minWidth: 10, // Ensure button has a minimum width when loading
	},
	buttonText: {
		letterSpacing: 0.5,
		marginTop: 25,
		fontSize: 20,
		color: "#ffffff",
		fontWeight: 600,
	},
});
