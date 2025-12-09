import { PNodeResponse } from '../types/pnode';

/**
 * Adapter interface for different pRPC API versions
 * Each version implements this interface to provide a unified API
 */
export interface PNodeAdapter {
  /**
   * Fetch all pNodes from the network
   */
  fetchNodes(): Promise<PNodeResponse>;
  
  /**
   * API version this adapter supports
   */
  readonly version: string;
  
  /**
   * Whether this version supports detailed stats for all nodes
   */
  readonly supportsDetailedStats: boolean;
}

/**
 * Configuration for the API client
 */
export interface ApiConfig {
  rpcUrl: string;
  apiVersion: '0.6' | '0.7';
  timeout?: number;
}
