import { V06Adapter } from './adapters/v06-adapter';
import { V07Adapter } from './adapters/v07-adapter';
import { PNodeAdapter } from './adapters/types';
import { PNodeResponse } from './types/pnode';

/**
 * Configuration from environment variables
 */
const config = {
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'http://207.244.255.1:6000',
  apiVersion: (process.env.NEXT_PUBLIC_API_VERSION || '0.7') as '0.6' | '0.7',
  timeout: parseInt(process.env.NEXT_PUBLIC_TIMEOUT || '10000', 10)
};

/**
 * Factory function to create the appropriate adapter
 * based on the configured API version
 */
function createAdapter(): PNodeAdapter {
  switch (config.apiVersion) {
    case '0.6':
      console.log('🔌 Using pRPC API v0.6 (Legacy)');
      return new V06Adapter(config.rpcUrl, config.timeout);
    
    case '0.7':
      console.log('🔌 Using pRPC API v0.7 (New)');
      return new V07Adapter(config.rpcUrl, config.timeout);
    
    default:
      throw new Error(`Unsupported API version: ${config.apiVersion}`);
  }
}

/**
 * Singleton instance of the adapter
 */
export const pNodeClient = createAdapter();

/**
 * Fetch all pNodes from the network
 * This is the main function components should use
 */
export async function fetchPNodes(): Promise<PNodeResponse> {
  try {
    return await pNodeClient.fetchNodes();
  } catch (error) {
    console.error('❌ Error fetching pNodes:', error);
    throw error;
  }
}

/**
 * Get current API configuration
 */
export function getApiConfig() {
  return {
    ...config,
    supportsDetailedStats: pNodeClient.supportsDetailedStats
  };
}
