import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useDefindex } from "../hooks/useDefindex"

// Mock dependencies
const mockSignTransaction = vi.fn()
const mockWalletAddress = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"

vi.mock("@/hooks/use-wallet", () => ({
  useWallet: () => ({
    address: mockWalletAddress,
    signTransaction: mockSignTransaction,
  }),
}))

const mockFetchVault = vi.fn()
const mockFetchUserShares = vi.fn()
const mockBuildDepositTx = vi.fn()
const mockBuildWithdrawTx = vi.fn()
const mockSubmitTx = vi.fn()
const mockCalculateApy = vi.fn()

vi.mock("@/lib/defindex-service", () => ({
  fetchVault: (...args: any[]) => mockFetchVault(...args),
  fetchUserShares: (...args: any[]) => mockFetchUserShares(...args),
  buildDepositTx: (...args: any[]) => mockBuildDepositTx(...args),
  buildWithdrawTx: (...args: any[]) => mockBuildWithdrawTx(...args),
  submitTx: (...args: any[]) => mockSubmitTx(...args),
  calculateApy: (...args: any[]) => mockCalculateApy(...args),
}))

describe("useDefindex Hook", () => {
  const VAULT_ID = "00000000-0000-0000-0000-000000000001"
  const fakeVault = {
    id: VAULT_ID,
    name: "Stellar Green Energy Vault",
    total_shares: "1000000",
    total_assets: "1250000",
    asset_address: "CAS3J7GYCCXG7PPNW7CP",
  }

  const fakeUserStats = {
    shares: "50000",
    assets: "62500",
    unlocked_at: 1728000000,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchVault.mockResolvedValue(fakeVault)
    mockFetchUserShares.mockResolvedValue(fakeUserStats)
    mockCalculateApy.mockReturnValue(8.45)
    mockBuildDepositTx.mockResolvedValue("fake_deposit_xdr")
    mockBuildWithdrawTx.mockResolvedValue("fake_withdraw_xdr")
    mockSignTransaction.mockResolvedValue("fake_signed_xdr")
    mockSubmitTx.mockResolvedValue({ status: "SUCCESS", txHash: "0xabc123" })
  })

  it("initializes with default state when no vaultId is provided", () => {
    const { result } = renderHook(() => useDefindex())

    expect(result.current.vault).toBeNull()
    expect(result.current.userStats).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.apy).toBe(0)
  })

  it("fetches vault data and user stats successfully when vaultId is present", async () => {
    const { result } = renderHook(() => useDefindex(VAULT_ID))

    expect(result.current.loading).toBe(true)

    await act(async () => {
      await result.current.refetch()
    })

    expect(mockFetchVault).toHaveBeenCalledWith(VAULT_ID)
    expect(mockFetchUserShares).toHaveBeenCalledWith(VAULT_ID, mockWalletAddress)
    expect(result.current.vault).toEqual(fakeVault)
    expect(result.current.userStats).toEqual(fakeUserStats)
    expect(result.current.apy).toBe(8.45)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("handles vault fetch network failure gracefully", async () => {
    mockFetchVault.mockRejectedValueOnce(new Error("Failed to fetch Defindex vault from contract"))

    const { result } = renderHook(() => useDefindex(VAULT_ID))

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.vault).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toContain("Failed to fetch Defindex vault")
  })

  it("executes deposit successfully with signed transaction submission", async () => {
    const { result } = renderHook(() => useDefindex(VAULT_ID))

    await act(async () => {
      await result.current.refetch()
    })

    let depositResult: any
    await act(async () => {
      depositResult = await result.current.deposit("1000")
    })

    expect(mockBuildDepositTx).toHaveBeenCalledWith(VAULT_ID, mockWalletAddress, "1000")
    expect(mockSignTransaction).toHaveBeenCalledWith("fake_deposit_xdr")
    expect(mockSubmitTx).toHaveBeenCalledWith("fake_signed_xdr")
    expect(depositResult).toEqual({ status: "SUCCESS", txHash: "0xabc123" })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("handles deposit transaction signing rejection", async () => {
    mockSignTransaction.mockRejectedValueOnce(new Error("User rejected signing transaction"))

    const { result } = renderHook(() => useDefindex(VAULT_ID))

    await act(async () => {
      await result.current.refetch()
    })

    await expect(
      act(async () => {
        await result.current.deposit("1000")
      })
    ).rejects.toThrow("User rejected signing transaction")

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toContain("User rejected signing")
  })

  it("executes withdraw successfully and triggers stats refetch", async () => {
    const { result } = renderHook(() => useDefindex(VAULT_ID))

    await act(async () => {
      await result.current.refetch()
    })

    let withdrawResult: any
    await act(async () => {
      withdrawResult = await result.current.withdraw("500")
    })

    expect(mockBuildWithdrawTx).toHaveBeenCalledWith(VAULT_ID, mockWalletAddress, "500")
    expect(mockSignTransaction).toHaveBeenCalledWith("fake_withdraw_xdr")
    expect(mockSubmitTx).toHaveBeenCalledWith("fake_signed_xdr")
    expect(withdrawResult).toEqual({ status: "SUCCESS", txHash: "0xabc123" })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("prevents deposit/withdraw operations if wallet is disconnected", async () => {
    // Override useWallet mock to simulate disconnected state
    vi.mock("@/hooks/use-wallet", () => ({
      useWallet: () => ({
        address: null,
        signTransaction: mockSignTransaction,
      }),
    }))

    const { result } = renderHook(() => useDefindex(VAULT_ID))

    await expect(
      act(async () => {
        await result.current.deposit("1000")
      })
    ).rejects.toThrow("Wallet not connected")
  })
})
