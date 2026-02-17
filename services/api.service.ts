import { getApiUrl, API_CONFIG } from '@/config/api.config';

export interface SessionRecord {
  id: string;
  padId: number;
  hitCount: number;
  missCount: number;
  totalRounds: number;
  accuracy: number;
  sessionStartTime: number;
  sessionDuration: number;
  averageReactionTime: number;
  pressTimes: number[];
  pressRecords: {
    pressNumber: number;
    color: string;
    result: string;
    reactionTime: number;
    timestamp: number;
  }[];
  gameConfig: {
    redProbability: number;
    redDisplayDuration: number;
    greenTimeout: number;
    enableGreenTimeout: boolean;
    sessionTimeLimit: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LevelStats {
  level: number;
  startTime: number;
  endTime?: number;
  timeSpent?: number;
  failureCount: number;
  completed: boolean;
}

export interface PatternSessionRecord {
  _id: string;
  sessionStartTime: number;
  sessionEndTime?: number;
  totalTimeSpent?: number;
  levelStats: LevelStats[];
  gameMode: 'continue' | 'restart';
  finalLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface PatternTemplate {
  id: string;
  name: string;
  description: string;
  levels: number;
  config: any;
}

export interface HitTemplate {
  _id: string;
  version: string;
  type: string;
  metadata: {
    name: string;
    description: string;
    created_at: string;
    created_by: string;
  };
  configuration: {
    lightOut: {
      mode: string;
      hitCount?: number;
      timeout?: number;
    };
    lightDelay: {
      mode: string;
      delayTime?: number;
      randomRange?: {
        min: number;
        max: number;
      };
    };
    duration: {
      mode: string;
      hitCount?: number;
      timeoutDuration?: {
        minutes: number;
        seconds: number;
      };
    };
    roundPads?: Array<{
      round: number;
      pad: number;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export class ApiService {
  static async getOnePadSessions(): Promise<SessionRecord[]> {
    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ONE_PAD_MODE_SESSIONS));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const sessions = await response.json();
      return sessions;
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      throw error;
    }
  }

  static async getSessionById(sessionId: string): Promise<SessionRecord> {
    try {
      const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.ONE_PAD_MODE_SESSIONS)}/${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const session = await response.json();
      return session;
    } catch (error) {
      console.error('Failed to fetch session:', error);
      throw error;
    }
  }

  // Pattern Mode API methods
  static async savePatternSession(sessionData: Omit<PatternSessionRecord, '_id' | 'createdAt' | 'updatedAt'>): Promise<PatternSessionRecord> {
    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PATTERN_MODE_SESSIONS), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const savedSession = await response.json();
      return savedSession;
    } catch (error) {
      console.error('Failed to save pattern session:', error);
      throw error;
    }
  }

  static async getPatternSessions(gameMode?: 'continue' | 'restart'): Promise<PatternSessionRecord[]> {
    try {
      const url = gameMode 
        ? `${getApiUrl(API_CONFIG.ENDPOINTS.PATTERN_MODE_SESSIONS)}?gameMode=${gameMode}`
        : getApiUrl(API_CONFIG.ENDPOINTS.PATTERN_MODE_SESSIONS);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const sessions = await response.json();
      return sessions;
    } catch (error) {
      console.error('Failed to fetch pattern sessions:', error);
      throw error;
    }
  }

  static async getPatternSessionById(sessionId: string): Promise<PatternSessionRecord> {
    try {
      const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.PATTERN_MODE_SESSIONS)}/${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const session = await response.json();
      return session;
    } catch (error) {
      console.error('Failed to fetch pattern session:', error);
      throw error;
    }
  }

  // Pattern Templates API methods
  static async getPatternTemplates(): Promise<PatternTemplate[]> {
    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PATTERN_MODE_TEMPLATES));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const templates = await response.json();
      return templates;
    } catch (error) {
      console.error('Failed to fetch pattern templates:', error);
      throw error;
    }
  }

  // Hit Mode Templates API methods
  static async getHitModeTemplates(): Promise<HitTemplate[]> {
    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.HIT_MODE_TEMPLATES));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Failed to fetch hit mode templates:', error);
      throw error;
    }
  }
}
