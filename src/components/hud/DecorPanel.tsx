'use client';

import { useGameStore } from '@/store/gameStore';
import { Panel } from '@/components/ui/Panel';
import { Sprite } from '@/components/ui/Sprite';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { DECOR_CATALOG } from '@/game/data/items';

export function DecorPanel() {
  const isOpen = useGameStore((s) => s.isDecorOpen);
  const toggleDecor = useGameStore((s) => s.toggleDecor);
  const petals = useGameStore((s) => s.currencies.petals);
  const placedDecor = useGameStore((s) => s.placedDecor);
  const buyDecor = useGameStore((s) => s.buyDecor);

  if (!isOpen) return null;

  return (
    <Panel
      title="Decorations"
      subtitle="Bought pieces go straight into the potion shop."
      onClose={() => toggleDecor(false)}
    >
      <ul className="space-y-3">
        {DECOR_CATALOG.map((item, index) => {
          const owned = placedDecor.includes(item.id);
          const short = item.price - petals;
          return (
            <li key={item.id} className="well flex flex-wrap items-center gap-x-4 gap-y-3 p-3">
              <Sprite src={`approved/${item.icon}`} alt="" size={44} />
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg leading-tight">{item.name}</h3>
                <p className="text-sm">{item.desc}</p>
              </div>
              {owned ? (
                <p className="font-display text-base text-moss">In your shop</p>
              ) : (
                <div className="flex flex-col items-end gap-1">
                  <button
                    className={`btn ${short <= 0 ? 'btn-primary' : ''}`}
                    data-autofocus={index === 0 ? true : undefined}
                    disabled={short > 0}
                    onClick={() => buyDecor(item.id)}
                    aria-label={`Buy ${item.name} for ${item.price} coins`}
                  >
                    <CoinIcon size={16} />
                    {item.price}
                  </button>
                  {short > 0 && <p className="text-sm text-ink/70">{short} more coins needed</p>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
