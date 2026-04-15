import { Participant, TokenSource, TokenSourceBase, TokenSourceResponseObject } from "livekit-client";
import { createContext, use, useCallback, useContext, useEffect, useMemo, useState } from "react";
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
const fetchToken = async () => {
	try {
		const response = await fetch(process.env.EXPO_PUBLIC_TOKEN_SERVER_URL, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		// Parse reponse
		const data = await response.json();
		return data satisfies TokenResponseProps;
	} catch (error) {
		console.error("Error fetching token:", error);
	}
};

const tokenPromise = fetchToken().catch(() => null);

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
	// const tokenResponse = use(tokenPromise);
	const [tokenResponse, setTokenResponse] = useState<TokenResponseProps | null>(null);
	const serverUrl = tokenResponse?.url || hardcodedUrl;
	const participantToken = tokenResponse?.token || hardcodedToken;

	const tokenSource = useMemo(() => {
		if (sandboxID) {
			return TokenSource.sandboxTokenServer(sandboxID);
		} else {
			return TokenSource.literal({
				serverUrl,
				participantToken,
			} satisfies TokenSourceResponseObject);
		}
	}, [serverUrl, participantToken]);

	const session = useSession(tokenSource, agentName ? { agentName } : undefined);

	const { start: startSession, end: endSession } = session;

	// Start session only after tokenResponse state has settled
	useEffect(() => {
		if (isConnectionActive && tokenResponse) {
			startSession();
		}
	}, [tokenResponse, isConnectionActive]); // fires after re-render with new token

	const connect = useCallback(async () => {
		setIsConnectionActive(true); // useEffect above then calls startSession
		const data = await fetchToken();
		if (!data) {
			setIsConnectionActive(false);
			return;
		}
		setTokenResponse(data); // triggers re-render → tokenSource updates
	}, []);

	const disconnect = useCallback(() => {
		setIsConnectionActive(false);
		setTokenResponse(null);
		endSession();
	}, [endSession]);

	const value = useMemo(() => {
		return {
			isConnectionActive,
			connect,
			disconnect,
		};
	}, [startSession, endSession, isConnectionActive]);

	return (
		<SessionProvider session={session}>
			<ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>
		</SessionProvider>
	);
}
