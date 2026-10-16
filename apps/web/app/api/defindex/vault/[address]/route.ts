import { NextResponse } from 'next/server';
import { getVaultInfo, getVaultAPY } from '@/lib/defindex-service';

/**
 * GET /api/defindex/vault/[address]
 * Obtiene información de un vault específico
 *
 * Not called from the UI yet; see the note at the top of lib/defindex-service.ts.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Vault address is required',
        },
        { status: 400 }
      );
    }

    const [vaultInfo, apy] = await Promise.all([
      getVaultInfo(address),
      getVaultAPY(address),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...vaultInfo,
        apy,
      },
    });
  } catch (error) {
    console.error('Error fetching vault info:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch vault information',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
