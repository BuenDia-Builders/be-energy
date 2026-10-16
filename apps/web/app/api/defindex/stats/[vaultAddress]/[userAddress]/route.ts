import { NextResponse } from 'next/server';
import { getUserYieldStats } from '@/lib/defindex-service';

/**
 * GET /api/defindex/stats/[vaultAddress]/[userAddress]
 * Obtiene estadísticas de rendimiento de un usuario en un vault
 *
 * Not called from the UI yet; see the note at the top of lib/defindex-service.ts.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ vaultAddress: string; userAddress: string }> }
) {
  try {
    const { vaultAddress, userAddress } = await params;

    if (!vaultAddress || !userAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Vault address and user address are required',
        },
        { status: 400 }
      );
    }

    const stats = await getUserYieldStats(vaultAddress, userAddress);

    return NextResponse.json({
      success: true,
      data: {
        vaultAddress,
        userAddress,
        ...stats,
      },
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
