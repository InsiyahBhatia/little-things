'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Panel } from '@/components/ui/Panel';
import { Sprite } from '@/components/ui/Sprite';
import { GAME_ITEMS } from '@/game/data/items';
import { CAULDRON_SLOTS } from '@/domain/crafting/CraftingService';
import type { Recipe } from '@/domain/crafting/types';

type Result =
  | { kind: 'potion'; itemId: string; name: string; discovered: boolean }
  | { kind: 'fizzle' }
  | { kind: 'full' };

const STIR_MS = 700;

/**
 * At the cauldron: put up to three ingredients in and stir to see what you
 * get. Elsewhere it opens as a read-only recipe book.
 */
export function CauldronPanel() {
  const isOpen = useGameStore((s) => s.isCraftingOpen);
  const atCauldron = useGameStore((s) => s.craftingAtCauldron);
  const toggleCrafting = useGameStore((s) => s.toggleCrafting);

  if (!isOpen) return null;

  return (
    <Panel
      title={atCauldron ? 'Cauldron' : 'Recipe book'}
      subtitle={
        atCauldron
          ? 'Drop in up to three ingredients and stir. A wrong mix fizzles, but nothing is lost.'
          : 'Walk to the cauldron in the potion shop to brew.'
      }
      onClose={() => toggleCrafting(false)}
      width={atCauldron ? 'max-w-3xl' : 'max-w-lg'}
    >
      {atCauldron ? (
        <div className="grid gap-6 md:grid-cols-[1fr_15rem]">
          <Brewing />
          <RecipeBook compact />
        </div>
      ) : (
        <RecipeBook />
      )}
    </Panel>
  );
}

function Brewing() {
  const inventory = useGameStore((s) => s.inventoryState);
  const brew = useGameStore((s) => s.brew);
  const activeCustomer = useGameStore((s) => s.activeCustomer);
  const [pot, setPot] = useState<string[]>([]);
  const [stirring, setStirring] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // Ingredients in the bag, minus whatever is already in the pot.
  const ingredients = inventory.slots
    .filter((slot) => slot.item.category === 'flower' || slot.item.category === 'ingredient')
    .reduce<Array<{ id: string; left: number }>>((list, slot) => {
      const existing = list.find((entry) => entry.id === slot.item.id);
      if (existing) existing.left += slot.quantity;
      else list.push({ id: slot.item.id, left: slot.quantity });
      return list;
    }, [])
    .map((entry) => ({ ...entry, left: entry.left - pot.filter((id) => id === entry.id).length }));

  const add = (id: string) => {
    if (stirring || pot.length >= CAULDRON_SLOTS) return;
    setResult(null);
    setPot([...pot, id]);
  };

  const remove = (index: number) => {
    if (stirring) return;
    setPot(pot.filter((_, i) => i !== index));
  };

  const stir = () => {
    if (pot.length === 0 || stirring) return;
    setStirring(true);
    setResult(null);
    timer.current = setTimeout(() => {
      const outcome = brew(pot);
      setStirring(false);
      if (outcome.outcome === 'potion') {
        setResult({ kind: 'potion', itemId: outcome.item.id, name: outcome.item.name, discovered: !!outcome.discovered });
        setPot([]);
      } else if (outcome.outcome === 'full') {
        setResult({ kind: 'full' });
      } else {
        setResult({ kind: 'fizzle' });
        setPot([]);
      }
    }, STIR_MS);
  };

  return (
    <div>
      {/* The pot */}
      <div className="well flex flex-col items-center gap-4 p-4">
        <div className={`relative ${stirring ? 'cauldron-stir' : ''}`}>
          <Sprite src="approved/furniture/cauldron.png" alt="" size={88} />
        </div>
        <ul className="flex gap-3" aria-label="In the cauldron">
          {Array.from({ length: CAULDRON_SLOTS }).map((_, i) => {
            const id = pot[i];
            const item = id ? GAME_ITEMS[id] : undefined;
            return (
              <li key={i}>
                <button
                  className={`flex h-14 w-14 items-center justify-center ${item ? 'frame bg-paper' : 'bg-paper-deep/40'}`}
                  disabled={!item || stirring}
                  onClick={() => remove(i)}
                  aria-label={item ? `Take ${item.name.toLowerCase()} back out` : `Empty slot ${i + 1}`}
                >
                  {item && <Sprite src={`approved/${item.icon}`} alt="" size={36} />}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex gap-3">
          <button className="btn btn-primary" onClick={stir} disabled={pot.length === 0 || stirring} data-autofocus>
            {stirring ? 'Stirring…' : 'Stir'}
          </button>
          <button className="btn" onClick={() => setPot([])} disabled={pot.length === 0 || stirring}>
            Empty
          </button>
        </div>

        <div className="min-h-[3.5rem] text-center" role="status" aria-live="polite">
          {result?.kind === 'potion' && (
            <div className="panel-in flex items-center gap-3 text-left">
              <Sprite src={`approved/${GAME_ITEMS[result.itemId].icon}`} alt="" size={40} />
              <div>
                <p className="font-display text-lg leading-tight">You brewed a {result.name.toLowerCase()}</p>
                <p className="text-sm">
                  {result.discovered ? 'New recipe! It is in your recipe book now.' : 'It is in your bag.'}
                  {activeCustomer?.desiredItemId === result.itemId && ` ${activeCustomer.name} is waiting for one.`}
                </p>
              </div>
            </div>
          )}
          {result?.kind === 'fizzle' && (
            <p className="panel-in">
              <span className="font-display text-lg">Fizzle.</span> That mix does not make anything. Your ingredients
              are back in your bag, so try another combination.
            </p>
          )}
          {result?.kind === 'full' && (
            <p className="panel-in">Your bag is full, so there is nowhere to put the potion. Serve or sell something first.</p>
          )}
        </div>
      </div>

      {/* What can go in */}
      <h3 className="mt-5 font-display text-lg">Your ingredients</h3>
      {ingredients.length === 0 ? (
        <p className="mt-1 text-sm">
          You have no ingredients. Pick flowers in the garden, or forage in the forest over the bridge.
        </p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2.5">
          {ingredients.map(({ id, left }) => {
            const item = GAME_ITEMS[id];
            return (
              <li key={id}>
                <button
                  className="well relative flex w-[4.5rem] flex-col items-center gap-0.5 px-1 pb-1.5 pt-2 disabled:opacity-40"
                  onClick={() => add(id)}
                  disabled={left <= 0 || pot.length >= CAULDRON_SLOTS || stirring}
                  aria-label={`Add ${item.name.toLowerCase()}, ${left} left`}
                >
                  <Sprite src={`approved/${item.icon}`} alt="" size={32} />
                  <span className="text-center text-[0.6875rem] font-bold leading-tight">{item.name}</span>
                  <span className="absolute right-1 top-0.5 font-display text-sm tabular-nums">{left}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function RecipeBook({ compact = false }: { compact?: boolean }) {
  const craftingService = useGameStore((s) => s.craftingService);
  const known = useGameStore((s) => s.knownRecipes);
  const activeCustomer = useGameStore((s) => s.activeCustomer);
  const recipes = craftingService.getRecipes();
  const found = recipes.filter((r) => known.includes(r.id)).length;

  return (
    <section aria-labelledby="recipe-book-heading">
      <h3 id="recipe-book-heading" className="font-display text-lg">
        {compact ? 'Recipe book' : 'Recipes'}{' '}
        <span className="text-base text-ink/60">
          {found} of {recipes.length} found
        </span>
      </h3>
      <ul className="mt-2 space-y-2.5">
        {recipes.map((recipe) => (
          <RecipeEntry
            key={recipe.id}
            recipe={recipe}
            known={known.includes(recipe.id)}
            wanted={activeCustomer?.desiredItemId === recipe.resultItem.id}
          />
        ))}
      </ul>
    </section>
  );
}

function RecipeEntry({ recipe, known, wanted }: { recipe: Recipe; known: boolean; wanted: boolean }) {
  return (
    <li className="well flex gap-3 p-2.5">
      <Sprite
        src={`approved/${recipe.resultItem.icon}`}
        alt=""
        size={32}
        className={`shrink-0 ${known ? '' : 'opacity-40 brightness-0'}`}
      />
      <div className="min-w-0">
        <p className="font-display leading-tight">
          {known ? recipe.name : 'Undiscovered'}
          {wanted && <span className="ml-1.5 text-sm text-rose">wanted</span>}
        </p>
        {known ? (
          <p className="mt-0.5 flex flex-wrap items-center gap-1 text-sm">
            {recipe.ingredients.flatMap((ing) =>
              Array.from({ length: ing.quantity }).map((_, i) => (
                <Sprite
                  key={`${ing.itemId}-${i}`}
                  src={`approved/${GAME_ITEMS[ing.itemId].icon}`}
                  alt={GAME_ITEMS[ing.itemId].name}
                  size={20}
                />
              ))
            )}
          </p>
        ) : (
          <p className="mt-0.5 text-sm italic">{recipe.hint}</p>
        )}
      </div>
    </li>
  );
}
