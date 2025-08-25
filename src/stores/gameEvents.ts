import { defineStore } from 'pinia';
import { useNostrStore } from './nostr';
import { useLocalStorage } from '@vueuse/core';
import NDK, { NDKEvent, NDKFilter, NDKKind } from '@nostr-dev-kit/ndk';
import { notifyError, notifySuccess, notifyWarning } from '../js/notify';

// Nostr Event Kinds for Manastr Game - Following NIP conventions
export const MANASTR_EVENT_KINDS = {
  // Use NIP-99 Classified Listings for game challenges (perfect fit!)
  GAME_CHALLENGE: 30402,         // Game challenge listing (addressable/replaceable)
  GAME_CHALLENGE_DRAFT: 30403,   // Draft challenge (addressable/replaceable)
  
  // Use regular events for permanent game history
  GAME_MOVE: 1334,               // Individual game move (regular event, permanent)
  GAME_RESULT: 1335,             // Final game result (regular event, permanent)
  
  // Use NIP-22 Comments for challenge responses and discussions
  CHALLENGE_RESPONSE: 1111,      // Response to challenge (NIP-22 comment)
  
  // Addressable events for player data
  PLAYER_PROFILE: 30315,         // Use NIP-38 User Status for gaming profile
} as const;

// Game event tag definitions
export const GAME_TAGS = {
  GAME_ID: 'game_id',
  CHALLENGE_ID: 'challenge_id', 
  PLAYER: 'player',
  OPPONENT: 'opponent',
  BATTLE_TYPE: 'battle_type',
  WAGER_AMOUNT: 'wager_amount',
  WAGER_UNIT: 'wager_unit',
  ARMY_HASH: 'army_hash',
  MOVE_TYPE: 'move_type',
  TURN_NUMBER: 'turn',
  GAME_STATUS: 'status',
  RESULT: 'result',
  WINNER: 'winner',
} as const;

export type GameChallenge = {
  id: string;
  challenger: string;
  challengerName?: string;
  battleType: string;
  wagerAmount: number;
  wagerUnit: string;
  message: string;
  armyHash: string;
  armySecrets?: string[]; // Store unit secrets for reservation tracking
  timeLimit: string;
  totalPower: number;
  totalDefense: number;
  unitCount: number;
  createdAt: number;
  status: 'open' | 'accepted' | 'expired' | 'cancelled';
};

export type GameMove = {
  id: string;
  gameId: string;
  player: string;
  turnNumber: number;
  moveType: string;
  moveData: any;
  timestamp: number;
};

export type GameState = {
  gameId: string;
  players: string[];
  currentTurn: number;
  status: 'waiting' | 'active' | 'completed' | 'abandoned';
  lastMove?: GameMove;
  winner?: string;
  createdAt: number;
  updatedAt: number;
};

export const useGameEventsStore = defineStore('gameEvents', {
  state: () => ({
    isInitialized: false,
    connectedRelays: [] as string[],
    
    // Game data
    myChallenges: useLocalStorage<GameChallenge[]>('manastr.myChallenges', []),
    incomingChallenges: useLocalStorage<GameChallenge[]>('manastr.incomingChallenges', []),
    activeGames: useLocalStorage<GameState[]>('manastr.activeGames', []),
    gameHistory: useLocalStorage<GameMove[]>('manastr.gameHistory', []),
    
    // Subscriptions
    challengeSubscription: null as any,
    gameSubscription: null as any,
    
    // Cache for preventing duplicate events
    processedEventIds: useLocalStorage<string[]>('manastr.processedEventIds', []),
  }),

  getters: {
    openChallenges: (state) => state.myChallenges.filter(c => c.status === 'open'),
    acceptedChallenges: (state) => state.myChallenges.filter(c => c.status === 'accepted'),
    
    pendingIncomingChallenges: (state) => 
      state.incomingChallenges.filter(c => c.status === 'open'),
    
    ongoingGames: (state) => 
      state.activeGames.filter(g => g.status === 'active'),
  },

  actions: {
    async initializeGameEvents() {
      console.log('🎮 Initializing game events...');
      
      if (this.isInitialized) {
        console.log('🎮 Already initialized');
        return;
      }
      
      const nostrStore = useNostrStore();
      console.log('🎮 Nostr store state:', {
        initialized: nostrStore.initialized,
        connected: nostrStore.connected,
        pubkey: nostrStore.pubkey?.slice(0, 8) + '...',
        relaysCount: nostrStore.relays?.length
      });
      
      try {
        // Initialize Nostr if not already done
        if (!nostrStore.initialized) {
          console.log('🎮 Initializing Nostr signer...');
          await nostrStore.initSignerIfNotSet();
          console.log('🎮 Nostr signer initialized');
        }
        
        // Connect to relays
        console.log('🎮 Connecting to relays...');
        await this.connectToRelays();
        
        // Start listening for game events
        console.log('🎮 Starting event subscriptions...');
        await this.subscribeToGameEvents();
        
        this.isInitialized = true;
        console.log('🎮 Game events store initialized successfully');
        
      } catch (error) {
        console.error('🎮 Failed to initialize game events:', error);
        notifyError('Failed to connect to game relays');
      }
    },

    async connectToRelays() {
      const nostrStore = useNostrStore();
      console.log('🔗 Connecting to relays...', nostrStore.relays);
      console.log('🔗 Raw relay list:', JSON.stringify(nostrStore.relays));
      
      // Check if localhost:7777 is in the list
      const hasLocalhost = nostrStore.relays.some(relay => 
        (typeof relay === 'string' ? relay : relay.url || relay).includes('localhost:7777')
      );
      console.log('🔗 Has localhost:7777 relay?', hasLocalhost);
      
      // Force add localhost:7777 if missing
      if (!hasLocalhost) {
        console.log('🔗 Adding localhost:7777 to relay list');
        nostrStore.relays.unshift('ws://localhost:7777');
        console.log('🔗 Updated relay list:', JSON.stringify(nostrStore.relays));
      }
      
      // Recreate NDK with updated relay list if localhost was added
      if (!hasLocalhost || !nostrStore.ndk) {
        console.log('🔗 Creating new NDK connection with updated relays...');
        try {
          // Create fresh NDK with updated relay list
          const NDK = (await import('@nostr-dev-kit/ndk')).default;
          nostrStore.ndk = new NDK({ 
            explicitRelayUrls: nostrStore.relays,
            signer: nostrStore.signer 
          });
          await nostrStore.ndk.connect();
          console.log('🔗 NDK created and connected with updated relay list');
        } catch (error) {
          console.error('🔗 Failed to create new NDK:', error);
          // Fallback to existing initialization
          if (!nostrStore.ndk) {
            nostrStore.initNdkReadOnly();
          }
        }
      }
      
      if (!nostrStore.ndk.pool) {
        console.log('🔗 Connecting existing NDK...');
        await nostrStore.ndk.connect();
      }
      
      // Wait a moment for connections to establish
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force connection check
      console.log('🔗 NDK pool status:', nostrStore.ndk.pool?.relays?.size || 0, 'relays');
      
      // Check actual relay connections
      if (nostrStore.ndk.pool?.relays) {
        nostrStore.ndk.pool.relays.forEach((relay, url) => {
          console.log(`🔗 Relay ${url}: status=${relay.connectivity?.status}, connected=${relay.connectivity?.status === 1}`);
        });
      }
      
      // Track connected relays
      this.connectedRelays = nostrStore.relays;
      console.log('🔗 Connected to relays:', this.connectedRelays);
      console.log('🔗 Relay URLs:', nostrStore.relays.map(r => typeof r === 'string' ? r : r.url || r));
    },

    async publishGameChallenge(challengeData: {
      battleType: string;
      wagerAmount: number;
      wagerUnit: string;
      message: string;
      armyData: any[];
      timeLimit: string;
    }) {
      const nostrStore = useNostrStore();
      
      if (!nostrStore.initialized) {
        throw new Error('Nostr not initialized');
      }

      try {
        // Calculate army stats
        const totalPower = challengeData.armyData.reduce((sum, unit) => sum + (unit.power || 0), 0);
        const totalDefense = challengeData.armyData.reduce((sum, unit) => sum + (unit.defense || 0), 0);
        const armyHash = this.calculateArmyHash(challengeData.armyData);
        const armySecrets = challengeData.armyData.map(unit => unit.secret);
        const challengeId = `manastr-${Date.now()}`;

        // Create NIP-99 compatible challenge event
        const event = new NDKEvent();
        event.kind = MANASTR_EVENT_KINDS.GAME_CHALLENGE;
        
        // NIP-99 content should be markdown description
        event.content = `# ${challengeData.battleType} Challenge

${challengeData.message}

## Battle Details
- **Battle Type**: ${challengeData.battleType}  
- **Wager**: ${challengeData.wagerAmount} ${challengeData.wagerUnit}
- **Army Power**: ${totalPower} ⚔️
- **Army Defense**: ${totalDefense} 🛡️
- **Unit Count**: ${challengeData.armyData.length} units
- **Response Time**: ${challengeData.timeLimit}

*Accept this challenge to engage in Manastr battle!*`;
        
        // NIP-99 standardized tags + Manastr-specific extensions
        event.tags = [
          // NIP-99 required tags
          ['d', challengeId], // Addressable event identifier
          ['title', `${challengeData.battleType} Challenge`],
          ['summary', `${challengeData.battleType} battle for ${challengeData.wagerAmount} ${challengeData.wagerUnit}`],
          ['published_at', Math.floor(Date.now() / 1000).toString()],
          ['price', challengeData.wagerAmount.toString(), challengeData.wagerUnit.toUpperCase()],
          ['status', 'active'],
          
          // NIP-99 categories using 't' tags (these are indexed by relays!)
          ['t', 'manastr'],
          ['t', 'game-challenge'],
          ['t', 'trading-card-game'],
          ['t', challengeData.battleType.toLowerCase().replace(/\s+/g, '-')],
          
          // Manastr-specific metadata
          ['army_hash', armyHash],
          ['army_secrets', JSON.stringify(armySecrets)], // Store for reservation tracking
          ['total_power', totalPower.toString()],
          ['total_defense', totalDefense.toString()],
          ['unit_count', challengeData.armyData.length.toString()],
          ['time_limit', challengeData.timeLimit],
          ['game_type', 'manastr'],
          
          // NIP-31 alt tag for non-supporting clients
          ['alt', `Manastr ${challengeData.battleType} battle challenge for ${challengeData.wagerAmount} ${challengeData.wagerUnit}`]
        ];

        // Set NDK instance for signing
        event.ndk = nostrStore.ndk;
        console.log('🚀 About to sign/publish challenge event:');
        console.log('  - Event kind:', event.kind);
        console.log('  - Event tags:', event.tags);
        console.log('  - Connected relays:', nostrStore.relays?.length);
        console.log('  - Content preview:', event.content.slice(0, 100) + '...');
        
        await event.sign();
        console.log('🚀 Signed event, publishing to relays...', event.id);
        const publishResult = await event.publish();
        console.log('🚀 Challenge publish result:', publishResult);
        
        // Log which relays we published to
        if (publishResult && typeof publishResult === 'object') {
          console.log('🚀 Publish details:', Object.keys(publishResult).length, 'relay responses');
        }

        // Add to local state
        const challenge: GameChallenge = {
          id: event.id!,
          challenger: nostrStore.pubkey,
          battleType: challengeData.battleType,
          wagerAmount: challengeData.wagerAmount,
          wagerUnit: challengeData.wagerUnit,
          message: challengeData.message,
          armyHash,
          armySecrets, // Store for reservation tracking
          timeLimit: challengeData.timeLimit,
          totalPower,
          totalDefense,
          unitCount: challengeData.armyData.length,
          createdAt: Date.now(),
          status: 'open'
        };

        this.myChallenges.unshift(challenge);
        
        notifySuccess('Challenge published to Nostr network!');
        console.log('Published challenge event:', event.id);
        return event.id;
        
      } catch (error) {
        console.error('Failed to publish challenge:', error);
        notifyError('Failed to publish challenge to Nostr');
        throw error;
      }
    },

    async acceptChallenge(challenge: GameChallenge, armyData: any[]) {
      const nostrStore = useNostrStore();
      
      try {
        const armyHash = this.calculateArmyHash(armyData);
        const challengeCoordinates = `${MANASTR_EVENT_KINDS.GAME_CHALLENGE}:${challenge.challenger}:manastr-${challenge.id.split('-').pop()}`;
        
        // Use NIP-22 comment to accept challenge
        const event = new NDKEvent();
        event.kind = MANASTR_EVENT_KINDS.CHALLENGE_RESPONSE;
        event.content = `Challenge accepted! Ready for battle.

**My Army Configuration:**
- Power: ${armyData.reduce((sum, unit) => sum + (unit.power || 0), 0)} ⚔️
- Defense: ${armyData.reduce((sum, unit) => sum + (unit.defense || 0), 0)} 🛡️
- Units: ${armyData.length}

*Let the battle begin!*`;
        
        // NIP-22 comment tags structure
        event.tags = [
          // Root scope - the original challenge (uppercase for root)
          ['A', challengeCoordinates], // Address of the challenge
          ['K', MANASTR_EVENT_KINDS.GAME_CHALLENGE.toString()], // Root kind
          ['P', challenge.challenger], // Root author
          
          // Parent item (same as root for top-level comment)
          ['a', challengeCoordinates], // Parent address
          ['e', challenge.id], // Parent event ID
          ['k', MANASTR_EVENT_KINDS.GAME_CHALLENGE.toString()], // Parent kind
          ['p', challenge.challenger], // Parent author
          
          // Manastr-specific metadata
          ['army_hash', armyHash],
          ['response_type', 'accept'],
          ['game_type', 'manastr'],
          
          // Categories for indexing
          ['t', 'manastr'],
          ['t', 'challenge-response'],
          ['t', 'challenge-accepted'],
          
          // NIP-31 alt tag
          ['alt', `Manastr challenge acceptance response`]
        ];

        // Set NDK instance for signing
        event.ndk = nostrStore.ndk;
        await event.sign();
        await event.publish();
        
        // Update local state
        challenge.status = 'accepted';
        
        notifySuccess('Challenge accepted!');
        console.log('Published challenge acceptance:', event.id);
        return event.id;
        
      } catch (error) {
        console.error('Failed to accept challenge:', error);
        notifyError('Failed to accept challenge');
        throw error;
      }
    },

    async subscribeToGameEvents() {
      const nostrStore = useNostrStore();
      
      console.log('📡 Setting up subscriptions...', {
        hasNdk: !!nostrStore.ndk,
        hasPubkey: !!nostrStore.pubkey,
        pubkey: nostrStore.pubkey?.slice(0, 8) + '...'
      });
      
      if (!nostrStore.ndk || !nostrStore.pubkey) {
        console.warn('📡 NDK or pubkey not available for subscription');
        return;
      }

      try {
        // Subscribe to Manastr game challenges (NIP-99 classified listings)
        const challengeFilter: NDKFilter = {
          kinds: [MANASTR_EVENT_KINDS.GAME_CHALLENGE],
          '#t': ['manastr', 'game-challenge'], // These are indexed by relays!
          since: Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60), // Last 7 days
          limit: 100
        };

        console.log('📡 Creating challenge subscription with filter:', challengeFilter);
        this.challengeSubscription = nostrStore.ndk.subscribe(challengeFilter, { 
          closeOnEose: false 
        });

        this.challengeSubscription.on('event', (event: NDKEvent) => {
          console.log('📡 Received challenge event:', event.id);
          console.log('📡 Challenge event details:', {
            kind: event.kind,
            author: event.pubkey.slice(0, 8) + '...',
            tags: event.tags,
            content: event.content.slice(0, 100) + '...'
          });
          this.handleChallengeEvent(event);
        });

        this.challengeSubscription.on('eose', () => {
          console.log('📡 Challenge subscription: End of stored events (EOSE)');
        console.log('📡 Current incoming challenges after EOSE:', this.incomingChallenges.length);
        console.log('📡 Current my challenges after EOSE:', this.myChallenges.length);
        });

        // Subscribe to challenge responses, game moves and results
        const gameFilter: NDKFilter = {
          kinds: [
            MANASTR_EVENT_KINDS.CHALLENGE_RESPONSE, // NIP-22 comments
            MANASTR_EVENT_KINDS.GAME_MOVE,          // Regular events
            MANASTR_EVENT_KINDS.GAME_RESULT         // Regular events
          ],
          '#t': ['manastr'], // Filter by manastr category
          since: Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60), // Last 7 days
          limit: 200
        };

        console.log('📡 Creating game events subscription with filter:', gameFilter);
        this.gameSubscription = nostrStore.ndk.subscribe(gameFilter, {
          closeOnEose: false
        });

        this.gameSubscription.on('event', (event: NDKEvent) => {
          console.log('📡 Received game event:', event.kind, event.id);
          this.handleGameEvent(event);
        });

        console.log('📡 Subscribed to Manastr game events successfully');
        
      } catch (error) {
        console.error('📡 Failed to subscribe to game events:', error);
        notifyWarning('Failed to connect to game network');
      }
    },

    // Make this method public for manual challenge processing
    handleChallengeEvent(event: NDKEvent) {
      // Prevent duplicate processing
      if (this.processedEventIds.includes(event.id!)) {
        return;
      }
      this.processedEventIds.push(event.id!);

      try {
        // Parse NIP-99 classified listing as game challenge
        const title = event.tagValue('title') || 'Game Challenge';
        const priceTag = event.tags.find(tag => tag[0] === 'price');
        const wagerAmount = priceTag ? parseInt(priceTag[1]) : 0;
        const wagerUnit = priceTag ? priceTag[2].toLowerCase() : 'sats';
        const battleType = title.replace(' Challenge', '') || 'Standard Battle';
        const status = event.tagValue('status');
        
        console.log('🎯 Processing challenge event:', {
          title,
          battleType,
          wagerAmount,
          wagerUnit,
          status,
          author: event.pubkey.slice(0, 8) + '...'
        });
        
        // Skip if challenge is sold/completed
        if (status === 'sold' || status === 'completed') {
          return;
        }

        // Parse army secrets if available
        let armySecrets: string[] | undefined;
        try {
          const armySecretsStr = event.tagValue('army_secrets');
          if (armySecretsStr) {
            armySecrets = JSON.parse(armySecretsStr);
          }
        } catch (e) {
          console.warn('Failed to parse army_secrets from challenge event');
        }

        const challenge: GameChallenge = {
          id: event.id!,
          challenger: event.pubkey,
          challengerName: undefined, // Could be resolved from metadata
          battleType,
          wagerAmount,
          wagerUnit,
          message: event.content,
          armyHash: event.tagValue('army_hash') || '',
          armySecrets,
          timeLimit: event.tagValue('time_limit') || '24 hours',
          totalPower: parseInt(event.tagValue('total_power') || '0'),
          totalDefense: parseInt(event.tagValue('total_defense') || '0'),
          unitCount: parseInt(event.tagValue('unit_count') || '0'),
          createdAt: event.created_at! * 1000,
          status: 'open'
        };

        // Don't add our own challenges to incoming
        const nostrStore = useNostrStore();
        console.log('🎯 Challenge author check:', {
          challengerPubkey: challenge.challenger,
          ourPubkey: nostrStore.pubkey,
          isOurChallenge: challenge.challenger === nostrStore.pubkey
        });
        
        if (challenge.challenger !== nostrStore.pubkey) {
          // Check if challenge already exists
          const exists = this.incomingChallenges.find(c => c.id === challenge.id);
          if (!exists) {
            this.incomingChallenges.unshift(challenge);
            console.log('🎯 Added new incoming challenge from:', challenge.challenger.slice(0, 8) + '...');
            console.log('🎯 Total incoming challenges now:', this.incomingChallenges.length);
            
            // Optional: Show notification for new challenges
            notifySuccess(`New ${battleType} challenge received!`);
          } else {
            console.log('🎯 Challenge already exists, skipping');
          }
        } else {
          // Add to our challenges list
          const exists = this.myChallenges.find(c => c.id === challenge.id);
          if (!exists) {
            this.myChallenges.unshift(challenge);
            console.log('🎯 Added our published challenge to myChallenges');
          }
        }
        
      } catch (error) {
        console.error('Failed to process challenge event:', error);
      }
    },

    handleGameEvent(event: NDKEvent) {
      // Prevent duplicate processing
      if (this.processedEventIds.includes(event.id!)) {
        return;
      }
      this.processedEventIds.push(event.id!);

      console.log('Received game event:', event.kind, event.id);
      
      // Handle different game event types
      switch (event.kind) {
        case MANASTR_EVENT_KINDS.CHALLENGE_RESPONSE:
          this.handleChallengeResponse(event);
          break;
        case MANASTR_EVENT_KINDS.GAME_MOVE:
          this.handleGameMove(event);
          break;
        case MANASTR_EVENT_KINDS.GAME_RESULT:
          this.handleGameResult(event);
          break;
      }
    },

    handleChallengeResponse(event: NDKEvent) {
      // Parse NIP-22 comment response
      const responseType = event.tagValue('response_type');
      const referencedEventId = event.tagValue('e'); // Parent event ID
      
      if (!referencedEventId) return;

      if (responseType === 'accept') {
        // Update my challenge status if it was accepted
        const myChallenge = this.myChallenges.find(c => c.id === referencedEventId);
        if (myChallenge) {
          myChallenge.status = 'accepted';
          console.log('My challenge was accepted:', referencedEventId);
          notifySuccess(`Your ${myChallenge.battleType} challenge was accepted!`);
        }
      }
      
      // Could handle other response types like 'decline', 'comment', etc.
    },

    handleGameMove(event: NDKEvent) {
      // TODO: Implement game move handling
      console.log('Game move received:', event.id);
    },

    handleGameResult(event: NDKEvent) {
      // TODO: Implement game result handling  
      console.log('Game result received:', event.id);
    },

    calculateArmyHash(armyData: any[]): string {
      // Create a deterministic hash of the army configuration
      const armyString = JSON.stringify(armyData.map(unit => ({
        secret: unit.secret,
        amount: unit.amount,
      })).sort((a, b) => a.secret.localeCompare(b.secret)));
      
      // Simple hash function (in production, use a proper crypto hash)
      let hash = 0;
      for (let i = 0; i < armyString.length; i++) {
        const char = armyString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash.toString(16);
    },

    // Cleanup old processed event IDs to prevent memory leaks
    cleanupProcessedEvents() {
      if (this.processedEventIds.length > 1000) {
        this.processedEventIds = this.processedEventIds.slice(-500);
      }
    },

    async disconnectGameEvents() {
      if (this.challengeSubscription) {
        this.challengeSubscription.stop();
        this.challengeSubscription = null;
      }
      
      if (this.gameSubscription) {
        this.gameSubscription.stop();
        this.gameSubscription = null;
      }
      
      this.isInitialized = false;
      console.log('Disconnected from game events');
    }
  }
});