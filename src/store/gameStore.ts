/**
 * The single source of truth shared by the React interface and the Phaser
 * scenes. Game rules live in the domain services; this store owns them,
 * exposes plain snapshots for rendering, and handles saving and loading.
 */
import { create } from 'zustand';
import { InventoryService } from '@/domain/inventory/InventoryService';
import { EconomyService } from '@/domain/economy/EconomyService';
import { BrewResult, CraftingService } from '@/domain/crafting/CraftingService';
import { CustomerService, CustomerProfile } from '@/domain/customer/CustomerService';
import { ProgressionService, ReputationSnapshot } from '@/domain/progression/ProgressionService';
import { InventoryState, InventorySlot } from '@/domain/inventory/types';
import { Currencies } from '@/domain/economy/types';
import { DialoguePayload, InteractionPromptPayload } from '@/game/events/EventTypes';
import { EventBus } from '@/game/events/EventBus';
import { ClockSnapshot, gameClock } from '@/game/systems/GameClock';
import { GAME_ITEMS, RECIPES, STARTING_STATE } from '@/game/data/items';
import { resetVirtualInput } from '@/game/input/virtualInput';
import { sounds } from '@/lib/sound';
import { haptic } from '@/lib/device';
import { music } from '@/lib/music';
import { audio } from '@/lib/audio';
import { AudioSettings, DEFAULT_AUDIO_SETTINGS, loadAudioSettings, saveAudioSettings } from '@/lib/settings';
import { PlayableScene, SaveData, SaveManager } from '@/lib/SaveManager';

export type GamePhase = 'title' | 'playing';
export type ToastTone = 'info' | 'good' | 'warn';

export interface Toast {
  id: number;
  text: string;
  tone: ToastTone;
}

export interface ScenePosition {
  scene: PlayableScene;
  x: number | null;
  y: number | null;
}

export type HarvestResult = 'ok' | 'full' | 'unknown';
export type ServeResult =
  | { success: true; customer: CustomerProfile }
  | { success: false; customer: CustomerProfile | null };

interface Services {
  inventoryService: InventoryService;
  economyService: EconomyService;
  craftingService: CraftingService;
  customerService: CustomerService;
  progressionService: ProgressionService;
}

export interface GameStoreState extends Services {
  phase: GamePhase;
  hasSave: boolean;
  /** Summary of the stored save for the title screen. */
  saveSummary: { day: number; petals: number } | null;

  locationName: string;
  currencies: Currencies;
  inventoryState: InventoryState;
  activeCustomer: CustomerProfile | null;
  reputation: ReputationSnapshot;
  placedDecor: string[];
  /** Ids of recipes the player has discovered. */
  knownRecipes: string[];
  clock: ClockSnapshot;

  prompt: InteractionPromptPayload;
  dialogue: DialoguePayload | null;
  isCraftingOpen: boolean;
  /** True when the cauldron panel was opened at the cauldron, so brewing is possible. */
  craftingAtCauldron: boolean;
  isInventoryOpen: boolean;
  isDecorOpen: boolean;
  isPauseOpen: boolean;
  toast: Toast | null;
  audioSettings: AudioSettings;

  /** Read persisted settings and save info. Call once in the browser. */
  hydrate: () => void;
  startNewGame: () => void;
  continueGame: () => boolean;
  returnToTitle: () => void;
  saveGame: (position?: ScenePosition) => boolean;

  closeDialogue: () => void;
  toggleInventory: (open?: boolean) => void;
  /** Open or close the cauldron panel. Brewing is only possible when opened at the cauldron. */
  toggleCrafting: (open?: boolean, atCauldron?: boolean) => void;
  toggleDecor: (open?: boolean) => void;
  togglePause: (open?: boolean) => void;
  /** Close whichever panel is on top. Returns false if nothing was open. */
  closeTopPanel: () => boolean;
  showToast: (text: string, tone?: ToastTone) => void;
  dismissToast: (id: number) => void;
  updateAudioSettings: (changes: Partial<AudioSettings>) => void;

  harvestFlower: (flowerId: string) => HarvestResult;
  /** Stir the given ingredients in the cauldron. `discovered` is true the first time a recipe is made. */
  brew: (itemIds: string[]) => BrewResult & { discovered?: boolean };
  serveCustomer: () => ServeResult;
  buyDecor: (decorId: string) => boolean;
}

const NEXT_CUSTOMER_DELAY_MS = 3500;
const DEFAULT_LOCATION = 'Cottage garden';

/** True while a panel is open or the game has not started: the world should not take input. */
export function isUiBlocking(s: GameStoreState): boolean {
  return (
    s.phase !== 'playing' ||
    s.dialogue !== null ||
    s.isCraftingOpen ||
    s.isInventoryOpen ||
    s.isDecorOpen ||
    s.isPauseOpen
  );
}

// --- Where the player is -----------------------------------------------------
// The active scene registers a function that reports the player's position so
// a save made from anywhere (autosave, pause menu) records the right spot.
let positionProvider: (() => ScenePosition) | null = null;
let lastPosition: ScenePosition = { scene: 'CottageGardenScene', x: null, y: null };

export function setPositionProvider(provider: (() => ScenePosition) | null): void {
  positionProvider = provider;
}

let customerTimer: ReturnType<typeof setTimeout> | null = null;
let toastId = 0;

function clearCustomerTimer(): void {
  if (customerTimer) {
    clearTimeout(customerTimer);
    customerTimer = null;
  }
}

const STARTING_RECIPES = RECIPES.filter((r) => r.knownAtStart).map((r) => r.id);

function buildServices(save: SaveData | null): Services & { placedDecor: string[]; knownRecipes: string[] } {
  const stacks = save ? save.inventory : STARTING_STATE.inventory;
  const slots: InventorySlot[] = [];
  for (const stack of stacks) {
    const item = GAME_ITEMS[stack.itemId];
    // Decorations live in the shop, never in the bag (old saves kept both).
    if (item && item.category !== 'decor') slots.push({ item, quantity: stack.quantity });
  }

  const placedDecor = (save ? save.placedDecor : [...STARTING_STATE.placedDecor]).filter(
    (id) => GAME_ITEMS[id]?.category === 'decor'
  );

  const progressionService = new ProgressionService(save ? save.totalPetalsEarned : 0);

  return {
    inventoryService: new InventoryService(STARTING_STATE.inventoryCapacity, slots),
    economyService: new EconomyService(
      save ? save.currencies.petals : STARTING_STATE.petals,
      save ? save.currencies.stardust : STARTING_STATE.stardust
    ),
    craftingService: new CraftingService(RECIPES),
    // Customers ask for fancier potions as the shop's reputation grows.
    customerService: new CustomerService(save ? save.customerQueueIndex : 0, GAME_ITEMS, () => progressionService.getSnapshot().level),
    progressionService,
    placedDecor,
    knownRecipes: Array.from(
      new Set([...STARTING_RECIPES, ...(save?.knownRecipes ?? []).filter((id) => RECIPES.some((r) => r.id === id))])
    ),
  };
}

function snapshots(services: Services) {
  return {
    inventoryState: services.inventoryService.getState(),
    currencies: services.economyService.getCurrencies(),
    activeCustomer: services.customerService.getActiveCustomer(),
    reputation: services.progressionService.getSnapshot(),
  };
}

const CLOSED_PANELS = {
  dialogue: null,
  isCraftingOpen: false,
  craftingAtCauldron: false,
  isInventoryOpen: false,
  isDecorOpen: false,
  isPauseOpen: false,
  prompt: { active: false } as InteractionPromptPayload,
};

export const useGameStore = create<GameStoreState>((set, get) => {
  const initial = buildServices(null);

  const refresh = () => set(snapshots(get()));

  const enterWorld = (save: SaveData | null) => {
    clearCustomerTimer();
    resetVirtualInput();
    const built = buildServices(save);
    lastPosition = save
      ? { scene: save.scene, x: save.playerX, y: save.playerY }
      : { scene: 'CottageGardenScene', x: null, y: null };
    positionProvider = null;

    set({ ...built, ...snapshots(built), ...CLOSED_PANELS, phase: 'playing', toast: null });
    gameClock.reset(save?.day, save?.dayProgress);

    EventBus.emit('START_GAME', { scene: lastPosition.scene, spawnX: lastPosition.x, spawnY: lastPosition.y });
  };

  EventBus.on('PROMPT_CHANGE', (payload) => set({ prompt: payload }));
  EventBus.on('OPEN_DIALOGUE', (payload) => set({ dialogue: payload }));
  EventBus.on('OPEN_CRAFTING', () => get().toggleCrafting(true, true));
  EventBus.on('SCENE_LOADED', ({ locationName }) => set({ locationName }));
  EventBus.on('TIME_TICK', (clock) => set({ clock }));

  return {
    ...initial,
    ...snapshots(initial),
    ...CLOSED_PANELS,

    phase: 'title',
    hasSave: false,
    saveSummary: null,
    locationName: DEFAULT_LOCATION,
    clock: gameClock.snapshot(),
    toast: null,
    audioSettings: { ...DEFAULT_AUDIO_SETTINGS },

    hydrate: () => {
      const audioSettings = loadAudioSettings();
      audio.applySettings(audioSettings);
      const save = SaveManager.load();
      set({
        audioSettings,
        hasSave: save !== null,
        saveSummary: save ? { day: save.day, petals: save.currencies.petals } : null,
      });
    },

    startNewGame: () => {
      SaveManager.deleteSave();
      enterWorld(null);
      get().saveGame();
    },

    continueGame: () => {
      const save = SaveManager.load();
      if (!save) {
        set({ hasSave: false, saveSummary: null });
        return false;
      }
      enterWorld(save);
      return true;
    },

    returnToTitle: () => {
      if (get().phase !== 'playing') return;
      get().saveGame();
      clearCustomerTimer();
      positionProvider = null;
      resetVirtualInput();
      set({ ...CLOSED_PANELS, phase: 'title', toast: null, locationName: DEFAULT_LOCATION });
      get().hydrate();
      music.play('title');
      EventBus.emit('RETURN_TO_TITLE');
    },

    saveGame: (position) => {
      const s = get();
      if (s.phase !== 'playing') return false;
      lastPosition = position ?? positionProvider?.() ?? lastPosition;
      const currencies = s.economyService.getCurrencies();
      const saved = SaveManager.save({
        currencies,
        inventory: s.inventoryService.getState().slots.map((slot) => ({
          itemId: slot.item.id,
          quantity: slot.quantity,
        })),
        placedDecor: s.placedDecor,
        scene: lastPosition.scene,
        playerX: lastPosition.x,
        playerY: lastPosition.y,
        day: gameClock.getDay(),
        dayProgress: gameClock.getProgress(),
        totalPetalsEarned: s.progressionService.getSnapshot().totalPetalsEarned,
        customerQueueIndex: s.customerService.getResumeIndex(),
        knownRecipes: s.knownRecipes,
      });
      if (saved) {
        set({ hasSave: true, saveSummary: { day: gameClock.getDay(), petals: currencies.petals } });
      }
      return saved;
    },

    closeDialogue: () => set({ dialogue: null }),

    toggleInventory: (open) => {
      const s = get();
      if (s.phase !== 'playing') return;
      const next = open ?? !s.isInventoryOpen;
      set({ isInventoryOpen: next, ...(next ? { isCraftingOpen: false, isDecorOpen: false, isPauseOpen: false } : {}) });
    },

    toggleCrafting: (open, atCauldron = false) => {
      const s = get();
      if (s.phase !== 'playing') return;
      const next = open ?? !s.isCraftingOpen;
      set({
        isCraftingOpen: next,
        craftingAtCauldron: next && atCauldron,
        ...(next ? { isInventoryOpen: false, isDecorOpen: false, isPauseOpen: false } : {}),
      });
    },

    toggleDecor: (open) => {
      const s = get();
      if (s.phase !== 'playing') return;
      const next = open ?? !s.isDecorOpen;
      set({ isDecorOpen: next, ...(next ? { isInventoryOpen: false, isCraftingOpen: false, isPauseOpen: false } : {}) });
    },

    togglePause: (open) => {
      const s = get();
      if (s.phase !== 'playing') return;
      const next = open ?? !s.isPauseOpen;
      set({ isPauseOpen: next, ...(next ? { isInventoryOpen: false, isCraftingOpen: false, isDecorOpen: false } : {}) });
    },

    closeTopPanel: () => {
      const s = get();
      if (s.dialogue) set({ dialogue: null });
      else if (s.isPauseOpen) set({ isPauseOpen: false });
      else if (s.isCraftingOpen) set({ isCraftingOpen: false });
      else if (s.isInventoryOpen) set({ isInventoryOpen: false });
      else if (s.isDecorOpen) set({ isDecorOpen: false });
      else return false;
      return true;
    },

    showToast: (text, tone = 'info') => set({ toast: { id: ++toastId, text, tone } }),

    dismissToast: (id) => {
      if (get().toast?.id === id) set({ toast: null });
    },

    updateAudioSettings: (changes) => {
      const audioSettings = { ...get().audioSettings, ...changes };
      audio.applySettings(audioSettings);
      saveAudioSettings(audioSettings);
      set({ audioSettings });
    },

    harvestFlower: (flowerId) => {
      const item = GAME_ITEMS[flowerId];
      if (!item) return 'unknown';
      const s = get();
      if (!s.inventoryService.addItem(item, 1).success) {
        sounds.playDenied();
        s.showToast('Your bag is full. Brew or sell something first.', 'warn');
        return 'full';
      }
      sounds.playHarvest();
      haptic(10);
      refresh();
      s.saveGame();
      return 'ok';
    },

    brew: (itemIds) => {
      const s = get();
      if (!s.craftingAtCauldron) return { outcome: 'missing' };
      const result = s.craftingService.brew(itemIds, s.inventoryService);
      if (result.outcome !== 'potion') {
        sounds.playDenied();
        return result;
      }
      sounds.playBrew();
      haptic([12, 50, 12]);
      const discovered = !s.knownRecipes.includes(result.recipe.id);
      if (discovered) {
        set({ knownRecipes: [...s.knownRecipes, result.recipe.id] });
        sounds.playLevelUp();
      }
      refresh();
      s.saveGame();
      return { ...result, discovered };
    },

    serveCustomer: () => {
      const s = get();
      const customer = s.customerService.getActiveCustomer();
      if (!customer) return { success: false, customer: null };

      if (!s.inventoryService.removeItem(customer.desiredItemId, 1).success) {
        return { success: false, customer };
      }

      s.economyService.earn(customer.paymentCoins, 0, `Sold to ${customer.name}`);
      const { leveledUp, tier } = s.progressionService.recordPetalsEarned(customer.paymentCoins);
      s.customerService.dismissCustomer();
      sounds.playCoin();
      haptic(20);

      if (leveledUp) {
        sounds.playLevelUp();
        s.showToast(`Your reputation grew: ${tier.title}`, 'good');
      }

      // The next visitor arrives after a short pause.
      clearCustomerTimer();
      const service = s.customerService;
      customerTimer = setTimeout(() => {
        customerTimer = null;
        // Ignore if a different game was started or loaded in the meantime.
        if (get().customerService !== service || get().phase !== 'playing') return;
        service.spawnNextCustomer();
        set({ activeCustomer: service.getActiveCustomer() });
      }, NEXT_CUSTOMER_DELAY_MS);

      refresh();
      s.saveGame();
      return { success: true, customer };
    },

    buyDecor: (decorId) => {
      const item = GAME_ITEMS[decorId];
      const s = get();
      if (!item || item.category !== 'decor' || s.placedDecor.includes(decorId)) return false;
      if (!s.economyService.spend(item.price, 0, `Bought ${item.name}`).success) {
        sounds.playDenied();
        return false;
      }
      sounds.playCoin();
      set({ placedDecor: [...s.placedDecor, decorId] });
      refresh();
      s.saveGame();
      return true;
    },
  };
});
