/**
 * Configuration for SignalR Hub Connection
 */
export interface HubConfiguration {
  url: string;
  automaticReconnect?: boolean;
  logLevel?: 'trace' | 'debug' | 'information' | 'warning' | 'error' | 'critical' | 'none';
  reconnectDelay?: number;
}

/**
 * Group subscription parameters
 */
export interface GroupSubscription {
  lineCd: string;
  processCd: string;
  divisionCd: string;
}

/**
 * Connection status
 */
export enum ConnectionStatus {
  Disconnected = 'Disconnected',
  Connecting = 'Connecting',
  Connected = 'Connected',
  Disconnecting = 'Disconnecting',
  Reconnecting = 'Reconnecting'
}

/**
 * Hub event types
 */
export enum HubEventType {
  LineProduceChange = 'lineProduceChange',
  Connected = 'Connected',
  Disconnected = 'Disconnected',
  Reconnecting = 'Reconnecting',
  Reconnected = 'Reconnected'
}

/**
 * Hub method names
 */
export enum HubMethod {
  JoinGroup = 'JoinGroup',
  LeaveGroup = 'LeaveGroup'
}
