/**
 * SaveManager persists game progress to localStorage.
 *
 * Saves are versioned. Anything read from storage is treated as untrusted:
 * it is migrated to the current version and sanitised before use, so a
 * corrupted or hand-edited save can never crash the game.
 */
import { safeStorage } from './storage';

const SAVE_KEY = 'littlethings_save';
const LEGACY_SAVE_KEY_V1 = 'littlethings_save_v1';

export const SAVE_VERSION = 2;

export const PLAYABLE_SCENES = ['CottageGardenScene', 'PotionShopScene', 'EnchantedForestScene'] as const;
export type PlayableScene = (typeof PLAYABLE_SCENES)[number];

export interface SaveData {
  version: typeof SAVE_VERSION;
  timestamp: number;
  currencies: { petals: number; stardust: number };
  inventory: Array<{ itemId: string; quantity: number }>;
  placedDecor: string[];
  scene: PlayableScene;
  /** null means "use the scene's default spawn point". */
  playerX: number | null;
  playerY: number | null;
  day: number;
  /** Progress through the current day, 0..1 (0.25 is 06:00). */
  dayProgress: number;
  totalPetalsEarned: number;
  customerQueueIndex: number;
  /** Recipes found by experimenting; null in saves made before discovery existed. */
  knownRecipes: string[] | null;
}

export type SavePayload = Omit<SaveData, 'version' | 'timestamp'>;

const MAX_CURRENCY = 9_999_999;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toInt(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function toNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function toCoordinate(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.min(4096, Math.max(0, value));
}

function isPlayableScene(value: unknown): value is PlayableScene {
  return typeof value === 'string' && (PLAYABLE_SCENES as readonly string[]).includes(value);
}

/**
 * Convert raw parsed JSON of any known version into valid current-version
 * save data. Returns null when the data is not a recognisable save.
 */
export function parseSave(raw: unknown): SaveData | null {
  if (!isRecord(raw)) return null;
  const version = raw.version;
  if (version !== 1 && version !== SAVE_VERSION) return null;

  const currencies = isRecord(raw.currencies) ? raw.currencies : {};
  const petals = toInt(currencies.petals, 0, 0, MAX_CURRENCY);

  // v1 stored `inventorySlots` (with nulls); v2 stores `inventory`.
  const rawInventory = version === 1 ? raw.inventorySlots : raw.inventory;
  const inventory: SaveData['inventory'] = [];
  if (Array.isArray(rawInventory)) {
    for (const slot of rawInventory) {
      if (!isRecord(slot) || typeof slot.itemId !== 'string') continue;
      const quantity = toInt(slot.quantity, 0, 0, 9999);
      if (quantity > 0) inventory.push({ itemId: slot.itemId, quantity });
    }
  }

  const placedDecor = Array.isArray(raw.placedDecor)
    ? Array.from(new Set(raw.placedDecor.filter((id): id is string => typeof id === 'string')))
    : [];

  const rawScene = version === 1 ? raw.currentScene : raw.scene;
  // v1 wrote a fixed garden position on most saves regardless of where the
  // player really was, so its coordinates are not worth restoring.
  const trustPosition = version === SAVE_VERSION && isPlayableScene(rawScene);

  return {
    version: SAVE_VERSION,
    timestamp: toNumber(raw.timestamp, Date.now(), 0, Number.MAX_SAFE_INTEGER),
    currencies: { petals, stardust: toInt(currencies.stardust, 0, 0, MAX_CURRENCY) },
    inventory,
    placedDecor,
    scene: isPlayableScene(rawScene) ? rawScene : 'CottageGardenScene',
    playerX: trustPosition ? toCoordinate(raw.playerX) : null,
    playerY: trustPosition ? toCoordinate(raw.playerY) : null,
    day: toInt(version === 1 ? raw.dayCounter : raw.day, 1, 1, 999_999),
    dayProgress: toNumber(raw.dayProgress, 0.25, 0, 0.999999),
    // v1 never tracked lifetime earnings; current coins is the best estimate.
    totalPetalsEarned: toInt(version === 1 ? petals : raw.totalPetalsEarned, petals, 0, Number.MAX_SAFE_INTEGER),
    customerQueueIndex: toInt(raw.customerQueueIndex, 0, 0, Number.MAX_SAFE_INTEGER),
    knownRecipes: Array.isArray(raw.knownRecipes)
      ? Array.from(new Set(raw.knownRecipes.filter((id): id is string => typeof id === 'string')))
      : null,
  };
}

class SaveManagerImpl {
  get hasSave(): boolean {
    return this.load() !== null;
  }

  /** Returns true when the save was written to storage. */
  save(data: SavePayload): boolean {
    const saveData: SaveData = { version: SAVE_VERSION, timestamp: Date.now(), ...data };
    return safeStorage.set(SAVE_KEY, JSON.stringify(saveData));
  }

  load(): SaveData | null {
    const raw = safeStorage.get(SAVE_KEY) ?? safeStorage.get(LEGACY_SAVE_KEY_V1);
    if (!raw) return null;
    try {
      return parseSave(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  deleteSave(): void {
    safeStorage.remove(SAVE_KEY);
    safeStorage.remove(LEGACY_SAVE_KEY_V1);
  }
}

export const SaveManager = new SaveManagerImpl();
