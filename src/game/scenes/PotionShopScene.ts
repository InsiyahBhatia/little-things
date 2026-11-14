import * as Phaser from 'phaser';
import { EventBus } from '../events/EventBus';
import { BaseWorldScene, Interaction } from './BaseWorldScene';
import { COLORS } from '../config';
import { useGameStore } from '@/store/gameStore';
import { GAME_ITEMS } from '../data/items';
import { sounds } from '@/lib/sound';
import type { CustomerProfile } from '@/domain/customer/CustomerService';

const EXIT = { x: 240, y: 232 };
const CAULDRON = { x: 318, y: 112 };
const COUNTER = { x: 136, y: 162 };

/** Customers come in at the door and walk to the front of the counter. */
const CUSTOMER_PATH = [
  { x: 240, y: 238 },
  { x: 240, y: 200 },
  { x: 136, y: 198 },
];
const CUSTOMER_SPEED = 55; // world pixels per second
/** Mimi can serve from behind the counter or standing next to the customer. */
const BEHIND_COUNTER = { x: 136, y: 116 };

/** Where each decoration goes once bought. */
const DECOR_SPOTS: Record<string, { x: number; y: number; depth: number }> = {
  // On the counter top
  decor_fairy_lantern: { x: 104, y: 128, depth: COUNTER.y + 1 },
  decor_crystal_ball: { x: 168, y: 130, depth: COUNTER.y + 1 },
  // Standing on the floor
  decor_gramophone: { x: 212, y: 84, depth: 84 },
  decor_magic_mirror: { x: 274, y: 82, depth: 82 },
  decor_star_globe: { x: 396, y: 150, depth: 150 },
  decor_rose_barrel: { x: 284, y: 230, depth: 230 },
};

type VisitState = 'entering' | 'waiting' | 'leaving';

interface Visitor {
  profile: CustomerProfile;
  body: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  bubble: Phaser.GameObjects.Container;
  state: VisitState;
}

export class PotionShopScene extends BaseWorldScene {
  protected readonly sceneKey = 'PotionShopScene' as const;
  protected readonly locationName = 'Potion shop';
  protected readonly mood = 'shop' as const;
  protected readonly mapWidth = 480;
  protected readonly mapHeight = 270;
  protected readonly defaultSpawn = { x: 240, y: 210 };
  protected readonly initialFacing = 'up' as const;
  // Indoors is lamp-lit, so night only dims it a little.
  protected readonly lightingStrength = 0.35;

  private visitor: Visitor | null = null;
  private decorSprites = new Map<string, Phaser.GameObjects.Image>();
  private unsubscribe?: () => void;

  constructor() {
    super('PotionShopScene');
  }

  protected buildWorld() {
    this.visitor = null;
    this.decorSprites = new Map();

    // Floorboards, with a welcome mat inside the door
    for (let x = 64; x < 416; x += 16) {
      for (let y = 32; y < 240; y += 16) {
        const isMat = x >= 224 && x <= 256 && y === 224;
        this.tile(x, y, isMat ? 39 : this.noiseAt(x, y) < 25 ? 19 : 3);
      }
    }

    // Back wall with windows, herbs and books
    for (let x = 64; x < 416; x += 16) {
      this.tile(x, 16, 50, 16);
      let frame = 21;
      if (x === 112 || x === 368) frame = 23;
      else if (x === 176 || x === 272) frame = 49;
      else if (x === 224 || x === 240) frame = 48;
      this.tile(x, 32, frame, 32);
    }
    for (let y = 32; y < 240; y += 16) {
      this.tile(64, y, 66, y);
      this.tile(400, y, 66, y);
    }

    this.addWall(240, 36, 352, 24); // back
    this.addWall(58, 136, 16, 210); // left
    this.addWall(422, 136, 16, 210); // right
    this.addWall(144, 244, 160, 16); // front, left of the door
    this.addWall(336, 244, 160, 16); // front, right of the door

    // Along the back wall: shelves, a window and a banner
    this.prop('potion_shelf', 98, 80, { width: 50, height: 12 });
    this.prop('bookshelf', 160, 80, { width: 62, height: 12 });
    this.prop('window_big', 240, 50, undefined, 40);
    this.prop('banner_moon', 300, 50, undefined, 40);
    this.prop('hanging_herbs', 346, 46, undefined, 41);
    this.prop('crystal_cabinet', 376, 80, { width: 48, height: 12 });
    this.addLight(240, 30, 34, 0xbfd4ff, 0.45);

    // The cauldron, bubbling away
    const cauldron = this.prop('cauldron', CAULDRON.x, CAULDRON.y, { width: 32, height: 12 });
    this.tweens.add({ targets: cauldron, scaleY: 1.03, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.addLight(CAULDRON.x, CAULDRON.y - 26, 40, 0xd28cff, 0.7);

    // The counter where customers are served
    this.prop('shop_counter', COUNTER.x, COUNTER.y, { width: 80, height: 18 });
    this.addLight(COUNTER.x + 24, COUNTER.y - 44, 30);

    // A reading corner, a rug and some plants
    this.prop('rug_oval', 262, 184, undefined, 2).setScale(1.5);
    this.prop('armchair', 370, 200, { width: 26, height: 12 });
    this.prop('table_tea', 346, 202, { width: 12, height: 6 });
    this.prop('potted_plant', 398, 230, { width: 14, height: 8 });
    this.prop('planter_hydrangea', 82, 232, { width: 18, height: 8 });
    this.prop('chalkboard', 202, 234, { width: 16, height: 6 });

    // Keep decorations and customers in step with the store, so a purchase or
    // a new visitor shows up straight away.
    const state = useGameStore.getState();
    this.syncDecor(state.placedDecor);
    // Someone already waiting is standing at the counter when Mimi walks in.
    if (state.activeCustomer) this.arrive(state.activeCustomer, true);

    this.unsubscribe = useGameStore.subscribe((next, prev) => {
      if (next.placedDecor !== prev.placedDecor) this.syncDecor(next.placedDecor);
      if (next.activeCustomer !== prev.activeCustomer) this.syncCustomer(next.activeCustomer);
    });
  }

  protected onShutdown() {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  // --- Decorations -----------------------------------------------------------

  private syncDecor(placed: string[]) {
    for (const id of placed) {
      const spot = DECOR_SPOTS[id];
      if (!spot || this.decorSprites.has(id)) continue;
      const sprite = this.add.image(spot.x, spot.y, id).setOrigin(0.5, 1).setDepth(spot.depth);
      this.decorSprites.set(id, sprite);
      // New purchases pop into place.
      this.tweens.add({ targets: sprite, scale: { from: 0, to: 1 }, duration: 260, ease: 'Back.easeOut' });
    }
    for (const [id, sprite] of this.decorSprites) {
      if (!placed.includes(id)) {
        sprite.destroy();
        this.decorSprites.delete(id);
      }
    }
  }

  // --- Customers -------------------------------------------------------------

  private syncCustomer(customer: CustomerProfile | null) {
    if (this.visitor && this.visitor.profile.id !== customer?.id && this.visitor.state !== 'leaving') {
      this.leave(this.visitor);
    }
    if (customer && (!this.visitor || this.visitor.state === 'leaving')) {
      this.arrive(customer, false);
    }
  }

  private arrive(profile: CustomerProfile, alreadyThere: boolean) {
    const start = alreadyThere ? CUSTOMER_PATH[CUSTOMER_PATH.length - 1] : CUSTOMER_PATH[0];
    const sprite = this.add.image(0, 0, profile.spriteKey).setOrigin(0.5, 1);
    const bubble = this.makeWantBubble(profile.desiredItemId, sprite.height);
    const body = this.add.container(start.x, start.y, [sprite, bubble]).setDepth(start.y);

    const visitor: Visitor = { profile, body, sprite, bubble, state: alreadyThere ? 'waiting' : 'entering' };
    this.visitor = visitor;

    if (alreadyThere) {
      this.idle(visitor);
      return;
    }

    sounds.playDoor();
    bubble.setVisible(false);
    body.setAlpha(0);
    this.tweens.add({ targets: body, alpha: 1, duration: 250 });
    this.walk(visitor, CUSTOMER_PATH.slice(1), () => {
      visitor.state = 'waiting';
      bubble.setVisible(true).setScale(0);
      this.tweens.add({ targets: bubble, scale: 1, duration: 220, ease: 'Back.easeOut' });
      this.idle(visitor);
    });
  }

  private leave(visitor: Visitor) {
    visitor.state = 'leaving';
    visitor.bubble.setVisible(false);
    this.tweens.killTweensOf(visitor.sprite);
    visitor.sprite.y = 0;
    const back = [...CUSTOMER_PATH].reverse().slice(1);
    // A happy hop before heading out.
    this.tweens.add({
      targets: visitor.sprite,
      y: -8,
      duration: 160,
      yoyo: true,
      repeat: 1,
      ease: 'Quad.easeOut',
      onComplete: () =>
        this.walk(visitor, back, () => {
          this.tweens.add({
            targets: visitor.body,
            alpha: 0,
            duration: 250,
            onComplete: () => {
              visitor.body.destroy();
              if (this.visitor === visitor) this.visitor = null;
            },
          });
        }),
    });
  }

  /** Walk through `points` one after another with a little bounce in each step. */
  private walk(visitor: Visitor, points: Array<{ x: number; y: number }>, done: () => void) {
    const hop = this.tweens.add({ targets: visitor.sprite, y: -3, duration: 140, yoyo: true, repeat: -1 });
    const step = (i: number) => {
      if (i >= points.length) {
        hop.stop();
        visitor.sprite.y = 0;
        done();
        return;
      }
      const target = points[i];
      const distance = Phaser.Math.Distance.Between(visitor.body.x, visitor.body.y, target.x, target.y);
      if (target.x !== visitor.body.x) visitor.sprite.setFlipX(target.x < visitor.body.x);
      this.tweens.add({
        targets: visitor.body,
        x: target.x,
        y: target.y,
        duration: (distance / CUSTOMER_SPEED) * 1000,
        onUpdate: () => visitor.body.setDepth(visitor.body.y),
        onComplete: () => step(i + 1),
      });
    };
    step(0);
  }

  /** Gentle breathing while waiting at the counter. */
  private idle(visitor: Visitor) {
    visitor.sprite.setFlipX(false);
    this.tweens.add({ targets: visitor.sprite, scaleY: 1.04, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /** A thought bubble above the customer's head showing the potion they want. */
  private makeWantBubble(itemId: string, spriteHeight: number): Phaser.GameObjects.Container {
    const y = -spriteHeight - 16;
    const outline = this.add.rectangle(0, 0, 24, 24, COLORS.ink);
    const fill = this.add.rectangle(0, 0, 22, 22, COLORS.paper);
    const tail = this.add.rectangle(0, 13, 4, 4, COLORS.paper);
    const tailOutline = this.add.rectangle(0, 14, 6, 6, COLORS.ink);
    const icon = this.add.image(0, 0, itemId).setDisplaySize(18, 18);
    const bubble = this.add.container(0, y, [tailOutline, outline, tail, fill, icon]);
    this.tweens.add({ targets: bubble, y: y - 2, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return bubble;
  }

  // --- Each frame ------------------------------------------------------------

  protected updateWorld(time: number, delta: number) {
    // A bubble rises from the cauldron every 0.6 seconds
    if (Math.floor(time / 600) !== Math.floor((time - delta) / 600)) {
      const bubble = this.add
        .circle(CAULDRON.x + Phaser.Math.Between(-8, 8), CAULDRON.y - 34, Phaser.Math.Between(1, 2), 0xd28cff, 0.8)
        .setDepth(CAULDRON.y + 1);
      this.tweens.add({
        targets: bubble,
        y: CAULDRON.y - 56 + Phaser.Math.Between(-6, 6),
        x: bubble.x + Phaser.Math.Between(-8, 8),
        alpha: 0,
        scale: 1.4,
        duration: 1000,
        ease: 'Sine.easeOut',
        onComplete: () => bubble.destroy(),
      });
    }
  }

  protected findInteraction(): Interaction | null {
    if (this.distanceToPlayer(EXIT.x, EXIT.y) < 24) {
      return { id: 'shop_exit', text: 'Step out to the garden', run: () => this.travelTo('CottageGardenScene', 264, 172) };
    }

    if (this.distanceToPlayer(CAULDRON.x, CAULDRON.y + 8) < 32) {
      return { id: 'cauldron', text: 'Brew at the cauldron', run: () => EventBus.emit('OPEN_CRAFTING') };
    }

    const visitor = this.visitor;
    if (
      visitor?.state === 'waiting' &&
      (this.distanceToPlayer(visitor.body.x, visitor.body.y) < 34 ||
        this.distanceToPlayer(BEHIND_COUNTER.x, BEHIND_COUNTER.y) < 30)
    ) {
      const { profile } = visitor;
      const wanted = GAME_ITEMS[profile.desiredItemId];
      const hasIt = useGameStore.getState().inventoryService.hasItem(profile.desiredItemId);
      return {
        id: `serve:${profile.id}:${hasIt}`,
        text: hasIt ? `Give ${profile.name.split(' ')[0]} the ${wanted.name.toLowerCase()}` : `Talk to ${profile.name.split(' ')[0]}`,
        run: () => this.serve(visitor),
      };
    }

    return null;
  }

  private serve(visitor: Visitor) {
    const { profile } = visitor;
    const wanted = GAME_ITEMS[profile.desiredItemId];
    const result = useGameStore.getState().serveCustomer();

    if (!result.success) {
      EventBus.emit('OPEN_DIALOGUE', {
        speakerName: profile.name,
        avatar: profile.avatar,
        text: `${profile.quote} (They want a ${wanted.name.toLowerCase()}. Brew one at the cauldron.)`,
        closeLabel: "I'll brew it",
      });
      return;
    }

    // The potion flies over the counter to the customer.
    const potion = this.add.image(this.player.x, this.player.y - 24, profile.desiredItemId).setDepth(955).setDisplaySize(16, 16);
    this.tweens.add({
      targets: potion,
      x: visitor.body.x,
      y: visitor.body.y - visitor.sprite.height / 2,
      duration: 380,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        potion.destroy();
        this.floatText(visitor.body.x, visitor.body.y - visitor.sprite.height - 10, `+${profile.paymentCoins} coins`, COLORS.honey);
        this.floatText(visitor.body.x + 14, visitor.body.y - visitor.sprite.height, '♥', COLORS.rose);
      },
    });

    EventBus.emit('OPEN_DIALOGUE', {
      speakerName: profile.name,
      avatar: profile.avatar,
      text: profile.completionQuote,
      closeLabel: 'Come again',
    });
  }
}
