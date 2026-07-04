"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { playScratchGame } from "@/lib/actions-advanced";

type Game = {
  id: string;
  gameId: string;
  won: boolean;
  prize: number;
  createdAt: Date;
  customer: { name: string | null; email: string | null } | null;
};

type Customer = { id: string; name: string | null; email: string | null };

export function ScratchGamesManager({
  games,
  customers,
}: {
  games: Game[];
  customers: Customer[];
}) {
  const router = useRouter();
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0]?.id ?? "");
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<{ won: boolean; prize: number } | null>(null);
  const [scratchRevealed, setScratchRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePlay() {
    if (!selectedCustomer) return;
    setPlaying(true);
    setError(null);
    setResult(null);
    setScratchRevealed(false);

    try {
      const res = await playScratchGame({
        customerId: selectedCustomer,
        gameId: "SCRATCH-" + Date.now(),
      });
      setResult(res);
      // Start scratch animation
      setTimeout(() => setScratchRevealed(true), 300);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to play");
    } finally {
      setPlaying(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Scratch Card Simulator */}
      <div className="card">
        <h2 className="font-display text-lg font-semibold text-espresso">Play a Game</h2>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Customer</label>
            <select
              className="input"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.email || "Unknown"}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-gold" onClick={handlePlay} disabled={playing || !selectedCustomer}>
            {playing ? "Scratching…" : "Scratch & Play"}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-clay">{error}</p>}

        {result && (
          <div className="mt-6 flex justify-center">
            <div
              className={`scratch-card relative h-48 w-72 cursor-pointer overflow-hidden rounded-card border-2 transition-all duration-500 ${
                scratchRevealed
                  ? result.won
                    ? "border-gold bg-gradient-to-br from-gold/20 to-gold/5"
                    : "border-espresso/20 bg-parchment/40"
                  : "border-espresso/30 bg-gradient-to-br from-espresso to-roast"
              }`}
              onClick={() => !scratchRevealed && setScratchRevealed(true)}
            >
              {!scratchRevealed && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-cream">
                    <div className="text-4xl font-display font-bold">?</div>
                    <p className="mt-2 text-sm opacity-70">Click to reveal</p>
                  </div>
                </div>
              )}
              {scratchRevealed && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    {result.won ? (
                      <>
                        <div className="text-5xl">🎉</div>
                        <p className="mt-2 font-display text-2xl font-bold text-gold-dark">You won!</p>
                        <p className="mt-1 text-lg font-semibold text-espresso">{result.prize} points</p>
                      </>
                    ) : (
                      <>
                        <div className="text-5xl">😢</div>
                        <p className="mt-2 font-display text-xl font-semibold text-espresso/60">No luck</p>
                        <p className="mt-1 text-sm text-espresso/40">Try again tomorrow!</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recent Games */}
      <div>
        <h2 className="font-display text-lg font-semibold text-espresso">Recent Games</h2>
        <div className="mt-4 overflow-hidden rounded-card border border-espresso/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-parchment/60 text-xs uppercase tracking-wide text-espresso/60">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Prize</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/10 bg-white/50">
              {games.map((g) => (
                <tr key={g.id} className="hover:bg-parchment/30">
                  <td className="px-4 py-3 font-medium">{g.customer?.name || g.customer?.email || "—"}</td>
                  <td className="px-4 py-3">
                    {g.won ? (
                      <span className="rounded-full bg-pine/15 px-2.5 py-1 text-xs font-semibold text-pine-dark">Win</span>
                    ) : (
                      <span className="rounded-full bg-espresso/10 px-2.5 py-1 text-xs font-semibold text-espresso/60">Loss</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{g.won ? `${g.prize} pts` : "—"}</td>
                  <td className="px-4 py-3 text-espresso/50">{g.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
              {games.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-espresso/50">No games played yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .scratch-card {
          box-shadow: 0 4px 24px rgba(43, 29, 20, 0.12);
        }
        .scratch-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(43, 29, 20, 0.18);
        }
      `}</style>
    </div>
  );
}
