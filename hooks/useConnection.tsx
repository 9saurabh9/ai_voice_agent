import { TokenSource, TokenSourceBase, TokenSourceResponseObject } from "livekit-client";
import { createContext, useContext, useMemo, useState } from "react";
import { SessionProvider, useSession } from "@livekit/components-react";

interface TokenResponseProps {
	token: string;
	url: string;
	room: string;
}

// TODO: Add your Sandbox ID here
const sandboxID = "";

// The name of the agent you wish to be dispatched.
const agentName = "";

// NOTE: If you prefer not to use LiveKit Sandboxes for testing, you can generate your
// tokens manually by visiting https://cloud.livekit.io/projects/p_/settings/keys
// and using one of your API Keys to generate a token with custom TTL and permissions.

// For use without a token server.
const hardcodedUrl = "";
const hardcodedToken = "";

// Fetch LiveKit token from radium backend
const tokenResponse = await (async () => {
	try {
		const response = await fetch("http://34.42.130.100:3004/getToken", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		const data = await response.json();
		console.log("Token:", data);
		return data satisfies TokenResponseProps;
	} catch (error) {
		console.error("Error fetching token:", error);
	}
})();

interface ConnectionContextType {
	isConnectionActive: boolean;
	connect: () => void;
	disconnect: () => void;
}

const ConnectionContext = createContext<ConnectionContextType>({
	isConnectionActive: false,
	connect: () => {},
	disconnect: () => {},
});

export function useConnection() {
	const ctx = useContext(ConnectionContext);
	if (!ctx) {
		throw new Error("useConnection must be used within a ConnectionProvider");
	}
	return ctx;
}

interface ConnectionProviderProps {
	children: React.ReactNode;
}

export function ConnectionProvider({ children }: ConnectionProviderProps) {
	const [isConnectionActive, setIsConnectionActive] = useState(false);

	const tokenSource = useMemo(() => {
		if (sandboxID) {
			return TokenSource.sandboxTokenServer(sandboxID);
		} else {
			return TokenSource.literal({
				serverUrl: tokenResponse?.token || hardcodedUrl,
				participantToken: tokenResponse?.url || hardcodedToken,
			} satisfies TokenSourceResponseObject);
		}
	}, [sandboxID, hardcodedUrl, hardcodedToken]);

	const session = useSession(tokenSource, agentName ? { agentName } : undefined);

	const { start: startSession, end: endSession } = session;

	const value = useMemo(() => {
		return {
			isConnectionActive,
			connect: () => {
				setIsConnectionActive(true);
				startSession();
			},
			disconnect: () => {
				setIsConnectionActive(false);
				endSession();
			},
		};
	}, [startSession, endSession, isConnectionActive]);

	return (
		<SessionProvider session={session}>
			<ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>
		</SessionProvider>
	);
}
