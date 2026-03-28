export type AgentRuntimeStatus =
  | "active"
  | "idle"
  | "waiting_user"
  | "blocked"
  | "offline";

export type AgentVisualState =
  | "idle"
  | "walking"
  | "working"
  | "reading"
  | "writing"
  | "messaging"
  | "waiting"
  | "blocked";

export type WorldAnchorId = "lounge" | "library" | "desk" | "terminal" | "comms";

export interface WorldAnchor {
  id: WorldAnchorId;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  description: string;
}

export interface AgentSummary {
  id: string;
  name: string;
  model: string;
  runtimeStatus: AgentRuntimeStatus;
  visualState: AgentVisualState;
  currentAction: string;
  currentAnchor: WorldAnchorId;
  targetAnchor: WorldAnchorId;
  slotIndex?: number;
  x?: number;
  y?: number;
  spriteSeed?: string;
  sessionLabel?: string;
  taskLabel?: string;
  lastUpdatedAt: string;
  lastTool?: string;
  queueDepth?: number;
  waitingReason?: string | null;
}

export interface AgentEvent {
  id: string;
  agentId: string;
  ts: string;
  type:
    | "task_started"
    | "task_completed"
    | "tool_started"
    | "tool_finished"
    | "state_changed"
    | "message_sent"
    | "waiting_user"
    | "error"
    | "operator_command";
  label: string;
  detail?: string;
}

export interface AgentWorldState {
  version: string;
  room: {
    id: string;
    name: string;
    width: number;
    height: number;
    anchors: WorldAnchor[];
  };
  agents: AgentSummary[];
  selectedAgentId?: string;
  serverTime: string;
}

export interface OperatorCommandRequest {
  text: string;
  mode?: "append" | "interrupt" | "status";
  source?: "ui" | "api";
}

export interface OperatorCommandResponse {
  ok: boolean;
  acceptedAt: string;
  agentId: string;
  echoedCommand: string;
  status: "accepted" | "rejected";
  delivery?: "direct_session";
  reason?: string;
}
