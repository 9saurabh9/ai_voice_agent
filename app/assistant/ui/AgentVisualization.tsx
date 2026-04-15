import { CustomVisualizer } from "@/app/components/CustomVisualizer";
import { useAgent } from "@livekit/components-react";
import { BarVisualizer, VideoTrack } from "@livekit/react-native";
import React, { useCallback, useState } from "react";
import { LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle, Text } from "react-native";

type AgentVisualizationProps = {
	style: StyleProp<ViewStyle>;
	isPaused: boolean;
};

type AgentState = "listening" | "thinking" | "speaking" | "idle" | "connecting";

const barSize = 0.1;

const barColor: Record<AgentState, string> = {
	listening: "#1D9E75",
	thinking: "#7F77DD",
	speaking: "#378ADD",
	idle: "#888780",
	connecting: "#FFFFFF",
};

export default function AgentVisualization({ style, isPaused }: AgentVisualizationProps) {
	const { state, microphoneTrack, cameraTrack } = useAgent();
	const [barWidth, setBarWidth] = useState(0);
	const [barBorderRadius, setBarBorderRadius] = useState(0);
	console.log(state);

	const agentState =
		state === "speaking"
			? "speaking"
			: state === "thinking"
			? "thinking"
			: state === "connecting" ||
			  state === "pre-connect-buffering" ||
			  state === "initializing" ||
			  state === "disconnected"
			? "connecting"
			: isPaused
			? "idle"
			: state === "listening"
			? "listening"
			: "idle";
	const agentText = agentState === "idle" ? "Paused" : agentState[0].toUpperCase() + agentState.slice(1);

	const layoutCallback = useCallback((event: LayoutChangeEvent) => {
		const { x, y, width, height } = event.nativeEvent.layout;
		console.log(x, y, width, height);
		setBarWidth(barSize * height);
		setBarBorderRadius(barSize * height);
	}, []);

	let videoView = cameraTrack ? <VideoTrack trackRef={cameraTrack} style={styles.videoTrack} /> : null;
	return (
		<View style={[style, styles.container]}>
			<View style={styles.barVisualizerContainer} onLayout={layoutCallback}>
				<Text style={{ ...styles.buttonText, color: barColor[agentState] }}>{agentText}</Text>
				<BarVisualizer
					state={agentState}
					barCount={5}
					options={{
						minHeight: barSize,
						barWidth: barWidth,
						barColor: "#FFFFFF",
						barBorderRadius: barBorderRadius,
					}}
					trackRef={microphoneTrack}
					style={styles.barVisualizer}
				/>
			</View>
			{videoView}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		justifyContent: "center",
	},
	videoTrack: {
		position: "absolute",
		width: "100%",
		height: "100%",
		zIndex: 1,
	},
	barVisualizerContainer: {
		width: "100%",
		height: "30%",
		zIndex: 0,
	},
	barVisualizer: {
		width: "100%",
		height: "100%",
	},
	buttonText: {
		color: "#ffffff",
		alignSelf: "center",
		fontSize: 20,
		marginBottom: 0,
	},
});
