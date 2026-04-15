import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View, type ViewStyle } from "react-native";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type AgentState = "listening" | "thinking" | "speaking" | "paused";

interface AgentStateVisualizerProps {
	state: AgentState;
	size?: number;
	style?: ViewStyle;
}

// -----------------------------------------------------------------------------
// Theme config per state
// -----------------------------------------------------------------------------

const STATE_CONFIG: Record<
	AgentState,
	{
		label: string;
		orbColor: string;
		ringColor: string;
		outerRingColor: string;
		barColor: string;
	}
> = {
	listening: {
		label: "Listening",
		orbColor: "#1D9E75",
		ringColor: "#5DCAA5",
		outerRingColor: "#9FE1CB",
		barColor: "#ffffff",
	},
	thinking: {
		label: "Thinking",
		orbColor: "#7F77DD",
		ringColor: "#AFA9EC",
		outerRingColor: "#CECBF6",
		barColor: "#ffffff",
	},
	speaking: {
		label: "Speaking",
		orbColor: "#378ADD",
		ringColor: "#85B7EB",
		outerRingColor: "#B5D4F4",
		barColor: "#ffffff",
	},
	paused: {
		label: "Paused",
		orbColor: "#888780",
		ringColor: "#B4B2A9",
		outerRingColor: "#D3D1C7",
		barColor: "#ffffff",
	},
};

// -----------------------------------------------------------------------------
// Animated wave bars — used for Listening & Speaking
// -----------------------------------------------------------------------------

interface WaveBarsProps {
	count?: number;
	color: string;
	/** 'slow' for listening, 'fast' for speaking */
	speed: "slow" | "fast";
	active: boolean;
}

function WaveBars({ count = 5, color, speed, active }: WaveBarsProps) {
	const anims = useRef(Array.from({ length: count }, () => new Animated.Value(0.2))).current;

	useEffect(() => {
		if (!active) {
			anims.forEach((a) => a.setValue(0.2));
			return;
		}

		const duration = speed === "fast" ? 400 : 900;
		const delays = [0, 120, 240, 120, 0];

		const animations = anims.map((anim, i) =>
			Animated.loop(
				Animated.sequence([
					Animated.delay(delays[i] ?? 0),
					Animated.timing(anim, {
						toValue: 1,
						duration: duration / 2,
						easing: Easing.inOut(Easing.sin),
						useNativeDriver: false,
					}),
					Animated.timing(anim, {
						toValue: 0.2,
						duration: duration / 2,
						easing: Easing.inOut(Easing.sin),
						useNativeDriver: false,
					}),
				]),
			),
		);

		animations.forEach((a) => a.start());
		return () => animations.forEach((a) => a.stop());
	}, [active, speed, anims]);

	return (
		<View style={styles.waveBarsContainer}>
			{anims.map((anim, i) => (
				<Animated.View
					key={i}
					style={[
						styles.waveBar,
						{
							backgroundColor: color,
							transform: [{ scaleY: anim }],
						},
					]}
				/>
			))}
		</View>
	);
}

// -----------------------------------------------------------------------------
// Bouncing dots — used for Thinking
// -----------------------------------------------------------------------------

interface DotsProps {
	color: string;
	active: boolean;
}

function ThinkingDots({ color, active }: DotsProps) {
	const anims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

	useEffect(() => {
		if (!active) {
			anims.forEach((a) => a.setValue(0));
			return;
		}

		const animations = anims.map((anim, i) =>
			Animated.loop(
				Animated.sequence([
					Animated.delay(i * 180),
					Animated.timing(anim, {
						toValue: -10,
						duration: 350,
						easing: Easing.out(Easing.quad),
						useNativeDriver: true,
					}),
					Animated.timing(anim, {
						toValue: 0,
						duration: 350,
						easing: Easing.in(Easing.quad),
						useNativeDriver: true,
					}),
					Animated.delay(180 * (2 - i)),
				]),
			),
		);

		animations.forEach((a) => a.start());
		return () => animations.forEach((a) => a.stop());
	}, [active, anims]);

	return (
		<View style={styles.dotsContainer}>
			{anims.map((anim, i) => (
				<Animated.View key={i} style={[styles.dot, { backgroundColor: color, transform: [{ translateY: anim }] }]} />
			))}
		</View>
	);
}

// -----------------------------------------------------------------------------
// Pause icon — two static bars
// -----------------------------------------------------------------------------

function PauseIcon({ color }: { color: string }) {
	return (
		<View style={styles.pauseContainer}>
			<View style={[styles.pauseBar, { backgroundColor: color }]} />
			<View style={[styles.pauseBar, { backgroundColor: color }]} />
		</View>
	);
}

// -----------------------------------------------------------------------------
// Pulsing ring — expands and fades outward
// -----------------------------------------------------------------------------

interface PulseRingProps {
	size: number;
	color: string;
	delay: number;
	duration: number;
	active: boolean;
}

function PulseRing({ size, color, delay, duration, active }: PulseRingProps) {
	const scale = useRef(new Animated.Value(1)).current;
	const opacity = useRef(new Animated.Value(0.6)).current;

	useEffect(() => {
		if (!active) {
			scale.setValue(1);
			opacity.setValue(0.6);
			return;
		}

		const anim = Animated.loop(
			Animated.sequence([
				Animated.delay(delay),
				Animated.parallel([
					Animated.timing(scale, {
						toValue: 1.35,
						duration,
						easing: Easing.out(Easing.quad),
						useNativeDriver: true,
					}),
					Animated.timing(opacity, {
						toValue: 0,
						duration,
						easing: Easing.out(Easing.quad),
						useNativeDriver: true,
					}),
				]),
				Animated.parallel([
					Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
					Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
				]),
			]),
		);

		anim.start();
		return () => anim.stop();
	}, [active, delay, duration, scale, opacity]);

	return (
		<Animated.View
			style={[
				styles.pulseRing,
				{
					width: size,
					height: size,
					borderRadius: size / 2,
					borderColor: color,
					transform: [{ scale }],
					opacity,
				},
			]}
		/>
	);
}

// -----------------------------------------------------------------------------
// Spinning ring — used for Thinking
// -----------------------------------------------------------------------------

interface SpinRingProps {
	size: number;
	color: string;
	duration: number;
	reverse?: boolean;
	active: boolean;
}

function SpinRing({ size, color, duration, reverse = false, active }: SpinRingProps) {
	const rotation = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (!active) return;

		const anim = Animated.loop(
			Animated.timing(rotation, {
				toValue: 1,
				duration,
				easing: Easing.linear,
				useNativeDriver: true,
			}),
		);
		anim.start();
		return () => anim.stop();
	}, [active, duration, rotation]);

	const rotate = rotation.interpolate({
		inputRange: [0, 1],
		outputRange: reverse ? ["360deg", "0deg"] : ["0deg", "360deg"],
	});

	return (
		<Animated.View
			style={[
				styles.spinRing,
				{
					width: size,
					height: size,
					borderRadius: size / 2,
					borderColor: color,
					transform: [{ rotate }],
					opacity: 0.6,
				},
			]}
		/>
	);
}

// -----------------------------------------------------------------------------
// Orb — the central glowing circle
// -----------------------------------------------------------------------------

interface OrbProps {
	orbSize: number;
	state: AgentState;
}

function Orb({ orbSize, state }: OrbProps) {
	const cfg = STATE_CONFIG[state];
	const bgColor = useRef(new Animated.Value(0)).current;

	// Animate orb color transition
	useEffect(() => {
		Animated.timing(bgColor, {
			toValue: 1,
			duration: 400,
			useNativeDriver: false,
		}).start();
		return () => bgColor.setValue(0);
	}, [state, bgColor]);

	return (
		<View
			style={[
				styles.orb,
				{
					width: orbSize,
					height: orbSize,
					borderRadius: orbSize / 2,
					backgroundColor: cfg.orbColor,
				},
			]}
		>
			{state === "listening" && <WaveBars color={cfg.barColor} speed="slow" active={true} />}
			{state === "thinking" && <ThinkingDots color={cfg.barColor} active={true} />}
			{state === "speaking" && <WaveBars color={cfg.barColor} speed="fast" active={true} />}
			{state === "paused" && <PauseIcon color={cfg.barColor} />}
		</View>
	);
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export function CustomVisualizer({ state, size = 160, style }: AgentStateVisualizerProps) {
	const cfg = STATE_CONFIG[state];
	const orbSize = size * 0.75;
	const ring1Size = size * 0.88;
	const ring2Size = size;

	const isListening = state === "listening";
	const isSpeaking = state === "speaking";
	const isThinking = state === "thinking";
	const isPaused = state === "paused";

	return (
		<View style={[styles.wrapper, style]}>
			{/* Rings */}
			<View style={[styles.ringsContainer, { width: ring2Size, height: ring2Size }]}>
				{(isListening || isSpeaking) && (
					<>
						<PulseRing
							size={ring1Size}
							color={cfg.ringColor}
							delay={0}
							duration={isListening ? 1600 : 700}
							active={true}
						/>
						<PulseRing
							size={ring2Size}
							color={cfg.outerRingColor}
							delay={isListening ? 400 : 200}
							duration={isListening ? 1600 : 700}
							active={true}
						/>
					</>
				)}

				{isThinking && (
					<>
						<SpinRing size={ring1Size} color={cfg.ringColor} duration={2200} active={true} />
						<SpinRing size={ring2Size} color={cfg.outerRingColor} duration={3200} reverse active={true} />
					</>
				)}

				{isPaused && (
					<>
						<View
							style={[
								styles.staticRing,
								{
									width: ring1Size,
									height: ring1Size,
									borderRadius: ring1Size / 2,
									borderColor: cfg.ringColor,
									opacity: 0.35,
								},
							]}
						/>
						<View
							style={[
								styles.staticRing,
								{
									width: ring2Size,
									height: ring2Size,
									borderRadius: ring2Size / 2,
									borderColor: cfg.outerRingColor,
									opacity: 0.2,
								},
							]}
						/>
					</>
				)}
			</View>

			{/* Orb */}
			<Orb orbSize={orbSize} state={state} />

			{/* Label */}
			<Text style={[styles.label, { color: cfg.orbColor }]}>{cfg.label.toUpperCase()}</Text>
		</View>
	);
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
	wrapper: {
		alignItems: "center",
		justifyContent: "center",
		gap: 16,
	},
	ringsContainer: {
		position: "absolute",
		alignItems: "center",
		justifyContent: "center",
	},
	orb: {
		alignItems: "center",
		justifyContent: "center",
	},
	pulseRing: {
		position: "absolute",
		borderWidth: 1.5,
	},
	spinRing: {
		position: "absolute",
		borderWidth: 1.5,
		borderTopColor: "transparent",
		borderRightColor: "transparent",
	},
	staticRing: {
		position: "absolute",
		borderWidth: 1.5,
	},
	label: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 2,
		marginTop: 8,
	},
	waveBarsContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 3,
		height: 36,
	},
	waveBar: {
		width: 4,
		height: 28,
		borderRadius: 2,
	},
	dotsContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	pauseContainer: {
		flexDirection: "row",
		gap: 6,
		alignItems: "center",
	},
	pauseBar: {
		width: 6,
		height: 26,
		borderRadius: 2,
		opacity: 0.85,
	},
});
