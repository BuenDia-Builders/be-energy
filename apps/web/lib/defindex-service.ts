/**
 * DeFindex Service
 * Servicio para gestionar operaciones de yield/rendimiento con DeFindex
 *
 * Not called from the UI at the moment. This service is only used by the
 * /api/defindex/* routes, and the only caller of those routes was the
 * useDefindex hook, which nothing imported and which was removed (#262).
 * The service and the routes are kept for a possible future integration.
 */

import { DefindexSDK, SupportedNetworks } from '@defindex/sdk';

// Configuración del SDK
const DEFINDEX_API_KEY = process.env.DEFINDEX_API_KEY || '';
const DEFINDEX_BASE_URL = process.env.DEFINDEX_BASE_URL || 'https://api.defindex.io';
const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet'
  ? SupportedNetworks.MAINNET
  : SupportedNetworks.TESTNET;

// Inicializar SDK
let sdk: DefindexSDK | null = null;

function getSDK(): DefindexSDK {
  if (!sdk) {
    if (!DEFINDEX_API_KEY) {
      throw new Error('DEFINDEX_API_KEY no está configurada en las variables de entorno');
    }

    sdk = new DefindexSDK({
      apiKey: DEFINDEX_API_KEY,
      baseUrl: DEFINDEX_BASE_URL,
      timeout: 30000,
    });
  }
  return sdk;
}

/**
 * Tipos
 */
export interface VaultInfo {
  address: string;
  name: string;
  symbol: string;
  totalAssets: number;
  apy: number;
}

export interface UserVaultBalance {
  shares: number;
  assets: number;
  apy: number;
}

export interface DepositParams {
  vaultAddress: string;
  amount: number;
  userAddress: string;
  invest?: boolean;
  slippageBps?: number;
}

export interface WithdrawParams {
  vaultAddress: string;
  amount: number;
  userAddress: string;
}

/**
 * Servicios DeFindex
 */

/**
 * Verifica el estado de la API de DeFindex
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const sdk = getSDK();
    const health = await sdk.healthCheck();
    return health.status === 'ok';
  } catch (error) {
    console.error('Error al verificar salud de DeFindex:', error);
    return false;
  }
}

/**
 * Obtiene la dirección del contrato Factory
 */
export async function getFactoryAddress(): Promise<string> {
  try {
    const sdk = getSDK();
    const response = await sdk.getFactoryAddress(NETWORK);
    return response.address;
  } catch (error) {
    console.error('Error al obtener dirección del factory:', error);
    throw error;
  }
}

/**
 * Obtiene información de un vault específico
 */
export async function getVaultInfo(vaultAddress: string): Promise<VaultInfo> {
  try {
    const sdk = getSDK();
    const info = await sdk.getVaultInfo(vaultAddress, NETWORK);
    const apyResponse = await sdk.getVaultAPY(vaultAddress, NETWORK);
    const totalAssets = info.totalManagedFunds?.reduce((sum: number, f: { amount?: number }) => sum + (f.amount ?? 0), 0) ?? 0;

    return {
      address: vaultAddress,
      name: info.name || 'Unknown Vault',
      symbol: info.symbol || 'VAULT',
      totalAssets,
      apy: apyResponse.apy,
    };
  } catch (error) {
    console.error('Error al obtener información del vault:', error);
    throw error;
  }
}

/**
 * Obtiene el APY actual de un vault
 */
export async function getVaultAPY(vaultAddress: string): Promise<number> {
  try {
    const sdk = getSDK();
    const response = await sdk.getVaultAPY(vaultAddress, NETWORK);
    return response.apy;
  } catch (error) {
    console.error('Error al obtener APY del vault:', error);
    throw error;
  }
}

/**
 * Obtiene el balance de un usuario en un vault
 */
export async function getUserVaultBalance(
  vaultAddress: string,
  userAddress: string
): Promise<UserVaultBalance> {
  try {
    const sdk = getSDK();
    const balance = await sdk.getVaultBalance(vaultAddress, userAddress, NETWORK);
    const apyResponse = await sdk.getVaultAPY(vaultAddress, NETWORK);
    const underlyingTotal = balance.underlyingBalance?.reduce((sum: number, v: number) => sum + v, 0) ?? 0;

    return {
      shares: balance.dfTokens ?? 0,
      assets: underlyingTotal,
      apy: apyResponse.apy,
    };
  } catch (error) {
    console.error('Error al obtener balance del usuario:', error);
    throw error;
  }
}

/**
 * Genera una transacción de depósito en el vault
 * NOTA: Esta función solo genera la transacción, el usuario debe firmarla
 */
export async function generateDepositTransaction(params: DepositParams): Promise<string> {
  try {
    const sdk = getSDK();
    const { vaultAddress, amount, userAddress, invest = true, slippageBps = 100 } = params;

    const response = await sdk.depositToVault(
      vaultAddress,
      {
        amounts: [amount],
        caller: userAddress,
        invest,
        slippageBps,
      },
      NETWORK
    );

    return response.xdr;
  } catch (error) {
    console.error('Error al generar transacción de depósito:', error);
    throw error;
  }
}

/**
 * Genera una transacción de retiro del vault
 * NOTA: Esta función solo genera la transacción, el usuario debe firmarla
 */
export async function generateWithdrawTransaction(params: WithdrawParams): Promise<string> {
  try {
    const sdk = getSDK();
    const { vaultAddress, amount, userAddress } = params;

    const response = await sdk.withdrawFromVault(
      vaultAddress,
      {
        amounts: [amount],
        caller: userAddress,
      },
      NETWORK
    );

    return response.xdr;
  } catch (error) {
    console.error('Error al generar transacción de retiro:', error);
    throw error;
  }
}

/**
 * Calcula intereses acumulados basado en el APY
 */
export function calculateInterest(principal: number, apyPercent: number, days: number): number {
  // Fórmula: principal * (APY / 100) * (days / 365)
  const dailyRate = apyPercent / 100 / 365;
  return principal * dailyRate * days;
}

/**
 * Obtiene estadísticas de rendimiento para un usuario
 */
export async function getUserYieldStats(
  vaultAddress: string,
  userAddress: string
): Promise<{
  balance: number;
  apy: number;
  interestToday: number;
  interestThisMonth: number;
}> {
  try {
    const balance = await getUserVaultBalance(vaultAddress, userAddress);

    const interestToday = calculateInterest(balance.assets, balance.apy, 1);
    const interestThisMonth = calculateInterest(balance.assets, balance.apy, 30);

    return {
      balance: balance.assets,
      apy: balance.apy,
      interestToday,
      interestThisMonth,
    };
  } catch (error) {
    console.error('Error al obtener estadísticas de rendimiento:', error);
    throw error;
  }
}

export default {
  checkHealth,
  getFactoryAddress,
  getVaultInfo,
  getVaultAPY,
  getUserVaultBalance,
  generateDepositTransaction,
  generateWithdrawTransaction,
  calculateInterest,
  getUserYieldStats,
};
