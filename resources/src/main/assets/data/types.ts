export interface TokenResponse {
  token: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface LoginResponse extends TokenResponse, UserInforResponse {}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
  timestamp: string;
  version: string;
}

export interface UserInforResponse {
  id: number;
  username: string | null;
  fullName: string | null;
  roleName: string | null;
  avatar: string | null;
  userId: string;
}

export interface PagingResult<T, R> {
  pageIndex: number;
  pageTotal: number;
  pageSize: number;
  items: Array<T>;
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface User {
  id: string;
  username: string;
  firstName: string;
  email: string;
  roles: string;
}

export interface Line {
  Id?: number;
  lineCd: string;
  lineName: string;
  process: Process;
}

export interface Status {
  statusId: number;
  statusName: string;
  color: string;
  description: string;
  reasonResponses: Reason | null;
  hasReason: boolean;
  isProduction: boolean;
  statusesChild: Array<Status> | null;
}

export interface LineActivity {
  Date: string;
  Time: string;
  Status: string;
  Reason: string;
  MaintenanceCommand: string;
}

export interface Division {
  divisionCd: string;
  divisionName: string;
}

export interface Process {
  processName: string;
  processCd: string;
  division: Division;
}

export interface Reason {
  reasonId: number;
  code?: string | null;
  description?: string | null;
  reason?: string | null;
  note: string | null;
}

export interface MachineState {
  machineStopId: number;
  startTime: string;
  endTime: Date | null;
  reasonResponses: Reason[];
  statusResponse: Status;
}

export interface Machine {
  machineCd: string;
  machineState?: MachineState;
  modelUse?: string;
  processUse?: string;
  machineName?: string;
  lineMachineId?: string;
}

export type LineCurrentProduce = Omit<Line, 'Id' | 'process'> & {
  lineProduceId: number;
  divisionCd: string;
  processCd: string;
  productionNo: string;
  model: string;
  start: Date;
  end: Date;
  machines: Machine[];
  lineState: {
    statusResponse: Status;
    reasonResponses: Reason[];
  };
};

export type Model = {
  productNo: string;
  productName: string;
};

export type UserDownTime = {
  id: number;
  userId: string;
  fullName: string;
  mailAddress: string;
  section: {
    id: number;
    name: string;
    department: {
      id: number;
      name: string;
    };
  };
};

export type LineHistoryState = {
  reasonResponses: Reason[];
  statusResponse: Status;
  startTime: string;
  endTime: string | null;
  user: UserDownTime;
  duration: string;
};

export type LineHistoryProduce = Omit<LineCurrentProduce, 'lineState'> & {
  lineState: LineHistoryState;
};

export type LineSummaryHistoryProduce = {
  status: Status;
  timeSpan: string;
  statesChild: LineSummaryHistoryProduce[];
};

export type LineMonitoringProduce = {
  lineProduce: LineCurrentProduce;
  statusDurations: LineSummaryHistoryProduce[];
};

export type ProfileResponse = ApiResponse<User>;

export type LineReduceCurrent = Omit<Line, 'Id' | 'process'> & {
  lineState: {
    statusResponse: Status;
  };
};

export type LineArea = {
  name: string;
  lines: Array<LineReduceCurrent>;
};

export type LineDepartment = {
  areas: Array<LineArea>;
  name: string;
};
