export function createCountdownTimer(
  expiresAt: string | Date,
  onTick: (remainingSeconds: number, expired: boolean) => void
): () => void {
  const expiryTime =
    typeof expiresAt === 'string'
      ? new Date(expiresAt).getTime()
      : expiresAt.getTime();

  const interval = setInterval(() => {
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
    const isExpired = remaining === 0;
    onTick(remaining, isExpired);
    if (isExpired) clearInterval(interval);
  }, 1000);

  // ✅ Return cleanup function
  return () => clearInterval(interval);
}