'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Panel } from '@/components/ui/Panel';
import { Sprite } from '@/components/ui/Sprite';
import { CoinIcon } from '@/components/ui/CoinIcon';
import type { InventorySlot } from '@/domain/inventory/types';

const CATEGORY_LABEL = { flower: 'Ingredient', ingredient: 'Ingredient', potion: 'Potion', decor: 'Decoration' } as const;

export function InventoryPanel() {
  const isOpen = useGameStore((s) => s.isInventoryOpen);
  const inventory = useGameStore((s) => s.inventoryState);
  const toggleInventory = useGameStore((s) => s.toggleInventory);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const selected: InventorySlot | undefined =
    inventory.slots.find((slot) => slot.item.id === selectedId) ?? inventory.slots[0];
  const empty = Math.max(0, inventory.maxCapacity - inventory.slots.length);

  return (
    <Panel
      title="Bag"
      subtitle={`${inventory.slots.length} of ${inventory.maxCapacity} slots used`}
      onClose={() => toggleInventory(false)}
      width="max-w-2xl"
    >
      {inventory.slots.length === 0 ? (
        <p className="py-6 text-center">
          Your bag is empty. Pick flowers in the garden or forage in the forest to fill it.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-[1fr_14rem]">
          <ul className="grid grid-cols-4 gap-2.5 sm:grid-cols-6" aria-label="Items">
            {inventory.slots.map((slot, index) => {
              const isSelected = slot === selected || slot.item.id === selected?.item.id;
              return (
                <li key={`${slot.item.id}-${index}`}>
                  <button
                    data-autofocus={index === 0 ? true : undefined}
                    onClick={() => setSelectedId(slot.item.id)}
                    onFocus={() => setSelectedId(slot.item.id)}
                    aria-pressed={isSelected}
                    aria-label={`${slot.item.name}, ${slot.quantity}`}
                    className={`well relative flex aspect-square w-full items-center justify-center ${
                      isSelected ? 'frame !bg-paper' : ''
                    }`}
                  >
                    <Sprite src={`approved/${slot.item.icon}`} alt="" size={36} />
                    <span className="absolute bottom-0.5 right-1 font-display text-sm tabular-nums">
                      {slot.quantity}
                    </span>
                  </button>
                </li>
              );
            })}
            {Array.from({ length: Math.min(empty, 12) }).map((_, i) => (
              <li key={`empty-${i}`} aria-hidden className="well aspect-square opacity-50" />
            ))}
          </ul>

          {selected && (
            <aside className="well self-start p-4" aria-live="polite">
              <Sprite src={`approved/${selected.item.icon}`} alt="" size={48} />
              <h3 className="mt-2 font-display text-lg">{selected.item.name}</h3>
              <p className="text-sm text-ink/70">
                {CATEGORY_LABEL[selected.item.category]}, {selected.quantity} in bag
              </p>
              <p className="mt-2 text-sm">{selected.item.desc}</p>
              <p className="mt-3 flex items-center gap-1.5 font-display">
                <CoinIcon size={14} />
                Worth {selected.item.price}
              </p>
            </aside>
          )}
        </div>
      )}
    </Panel>
  );
}
