'use client';

import { Backpack, BookOpen, Lamp, Menu, Moon, Sun, Sunrise, Sunset } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { VolumeButton } from '@/components/ui/VolumeButton';
import type { TimeOfDay } from '@/game/systems/GameClock';

const PHASE_ICON: Record<TimeOfDay, typeof Sun> = { dawn: Sunrise, day: Sun, dusk: Sunset, night: Moon };
const PHASE_LABEL: Record<TimeOfDay, string> = { dawn: 'Dawn', day: 'Daytime', dusk: 'Dusk', night: 'Night' };

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

/** Always-visible status (where, when, money) and the menu buttons. */
export function GameHUD() {
  const locationName = useGameStore((s) => s.locationName);
  const clock = useGameStore((s) => s.clock);
  const petals = useGameStore((s) => s.currencies.petals);
  const reputation = useGameStore((s) => s.reputation);
  const isInventoryOpen = useGameStore((s) => s.isInventoryOpen);
  const isCraftingOpen = useGameStore((s) => s.isCraftingOpen);
  const isDecorOpen = useGameStore((s) => s.isDecorOpen);
  const toggleInventory = useGameStore((s) => s.toggleInventory);
  const toggleCrafting = useGameStore((s) => s.toggleCrafting);
  const toggleDecor = useGameStore((s) => s.toggleDecor);
  const togglePause = useGameStore((s) => s.togglePause);

  const PhaseIcon = PHASE_ICON[clock.phase];
  const progress =
    reputation.nextTierAt === null ? 1 : Math.min(1, reputation.totalPetalsEarned / reputation.nextTierAt);

  return (
    <>
      {/* Where and when on the left, money and reputation on the right */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-3 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4">
        <div className="plaque min-w-0 px-3 py-1.5">
          <p className="truncate font-display text-lg leading-tight">{locationName}</p>
          <p className="flex items-center gap-1.5 whitespace-nowrap text-sm text-paper/85">
            <PhaseIcon className="h-3.5 w-3.5 shrink-0" aria-label={PHASE_LABEL[clock.phase]} strokeWidth={2.5} />
            <span>
              Day {clock.day}, {pad(clock.hour)}:{pad(clock.minute)}
            </span>
          </p>
        </div>

        <div className="flex shrink-0 items-start gap-2">
          <div className="plaque flex flex-col items-end px-3 py-1.5">
            <p className="flex items-center gap-2 font-display text-xl leading-none" aria-label={`${petals} coins`}>
              <CoinIcon size={18} />
              <span className="tabular-nums">{petals}</span>
            </p>
            <div className="mt-1.5 w-24 text-right sm:w-32">
              <p className="text-sm leading-tight text-paper/85">{reputation.title}</p>
              <div
                className="mt-1 h-1.5 bg-ink"
                role="progressbar"
                aria-label="Progress to the next reputation level"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
              >
                <div className="h-full bg-honey" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          </div>
          <div className="pointer-events-auto">
            <VolumeButton />
          </div>
        </div>
      </div>

      {/* Menus */}
      <nav
        aria-label="Game menus"
        className="absolute bottom-3 right-3 z-30 flex flex-col gap-3 pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)] sm:bottom-4 sm:right-4 sm:flex-row"
      >
        <HudButton label="Bag" shortcut="I" pressed={isInventoryOpen} onClick={() => toggleInventory()}>
          <Backpack className="h-5 w-5" strokeWidth={2.25} aria-hidden />
        </HudButton>
        <HudButton label="Recipes" shortcut="B" pressed={isCraftingOpen} onClick={() => toggleCrafting()}>
          <BookOpen className="h-5 w-5" strokeWidth={2.25} aria-hidden />
        </HudButton>
        <HudButton label="Decor" shortcut="M" pressed={isDecorOpen} onClick={() => toggleDecor()}>
          <Lamp className="h-5 w-5" strokeWidth={2.25} aria-hidden />
        </HudButton>
        <HudButton label="Menu" shortcut="Esc" pressed={false} onClick={() => togglePause(true)}>
          <Menu className="h-5 w-5" strokeWidth={2.25} aria-hidden />
        </HudButton>
      </nav>
    </>
  );
}

function HudButton({
  label,
  shortcut,
  pressed,
  onClick,
  children,
}: {
  label: string;
  shortcut: string;
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className="btn btn-dark flex-col !gap-0.5 !px-2.5 !py-1.5 text-base"
      aria-pressed={pressed}
      aria-keyshortcuts={shortcut === 'Esc' ? 'Escape' : shortcut}
      onClick={onClick}
      title={`${label} (${shortcut})`}
    >
      {children}
      <span className="text-sm leading-none">{label}</span>
    </button>
  );
}
