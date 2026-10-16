import { NextResponse } from 'next/server';
import { generateWithdrawTransaction } from '@/lib/defindex-service';

/**
 * POST /api/defindex/withdraw
 * Genera una transacción de retiro de un vault de DeFindex
 *
 * Not called from the UI yet; see the note at the top of lib/defindex-service.ts.
 *
 * Body:
 * {
 *   vaultAddress: string,
 *   amount: number,
 *   userAddress: string
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vaultAddress, amount, userAddress } = body;

    // Validación
    if (!vaultAddress || !amount || !userAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'vaultAddress, amount, and userAddress are required',
        },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Amount must be greater than 0',
        },
        { status: 400 }
      );
    }

    // Generar transacción
    const transaction = await generateWithdrawTransaction({
      vaultAddress,
      amount,
      userAddress,
    });

    return NextResponse.json({
      success: true,
      data: {
        transaction,
        vaultAddress,
        amount,
        message: 'Withdraw transaction generated successfully. Please sign with your wallet.',
      },
    });
  } catch (error) {
    console.error('Error generating withdraw transaction:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate withdraw transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
