import { NextResponse } from 'next/server';
import { checkHealth } from '@/lib/defindex-service';

/**
 * GET /api/defindex/health
 * Verifica el estado de la conexión con DeFindex
 *
 * Not called from the UI yet; see the note at the top of lib/defindex-service.ts.
 */
export async function GET() {
  try {
    const isHealthy = await checkHealth();

    return NextResponse.json({
      success: true,
      healthy: isHealthy,
      message: isHealthy ? 'DeFindex API is operational' : 'DeFindex API is down',
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        success: false,
        healthy: false,
        error: 'Failed to check DeFindex health',
      },
      { status: 500 }
    );
  }
}
