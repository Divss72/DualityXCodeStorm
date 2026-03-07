import { create } from "zustand";
import {
    CameraRole,
    CameraStream,
    StreamHealth,
    PerceptionData,
    ConnectionState
} from "@/types";

// Camera state for each role
interface CameraState {
    stream: CameraStream | null;
    health: StreamHealth;
}

// Main application state
interface AppState {
    // Demo mode
    isDemoMode: boolean;
    setDemoMode: (enabled: boolean) => void;

    // Camera streams (indexed by role)
    cameras: Record<CameraRole, CameraState>;
    setCameraStream: (role: CameraRole, stream: CameraStream | null) => void;
    updateCameraHealth: (role: CameraRole, health: Partial<StreamHealth>) => void;

    // Perception data (indexed by camera role)
    perceptions: Record<CameraRole, PerceptionData | null>;
    setPerception: (role: CameraRole, data: PerceptionData | null) => void;

    // Connection state
    connection: ConnectionState;
    setConnectionState: (state: Partial<ConnectionState>) => void;

    // Session info
    sessionCode: string | null;
    setSessionCode: (code: string | null) => void;

    // Reset all state
    reset: () => void;
}

// Initial camera state
const createInitialCameraState = (): CameraState => ({
    stream: null,
    health: {
        fps: 0,
        latency: 0,
        connected: false,
    },
});

// Initial state
const initialState = {
    isDemoMode: false,
    cameras: {
        front: createInitialCameraState(),
        rear: createInitialCameraState(),
        left: createInitialCameraState(),
        right: createInitialCameraState(),
    } as Record<CameraRole, CameraState>,
    perceptions: {
        front: {
            confidence: 0,
            segmentation: {
                sand: 0, rocks: 0, bushes: 0, plants: 0, sky: 0,
                gravel: 0, vegetation: 0, "offroad path": 0, hills: 0
            },
            timestamp: new Date().toISOString()
        },
        rear: {
            confidence: 0,
            segmentation: {
                sand: 0, rocks: 0, bushes: 0, plants: 0, sky: 0,
                gravel: 0, vegetation: 0, "offroad path": 0, hills: 0
            },
            timestamp: new Date().toISOString()
        },
        left: {
            confidence: 0,
            segmentation: {
                sand: 0, rocks: 0, bushes: 0, plants: 0, sky: 0,
                gravel: 0, vegetation: 0, "offroad path": 0, hills: 0
            },
            timestamp: new Date().toISOString()
        },
        right: {
            confidence: 0,
            segmentation: {
                sand: 0, rocks: 0, bushes: 0, plants: 0, sky: 0,
                gravel: 0, vegetation: 0, "offroad path": 0, hills: 0
            },
            timestamp: new Date().toISOString()
        },
    } as Record<CameraRole, PerceptionData | null>,
    connection: {
        api: "disconnected" as const,
        websocket: "disconnected" as const,
        lastHealthCheck: null,
    },
    sessionCode: null,
};

// Create the store
export const useAppStore = create<AppState>((set) => ({
    ...initialState,

    setDemoMode: (enabled) => set({ isDemoMode: enabled }),

    setCameraStream: (role, stream) =>
        set((state) => ({
            cameras: {
                ...state.cameras,
                [role]: {
                    ...state.cameras[role],
                    stream,
                    health: stream
                        ? { ...state.cameras[role].health, connected: true }
                        : { ...state.cameras[role].health, connected: false },
                },
            },
        })),

    updateCameraHealth: (role, health) =>
        set((state) => ({
            cameras: {
                ...state.cameras,
                [role]: {
                    ...state.cameras[role],
                    health: { ...state.cameras[role].health, ...health },
                },
            },
        })),

    setPerception: (role, data) =>
        set((state) => ({
            perceptions: {
                ...state.perceptions,
                [role]: data,
            },
        })),

    setConnectionState: (connectionState) =>
        set((state) => ({
            connection: { ...state.connection, ...connectionState },
        })),

    setSessionCode: (code) => set({ sessionCode: code }),

    reset: () => set(initialState),
}));

// Selectors for common access patterns
export const selectCamera = (role: CameraRole) => (state: AppState) =>
    state.cameras[role];

export const selectPerception = (role: CameraRole) => (state: AppState) =>
    state.perceptions[role];

export const selectAllCameras = (state: AppState) => state.cameras;

export const selectAllPerceptions = (state: AppState) => state.perceptions;

export const selectIsDemoMode = (state: AppState) => state.isDemoMode;

export const selectConnection = (state: AppState) => state.connection;
