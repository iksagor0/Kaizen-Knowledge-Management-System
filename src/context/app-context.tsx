"use client";

import { INITIAL_TASKS } from "@/constants";
import { INote, IResource, ITask, THistory } from "@/models";

import { db } from "@/utils/firebase";
import { sanitizeForFirebase } from "@/utils/sanitize";
import { getEffectiveBDDateStr } from "@/utils/time";
import { off, onValue, ref, set } from "firebase/database";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { useAuth } from "./auth-context";

import { EActiveTab } from "@/types";

interface IAppState {
  tasks: readonly ITask[];
  notes: readonly INote[];
  history: THistory;
  lastResetTime: string | null;
  isLoaded: boolean;
  theme:
    | "default"
    | "sakura"
    | "earth"
    | "mint"
    | "lavender"
    | "midnight"
    | "eye-comfort"
    | "slate-dark";
  resources: readonly IResource[];
  loadedFor: string | "guest" | null;
  activeTab: EActiveTab;
}

type TAppAction =
  | { type: "RESET_STATE" }
  | {
      type: "LOAD_STATE";
      payload: Partial<IAppState> & { loadedFor: string | "guest" };
    }
  | { type: "ADD_TASK"; payload: ITask }
  | {
      type: "EDIT_TASK";
      payload: Pick<
        ITask,
        | "id"
        | "name"
        | "desc"
        | "targetTime"
        | "targetStr"
        | "icon"
        | "repeatDaily"
      >;
    }
  | { type: "DELETE_TASK"; payload: string }
  | {
      type: "COMPLETE_TASK";
      payload: { id: string; timeSpent: number; repeatDaily?: boolean };
    }
  | { type: "UNDO_TASK"; payload: string }
  | { type: "RUN_DAILY_RESET"; payload: string }
  | { type: "SET_THEME"; payload: IAppState["theme"] }
  | { type: "REORDER_TASKS"; payload: { sourceId: string; targetId: string } }
  | { type: "ADD_NOTE"; payload: INote }
  | { type: "EDIT_NOTE"; payload: INote }
  | { type: "DELETE_NOTE"; payload: string }
  | { type: "REORDER_NOTES"; payload: { sourceId: string; targetId: string } }
  | { type: "TOGGLE_NOTE_PIN"; payload: string }
  | { type: "TOGGLE_ARCHIVE_NOTE"; payload: string }
  | { type: "ADD_RESOURCE"; payload: IResource }
  | { type: "UPDATE_RESOURCE"; payload: IResource }
  | { type: "DELETE_RESOURCE"; payload: string }
  | {
      type: "REORDER_RESOURCES";
      payload: { sourceId: string; targetId: string };
    }
  | { type: "TOGGLE_ARCHIVE_RESOURCE"; payload: string }
  | { type: "SET_ACTIVE_TAB"; payload: EActiveTab };

const initialState: IAppState = {
  tasks: [],
  notes: [],
  history: [],
  lastResetTime: null,
  isLoaded: false,
  theme: "default",
  resources: [],
  loadedFor: null,
  activeTab: EActiveTab.TRACKER,
};

function appReducer(state: IAppState, action: TAppAction): IAppState {
  switch (action.type) {
    case "RESET_STATE":
      return { ...initialState };

    case "LOAD_STATE": {
      const payload = action.payload;
      // If it's a completely fresh user (no tasks, no history, no last reset), give them initial tasks
      const isNewUser =
        !payload.lastResetTime &&
        (!payload.tasks || payload.tasks.length === 0) &&
        (!payload.history || payload.history.length === 0);

      const tasks = isNewUser
        ? INITIAL_TASKS.map((t) => ({
            ...t,
            status: "TODO" as const,
            actualTime: 0,
            completedAt: undefined,
          }))
        : payload.tasks || [];

      return {
        ...state,
        ...payload,
        tasks,
        notes: payload.notes || [],
        resources: payload.resources || [],
        loadedFor: payload.loadedFor,
        isLoaded: true,
      };
    }

    case "ADD_TASK":
      return { ...state, tasks: [action.payload, ...state.tasks] };

    case "EDIT_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t,
        ),
      };

    case "DELETE_TASK":
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload),
      };

    case "COMPLETE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id
            ? {
                ...t,
                status: "DONE",
                actualTime: action.payload.timeSpent,
                completedAt: Date.now(),
                repeatDaily:
                  action.payload.repeatDaily !== undefined
                    ? action.payload.repeatDaily
                    : t.repeatDaily,
              }
            : t,
        ),
      };

    case "UNDO_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload
            ? { ...t, status: "TODO", actualTime: 0, completedAt: undefined }
            : t,
        ),
      };

    case "RUN_DAILY_RESET": {
      const todayStr = action.payload;
      if (state.lastResetTime === todayStr) return state;

      const newHistory = [...state.history];
      if (state.tasks.length > 0 && state.lastResetTime) {
        const totalTime = state.tasks.reduce((sum, t) => {
          if (t.status === "DONE") {
            if (t.completedAt) {
              if (
                getEffectiveBDDateStr(t.completedAt) === state.lastResetTime
              ) {
                return sum + (t.actualTime || 0);
              }
            } else if (t.repeatDaily) {
              // Legacy fallback: repeatDaily without completedAt
              return sum + (t.actualTime || 0);
            }
          }
          return sum;
        }, 0);
        newHistory.push({
          date: state.lastResetTime,
          timeSpent: totalTime,
        });
      }

      return {
        ...state,
        history: newHistory,
        tasks: state.tasks.map((t) =>
          t.repeatDaily
            ? { ...t, status: "TODO", actualTime: 0, completedAt: undefined }
            : t,
        ),
        lastResetTime: todayStr,
      };
    }

    case "SET_THEME":
      return { ...state, theme: action.payload };

    case "REORDER_TASKS": {
      const { sourceId, targetId } = action.payload;
      const tasks = [...state.tasks];
      const sourceIndex = tasks.findIndex((t) => t.id === sourceId);
      const targetIndex = tasks.findIndex((t) => t.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) return state;

      const [movedTask] = tasks.splice(sourceIndex, 1);
      tasks.splice(targetIndex, 0, movedTask);

      return { ...state, tasks };
    }

    case "ADD_NOTE":
      return { ...state, notes: [action.payload, ...state.notes] };

    case "EDIT_NOTE":
      return {
        ...state,
        notes: state.notes.map((n) =>
          n.id === action.payload.id ? action.payload : n,
        ),
      };

    case "DELETE_NOTE":
      return {
        ...state,
        notes: state.notes.filter((n) => n.id !== action.payload),
      };

    case "REORDER_NOTES": {
      const { sourceId, targetId } = action.payload;
      const notes = [...state.notes];
      const sourceIndex = notes.findIndex((n) => n.id === sourceId);
      const targetIndex = notes.findIndex((n) => n.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) return state;

      const [movedNote] = notes.splice(sourceIndex, 1);
      notes.splice(targetIndex, 0, movedNote);

      return { ...state, notes };
    }

    case "TOGGLE_NOTE_PIN":
      return {
        ...state,
        notes: state.notes.map((n) =>
          n.id === action.payload ? { ...n, pinned: !n.pinned } : n,
        ),
      };

    case "TOGGLE_ARCHIVE_NOTE":
      return {
        ...state,
        notes: state.notes.map((n) =>
          n.id === action.payload ? { ...n, archived: !n.archived } : n,
        ),
      };

    case "ADD_RESOURCE":
      return { ...state, resources: [action.payload, ...state.resources] };

    case "UPDATE_RESOURCE":
      return {
        ...state,
        resources: state.resources.map((r) =>
          r.id === action.payload.id ? action.payload : r,
        ),
      };

    case "DELETE_RESOURCE":
      return {
        ...state,
        resources: state.resources.filter((r) => r.id !== action.payload),
      };

    case "REORDER_RESOURCES": {
      const { sourceId, targetId } = action.payload;
      const resources = [...state.resources];
      const sourceIndex = resources.findIndex((r) => r.id === sourceId);
      const targetIndex = resources.findIndex((r) => r.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) return state;

      const [movedResource] = resources.splice(sourceIndex, 1);
      resources.splice(targetIndex, 0, movedResource);

      return { ...state, resources };
    }

    case "TOGGLE_ARCHIVE_RESOURCE":
      return {
        ...state,
        resources: state.resources.map((r) =>
          r.id === action.payload ? { ...r, archived: !r.archived } : r,
        ),
      };

    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };

    default:
      return state;
  }
}

interface IAppContextProps {
  state: IAppState;
  dispatch: React.Dispatch<TAppAction>;
}

const AppContext = createContext<IAppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, isGuest } = useAuth();
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load Initial State
  useEffect(() => {
    // CRITICAL: Reset loaded status and state immediately whenever user identity changes
    // to prevent Guest data from leaking into and overwriting User data in Firebase.
    dispatch({ type: "RESET_STATE" });

    if (isGuest) {
      const saved = localStorage.getItem("guestTrackerState");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          dispatch({
            type: "LOAD_STATE",
            payload: { ...parsed, loadedFor: "guest" },
          });
        } catch (e) {
          console.error("Failed to parse guest state", e);
          dispatch({ type: "LOAD_STATE", payload: { loadedFor: "guest" } });
        }
      } else {
        dispatch({ type: "LOAD_STATE", payload: { loadedFor: "guest" } });
      }
      return;
    }

    if (user) {
      const stateRef = ref(db, `users/${user.uid}/trackerState`);
      onValue(stateRef, (snapshot) => {
        if (snapshot.exists()) {
          const parsed = snapshot.val();
          // PRIORITIZE GOOGLE DATA: Load existing cloud data
          dispatch({
            type: "LOAD_STATE",
            payload: { ...parsed, loadedFor: user.uid },
          });
        } else {
          // If a new user just upgraded from Guest, migrating guest data
          const saved = localStorage.getItem("guestTrackerState");
          if (saved) {
            try {
              const guestData = JSON.parse(saved);
              dispatch({
                type: "LOAD_STATE",
                payload: { ...guestData, loadedFor: user.uid },
              });
            } catch {
              console.error("Error migrating guest");
              dispatch({
                type: "LOAD_STATE",
                payload: { loadedFor: user.uid },
              });
            }
            localStorage.removeItem("guestTrackerState");
          } else {
            dispatch({
              type: "LOAD_STATE",
              payload: { loadedFor: user.uid },
            });
          }
        }
      });
      return () => off(stateRef);
    }
  }, [user?.uid, isGuest, user]);

  // Apply Theme to DOM
  useEffect(() => {
    if (state.theme && state.isLoaded) {
      document.documentElement.setAttribute("data-theme", state.theme);
    }
  }, [state.theme, state.isLoaded]);

  // Handle Daily Reset dynamically
  useEffect(() => {
    if (!state.isLoaded) return;
    const currentStr = getEffectiveBDDateStr();
    if (state.lastResetTime !== currentStr) {
      dispatch({ type: "RUN_DAILY_RESET", payload: currentStr });
    }
  }, [state.isLoaded, state.lastResetTime]);

  // Sync to Data Source on specific changes
  useEffect(() => {
    // DO NOT SYNC if state is not loaded or if user identity is in transition
    if (!state.isLoaded || !state.loadedFor) return;

    const currentIdentity = isGuest ? "guest" : user?.uid;
    // CRITICAL: Prevent syncing if the state in memory belongs to a different user/context
    if (state.loadedFor !== currentIdentity) {
      console.warn("Sync blocked: identity mismatch");
      return;
    }

    if (isGuest) {
      localStorage.setItem(
        "guestTrackerState",
        JSON.stringify({
          tasks: state.tasks,
          notes: state.notes,
          history: state.history,
          lastResetTime: state.lastResetTime,
          theme: state.theme,
          resources: state.resources,
        }),
      );
    } else if (user) {
      const stateRef = ref(db, `users/${user.uid}/trackerState`);
      set(
        stateRef,
        sanitizeForFirebase({
          tasks: state.tasks,
          notes: state.notes,
          history: state.history,
          lastResetTime: state.lastResetTime,
          theme: state.theme,
          resources: state.resources,
        }),
      );
    }
  }, [
    state.tasks,
    state.notes,
    state.history,
    state.lastResetTime,
    state.theme,
    state.resources,
    isGuest,
    user?.uid,
    state.isLoaded,
    state.loadedFor,
    user,
  ]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
