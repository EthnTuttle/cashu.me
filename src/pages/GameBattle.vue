<template>
  <div class="full-height">
    <!-- Header -->
    <div class="manastr-header" :class="$q.dark.isActive ? 'bg-dark' : 'bg-white'">
      <q-toolbar>
        <q-btn
          flat
          round
          dense
          icon="arrow_back"
          @click="$router.back()"
          class="q-mr-sm"
        />
        <q-toolbar-title>
          Manastr Battle Arena
        </q-toolbar-title>
        <q-space />
        <div class="text-caption">
          Battle in progress...
        </div>
      </q-toolbar>
    </div>

    <!-- Manastr Game Flow Navigation -->
    <div class="game-flow-nav" :class="$q.dark.isActive ? 'bg-grey-8' : 'bg-grey-3'">
      <div class="q-pa-md">
        <div class="text-h6 q-mb-sm">Manastr Game Flow</div>
        <div class="flow-steps">
          <q-btn-group>
            <q-btn 
              color="grey" 
              label="1. Arsenal" 
              icon="shield"
              @click="$router.push('/ecash-browser')"
            />
            <q-btn 
              color="grey" 
              label="2. Challenge" 
              icon="campaign"
              @click="$router.push('/game-challenge')"
            />
            <q-btn 
              color="primary" 
              label="3. Battle" 
              icon="swords"
              class="current-step"
              :disable="true"
            />
            <q-btn 
              color="grey" 
              label="4. Results" 
              icon="emoji_events"
              @click="$router.push('/game-results')"
            />
          </q-btn-group>
        </div>
        <div class="text-caption q-mt-sm" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
          Step 3: Accept challenges from other players or manage your active battles.
        </div>
      </div>
    </div>

    <!-- Battle Management Content -->
    <div class="battle-content" :class="$q.dark.isActive ? 'bg-dark' : 'bg-white'">
      <!-- Tab Navigation -->
      <q-tabs
        v-model="activeTab"
        class="text-primary"
        :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-2'"
      >
        <q-tab name="challenges" icon="campaign" label="Open Challenges" />
        <q-tab name="active" icon="swords" label="Active Battles" />
        <q-tab name="my-challenges" icon="send" label="My Challenges" />
      </q-tabs>

      <q-tab-panels v-model="activeTab" animated>
        <!-- Open Challenges Tab -->
        <q-tab-panel name="challenges" class="q-pa-md">
          <div class="text-h6 q-mb-md">Available Challenges</div>
          <div v-if="openChallenges.length === 0" class="text-center q-pa-xl">
            <q-icon name="search" size="3rem" :color="$q.dark.isActive ? 'grey-6' : 'grey-4'" />
            <div class="text-h6 q-mt-md" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
              No Open Challenges
            </div>
            <div class="text-body2 q-mt-sm" :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-5'">
              Waiting for other players to issue challenges...
              <br>Or create your own challenge to get things started!
            </div>
            <q-btn
              color="primary"
              icon="campaign"
              label="Create Challenge"
              @click="$router.push('/game-challenge')"
              class="q-mt-lg"
            />
          </div>
          
          <!-- Challenge Cards -->
          <div v-else class="challenge-grid">
            <q-card
              v-for="challenge in openChallenges"
              :key="challenge.id"
              class="challenge-card q-mb-md"
              :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
            >
              <q-card-section>
                <div class="row items-center q-mb-sm">
                  <div class="col">
                    <div class="text-h6">{{ challenge.challenger_name || 'Anonymous Warrior' }}</div>
                    <div class="text-caption text-grey-6">{{ challenge.battle_type }}</div>
                  </div>
                  <div class="col-auto">
                    <q-chip color="primary" text-color="white" size="sm">
                      {{ challenge.wager }} {{ challenge.unit || 'mana' }} wager
                    </q-chip>
                  </div>
                </div>
                
                <div class="challenge-message q-mb-md">
                  <q-icon name="format_quote" class="q-mr-sm" />
                  {{ challenge.content || 'A challenge has been issued!' }}
                </div>
                
                <div class="army-summary q-mb-md">
                  <div class="text-subtitle2 q-mb-xs">Army Details</div>
                  <div class="row q-gutter-sm">
                    <q-chip size="xs" color="red" text-color="white">
                      ⚔️ {{ challenge.total_power }} Power
                    </q-chip>
                    <q-chip size="xs" color="blue" text-color="white">
                      🛡️ {{ challenge.total_defense }} Defense
                    </q-chip>
                    <q-chip size="xs" color="grey" text-color="white">
                      👥 {{ challenge.unit_count }} Units
                    </q-chip>
                  </div>
                </div>
                
                <div class="time-info q-mb-md">
                  <q-icon name="schedule" class="q-mr-sm" />
                  <span class="text-caption">{{ challenge.time_limit }} to respond</span>
                </div>
              </q-card-section>
              
              <q-card-actions align="right">
                <q-btn flat color="grey" label="View Details" @click="viewChallengeDetails(challenge)" />
                <q-btn color="primary" label="Accept Challenge" @click="acceptChallenge(challenge)" />
              </q-card-actions>
            </q-card>
          </div>
        </q-tab-panel>

        <!-- Active Battles Tab -->
        <q-tab-panel name="active" class="q-pa-md">
          <div class="text-h6 q-mb-md">Active Battles</div>
          <div v-if="activeBattles.length === 0" class="text-center q-pa-xl">
            <q-icon name="swords" size="3rem" :color="$q.dark.isActive ? 'grey-6' : 'grey-4'" />
            <div class="text-h6 q-mt-md" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
              No Active Battles
            </div>
            <div class="text-body2 q-mt-sm" :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-5'">
              Accept a challenge to start battling!
            </div>
          </div>
          
          <!-- Battle Cards -->
          <div v-else class="battle-grid">
            <q-card
              v-for="battle in activeBattles"
              :key="battle.id"
              class="battle-card q-mb-md"
              :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
            >
              <q-card-section>
                <div class="row items-center q-mb-sm">
                  <div class="col">
                    <div class="text-h6">{{ battle.opponent_name || 'Unknown Opponent' }}</div>
                    <div class="text-caption text-grey-6">{{ battle.battle_type }}</div>
                  </div>
                  <div class="col-auto">
                    <q-badge 
                      :color="battle.your_turn ? 'warning' : 'info'" 
                      :label="battle.your_turn ? 'Your Turn' : 'Waiting'"
                    />
                  </div>
                </div>
                
                <div class="battle-progress q-mb-md">
                  <div class="text-subtitle2 q-mb-xs">Battle Progress</div>
                  <q-linear-progress 
                    :value="battle.progress / 100" 
                    color="primary" 
                    class="q-mb-xs"
                  />
                  <div class="text-caption">Turn {{ battle.current_turn }}/{{ battle.max_turns }}</div>
                </div>
                
                <div class="army-status q-mb-md">
                  <div class="row q-gutter-md">
                    <div class="col">
                      <div class="text-subtitle2">Your Army</div>
                      <div class="text-caption">{{ battle.your_units_remaining }}/{{ battle.your_total_units }} units remaining</div>
                    </div>
                    <div class="col">
                      <div class="text-subtitle2">Enemy Army</div>
                      <div class="text-caption">{{ battle.enemy_units_remaining }}/{{ battle.enemy_total_units }} units remaining</div>
                    </div>
                  </div>
                </div>
              </q-card-section>
              
              <q-card-actions align="right">
                <q-btn flat color="grey" label="Battle Log" @click="viewBattleLog(battle)" />
                <q-btn 
                  :color="battle.your_turn ? 'primary' : 'grey'" 
                  :label="battle.your_turn ? 'Enter Battle' : 'Spectate'"
                  :disable="!battle.your_turn"
                  @click="enterBattle(battle)" 
                />
              </q-card-actions>
            </q-card>
          </div>
        </q-tab-panel>

        <!-- My Challenges Tab -->
        <q-tab-panel name="my-challenges" class="q-pa-md">
          <div class="text-h6 q-mb-md">My Issued Challenges</div>
          <div v-if="myChallenges.length === 0" class="text-center q-pa-xl">
            <q-icon name="send" size="3rem" :color="$q.dark.isActive ? 'grey-6' : 'grey-4'" />
            <div class="text-h6 q-mt-md" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
              No Challenges Issued
            </div>
            <div class="text-body2 q-mt-sm" :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-5'">
              Create your first challenge to start the battle!
            </div>
            <q-btn
              color="primary"
              icon="campaign"
              label="Create Challenge"
              @click="$router.push('/game-challenge')"
              class="q-mt-lg"
            />
          </div>
          
          <!-- My Challenge Cards -->
          <div v-else class="my-challenges-grid">
            <q-card
              v-for="challenge in myChallenges"
              :key="challenge.id"
              class="my-challenge-card q-mb-md"
              :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
            >
              <q-card-section>
                <div class="row items-center q-mb-sm">
                  <div class="col">
                    <div class="text-h6">{{ challenge.battle_type }} Challenge</div>
                    <div class="text-caption text-grey-6">{{ challenge.wager }} {{ challenge.unit || 'mana' }} wager</div>
                  </div>
                  <div class="col-auto">
                    <q-badge 
                      :color="challenge.status === 'open' ? 'info' : challenge.status === 'accepted' ? 'warning' : 'positive'" 
                      :label="challenge.status === 'open' ? 'Waiting' : challenge.status === 'accepted' ? 'Accepted' : 'In Battle'"
                    />
                  </div>
                </div>
                
                <div class="challenge-stats q-mb-md">
                  <div class="row q-gutter-sm">
                    <q-chip size="xs" color="grey" text-color="white">
                      👥 {{ challenge.unit_count }} Units
                    </q-chip>
                    <q-chip size="xs" color="grey" text-color="white">
                      ⏱️ {{ challenge.time_limit }}
                    </q-chip>
                  </div>
                </div>
                
                <div class="challenge-message">
                  <q-icon name="format_quote" class="q-mr-sm" />
                  {{ challenge.content || 'Challenge issued!' }}
                </div>
              </q-card-section>
              
              <q-card-actions align="right">
                <q-btn 
                  v-if="challenge.status === 'open'"
                  flat 
                  color="negative" 
                  label="Cancel" 
                  @click="cancelChallenge(challenge)" 
                />
                <q-btn 
                  v-if="challenge.status === 'accepted'"
                  color="primary" 
                  label="Start Battle" 
                  @click="startBattle(challenge)" 
                />
                <q-btn 
                  v-if="challenge.status === 'battle'"
                  color="warning" 
                  label="Continue Battle" 
                  @click="continueBattle(challenge)" 
                />
              </q-card-actions>
            </q-card>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';

export default defineComponent({
  name: 'GameBattle',
  setup() {
    const $q = useQuasar();
    const activeTab = ref('challenges');
    
    // Real data - populated from Nostr relay
    const openChallenges = ref([]);
    const activeBattles = ref([]);
    const myChallenges = ref([]);
    
    // Challenge and battle management functions
    const viewChallengeDetails = (challenge) => {
      console.log('Viewing challenge details:', challenge);
      // TODO: Show detailed challenge modal
    };
    
    const acceptChallenge = async (challenge) => {
      try {
        console.log('Accepting challenge:', challenge);
        // TODO: Implement challenge acceptance logic
        // 1. Check if player has sufficient units
        // 2. Create battle state on Nostr
        // 3. Move to active battles
        $q.notify({
          type: 'positive',
          message: `Challenge accepted! Battle with ${challenge.challenger_name} will begin soon.`,
          position: 'top'
        });
        
        // Create battle state
        const newBattle = {
          id: Date.now(),
          opponent_name: challenge.challenger_name,
          battle_type: challenge.battle_type,
          your_turn: Math.random() > 0.5, // Random who goes first
          progress: 0,
          current_turn: 1,
          max_turns: 20,
          your_units_remaining: challenge.your_unit_count || 1,
          your_total_units: challenge.your_unit_count || 1,
          enemy_units_remaining: challenge.unit_count,
          enemy_total_units: challenge.unit_count
        };
        
        activeBattles.value.push(newBattle);
        // Remove from open challenges
        const index = openChallenges.value.findIndex(c => c.id === challenge.id);
        if (index >= 0) {
          openChallenges.value.splice(index, 1);
        }
        
        activeTab.value = 'active';
        
      } catch (error) {
        console.error('Failed to accept challenge:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to accept challenge. Please try again.',
          position: 'top'
        });
      }
    };
    
    const viewBattleLog = (battle) => {
      console.log('Viewing battle log:', battle);
      // TODO: Show battle history modal
    };
    
    const enterBattle = (battle) => {
      console.log('Entering battle:', battle);
      // TODO: Navigate to actual battle interface
      // For now, navigate to results as placeholder
      $q.notify({
        type: 'info',
        message: 'Entering battle arena...',
        position: 'top'
      });
      // setTimeout(() => {
      //   $router.push('/game-results');
      // }, 1500);
    };
    
    const cancelChallenge = (challenge) => {
      console.log('Cancelling challenge:', challenge);
      // TODO: Cancel challenge on Nostr
      const index = myChallenges.value.findIndex(c => c.id === challenge.id);
      if (index >= 0) {
        myChallenges.value.splice(index, 1);
      }
      $q.notify({
        type: 'info',
        message: 'Challenge cancelled',
        position: 'top'
      });
    };
    
    const startBattle = (challenge) => {
      console.log('Starting battle:', challenge);
      // TODO: Initialize battle state
      challenge.status = 'battle';
      $q.notify({
        type: 'positive',
        message: 'Battle started!',
        position: 'top'
      });
    };
    
    const continueBattle = (challenge) => {
      console.log('Continuing battle:', challenge);
      // TODO: Navigate to battle interface
    };
    
    // Load challenges and battles from Nostr on mount
    onMounted(async () => {
      try {
        console.log('Loading challenges and battles from Nostr relay...');
        // TODO: Connect to Nostr relay and load real data
        // const challenges = await loadChallengesFromNostr();
        // const battles = await loadActiveBattlesFromNostr();
        // const myChallengesList = await loadMyChallengesFromNostr();
        // openChallenges.value = challenges;
        // activeBattles.value = battles;  
        // myChallenges.value = myChallengesList;
      } catch (error) {
        console.error('Failed to load data from Nostr relay:', error);
      }
    });
    
    return {
      activeTab,
      openChallenges,
      activeBattles,
      myChallenges,
      viewChallengeDetails,
      acceptChallenge,
      viewBattleLog,
      enterBattle,
      cancelChallenge,
      startBattle,
      continueBattle
    };
  }
});
</script>

<style scoped>
.full-height {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.manastr-header {
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.battle-content {
  flex: 1;
  overflow-y: auto;
}

.challenge-grid,
.battle-grid,
.my-challenges-grid {
  max-width: 800px;
  margin: 0 auto;
}

.challenge-card,
.battle-card,
.my-challenge-card {
  border-radius: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.challenge-card:hover,
.battle-card:hover,
.my-challenge-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.body--dark .challenge-card:hover,
.body--dark .battle-card:hover,
.body--dark .my-challenge-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.challenge-message {
  font-style: italic;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border-left: 3px solid rgba(25, 118, 210, 0.5);
}

.body--light .challenge-message {
  background: rgba(0, 0, 0, 0.03);
}

.army-summary,
.army-status,
.challenge-stats {
  padding: 8px 0;
}

.battle-progress {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 12px;
}

.body--light .battle-progress {
  background: rgba(0, 0, 0, 0.03);
}

/* Game flow navigation styles */
.game-flow-nav {
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.flow-steps .q-btn-group .q-btn {
  border-radius: 0;
}

.flow-steps .q-btn-group .q-btn:first-child {
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}

.flow-steps .q-btn-group .q-btn:last-child {
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}

.current-step {
  opacity: 1 !important;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .flow-steps .q-btn-group {
    width: 100%;
  }
  
  .flow-steps .q-btn-group .q-btn {
    flex: 1;
    font-size: 0.8rem;
  }
  
  .challenge-grid,
  .battle-grid,
  .my-challenges-grid {
    padding: 0 8px;
  }
  
  .challenge-card,
  .battle-card,
  .my-challenge-card {
    margin-bottom: 12px;
  }
}
</style>