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
          Manastr Challenge Builder
        </q-toolbar-title>
        <q-space />
        <!-- Debug info for Nostr status -->
        <q-btn 
          flat 
          dense 
          icon="wifi" 
          @click="testNostrConnection" 
          :color="gameEventsStore.isInitialized ? 'positive' : 'negative'"
        >
          <q-tooltip>{{ gameEventsStore.isInitialized ? 'Nostr Connected' : 'Nostr Disconnected - Click to test' }}</q-tooltip>
        </q-btn>
        <q-btn 
          flat 
          dense 
          icon="refresh" 
          @click="refreshChallenges"
          :loading="refreshingChallenges"
        >
          <q-tooltip>Refresh Challenges</q-tooltip>
        </q-btn>
        <q-btn 
          flat 
          dense 
          icon="troubleshoot" 
          @click="testRelayConnection"
        >
          <q-tooltip>Test Relay Connection</q-tooltip>
        </q-btn>
        <div class="text-caption">
          Army: {{ selectedUnits.length }}/10 units | {{ selectedUnitsValue }} {{ activeUnitLabel }} wager
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
              color="primary" 
              label="2. Challenge" 
              icon="campaign"
              class="current-step"
              :disable="true"
            />
            <q-btn 
              color="grey" 
              label="3. Battle" 
              icon="swords"
              @click="$router.push('/game-battle')"
            />
            <q-btn 
              color="grey" 
              label="4. Results" 
              icon="emoji_events"
              :disable="true"
            />
          </q-btn-group>
        </div>
        <div class="text-caption q-mt-sm" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
          Step 2: Build your army and issue challenges, or manage existing challenges.
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="challenge-container">
      <!-- Tab Navigation -->
      <q-tabs
        v-model="activeTab"
        class="text-primary"
        :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-2'"
      >
        <q-tab name="build-army" icon="groups" label="Build Army" />
        <q-tab name="incoming" icon="inbox" label="Incoming" />
        <q-tab name="my-challenges" icon="send" label="My Challenges" />
      </q-tabs>

      <q-tab-panels v-model="activeTab" animated class="full-height-panels">
        <!-- Build Army Tab -->
        <q-tab-panel name="build-army" class="no-padding">
          <div class="army-builder-layout">
            <!-- Units Sidebar -->
            <div class="units-sidebar" :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-1'">
              <div class="sidebar-header q-pa-md">
                <div class="text-h6">Available Units</div>
                <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                  Click units to add to your army (max 10)
                </div>
                
                <!-- Element Filter Pills -->
                <div class="q-mt-md">
                  <div class="filter-pills">
                    <q-chip 
                      :color="!filterElement ? 'primary' : 'grey'"
                      :text-color="!filterElement ? 'white' : 'black'"
                      clickable
                      size="sm"
                      @click="filterElement = null"
                      class="q-ma-xs"
                    >
                      All
                    </q-chip>
                    <q-chip 
                      v-for="element in elementOptions" 
                      :key="element"
                      :color="filterElement === element ? 'primary' : 'grey'"
                      :text-color="filterElement === element ? 'white' : 'black'"
                      clickable
                      size="sm"
                      @click="filterElement = filterElement === element ? null : element"
                      class="q-ma-xs"
                    >
                      {{ element }}
                    </q-chip>
                  </div>
                </div>
              </div>

              <q-scroll-area class="units-content">
                <div v-if="Object.keys(filteredGroupedUnits).length === 0" class="text-center q-pa-xl">
                  <q-icon name="search_off" size="3rem" :color="$q.dark.isActive ? 'grey-6' : 'grey-4'" />
                  <div class="text-h6 q-mt-md" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                    No Units Available
                  </div>
                  <div class="text-body2 q-mt-sm" :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-5'">
                    You need to have some ecash tokens to build an army.
                  </div>
                </div>
                
                <div v-for="(unitGroup, amount) in filteredGroupedUnits" :key="amount">
                  <q-expansion-item
                    expand-separator
                    class="unit-group-item"
                    default-opened
                  >
                    <template v-slot:header>
                      <q-item-section avatar>
                        <q-avatar :color="getUnitTypeColor(amount)" text-color="white" size="32px">
                          <q-icon :name="getUnitTypeIcon(amount)" />
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ getUnitTypeName(amount) }}</q-item-label>
                        <q-item-label caption>{{ unitGroup.length }} units • {{ formatAmount(amount) }} {{ activeUnitLabel }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-badge v-if="getSelectedCount(amount) > 0" color="primary" :label="getSelectedCount(amount)" />
                      </q-item-section>
                    </template>
                    
                    <div class="units-grid q-pa-sm">
                      <div 
                        v-for="proof in unitGroup" 
                        :key="proof.secret"
                        class="unit-card" 
                        :class="{ 
                          'reserved': proof.reserved,
                          'in-army': isInArmy(proof),
                          'army-full': selectedUnits.length >= 10 && !isInArmy(proof)
                        }"
                        @click="toggleUnitSelection(proof)"
                      >
                        <div class="unit-card-content">
                          <div class="unit-header">
                            <q-avatar :color="getUnitTypeColor(proof.amount)" text-color="white" size="20px">
                              <q-icon :name="getUnitTypeIcon(proof.amount)" size="xs" />
                            </q-avatar>
                            <div class="unit-status-icon">
                              <q-icon 
                                v-if="isInArmy(proof)"
                                name="check_circle" 
                                color="primary"
                                size="sm"
                              />
                              <q-icon 
                                v-else-if="proof.reserved"
                                name="block" 
                                color="warning"
                                size="sm"
                              />
                              <q-icon 
                                v-else-if="selectedUnits.length >= 10"
                                name="remove_circle_outline" 
                                color="grey"
                                size="sm"
                              />
                              <q-icon 
                                v-else
                                name="add_circle_outline" 
                                color="positive"
                                size="sm"
                              />
                            </div>
                          </div>
                          <div class="unit-name">{{ getUnitName(proof) }}</div>
                          <div class="unit-stats">
                            <div class="stat-item">
                              ⚔️{{ getUnitPower(proof) }}
                            </div>
                            <div class="stat-item">
                              🛡️{{ getUnitDefense(proof) }}
                            </div>
                          </div>
                          <div class="unit-element">
                            <q-chip 
                              size="xs" 
                              :color="getElementColor(getUnitElement(proof))" 
                              text-color="white"
                            >
                              {{ getUnitElement(proof) }}
                            </q-chip>
                          </div>
                        </div>
                      </div>
                    </div>
                  </q-expansion-item>
                </div>
              </q-scroll-area>
            </div>

            <!-- Army Panel -->
            <div class="army-panel" :class="$q.dark.isActive ? 'bg-dark' : 'bg-white'">
              <!-- Show Army Content when units are selected -->
              <div v-if="selectedUnits.length > 0" class="army-content">
                <!-- Army Header -->
                <div class="army-header" :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-1'">
                  <div class="q-pa-md">
                    <div class="text-h6">Your Army ({{ selectedUnits.length }}/10)</div>
                    <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                      Total wager: {{ selectedUnitsValue }} {{ activeUnitLabel }}
                    </div>
                  </div>
                  <q-separator />
                </div>

                <q-scroll-area class="army-scroll-area">
                  <div class="q-pa-md">
                    <!-- Compact Army Stats -->
                    <div class="army-summary q-mb-md" :class="$q.dark.isActive ? 'bg-grey-8' : 'bg-grey-1'">
                      <div class="q-pa-md">
                        <div class="text-subtitle2 q-mb-sm">
                          <q-icon name="assessment" class="q-mr-xs" />
                          Army Summary
                        </div>
                        <div class="row q-gutter-md">
                          <div class="col">
                            <div class="summary-stat">
                              <div class="text-h6 text-weight-bold text-red">{{ totalPower }}</div>
                              <div class="text-caption">Total Power</div>
                            </div>
                          </div>
                          <div class="col">
                            <div class="summary-stat">
                              <div class="text-h6 text-weight-bold text-blue">{{ totalDefense }}</div>
                              <div class="text-caption">Total Defense</div>
                            </div>
                          </div>
                          <div class="col">
                            <div class="summary-stat">
                              <div class="text-h6 text-weight-bold text-green">{{ selectedUnitsValue }}</div>
                              <div class="text-caption">Total Value ({{ activeUnitLabel }})</div>
                            </div>
                          </div>
                        </div>
                        
                        <!-- Element Distribution -->
                        <div v-if="Object.keys(elementDistribution).length > 0" class="element-distribution q-mt-md">
                          <div class="text-subtitle2 q-mb-sm">Element Distribution</div>
                          <div class="element-chips">
                            <q-chip 
                              v-for="(count, element) in elementDistribution" 
                              :key="element"
                              :color="getElementColor(element)" 
                              text-color="white" 
                              size="sm"
                              :icon="getElementIcon(element)"
                            >
                              {{ element }} ({{ count }})
                            </q-chip>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Army Units List - Primary Focus -->
                    <div class="army-units-section q-mb-md">
                      <div class="section-header q-mb-sm">
                        <div class="row items-center justify-between">
                          <div class="col">
                            <div class="text-h6">
                              <q-icon name="military_tech" class="q-mr-xs" />
                              Deployed Units ({{ selectedUnits.length }}/10)
                            </div>
                            <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                              Battle formation order - drag to reorder
                            </div>
                          </div>
                          <div class="col-auto">
                            <div class="army-stats-compact">
                              <q-chip color="red" text-color="white" size="sm" icon="flash_on">
                                ⚔️ {{ totalPower }}
                              </q-chip>
                              <q-chip color="blue" text-color="white" size="sm" icon="shield" class="q-ml-xs">
                                🛡️ {{ totalDefense }}
                              </q-chip>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Enhanced Formation List with Drag & Drop -->
                      <div class="enhanced-formation-list">
                        <!-- Simple Card-based Unit Display -->
                        <div class="army-units-cards">
                          <q-card
                            v-for="(unit, index) in selectedUnits"
                            :key="unit.secret"
                            class="army-unit-card q-mb-md"
                            :class="$q.dark.isActive ? 'bg-grey-8' : 'bg-white'"
                            bordered
                            flat
                          >
                            <q-card-section class="q-pa-md">
                              <div class="row items-center no-wrap">
                                <!-- Position Number -->
                                <div class="col-auto q-mr-md">
                                  <div class="position-badge">
                                    {{ index + 1 }}
                                  </div>
                                </div>
                                
                                <!-- Unit Avatar -->
                                <div class="col-auto q-mr-md">
                                  <q-avatar :color="getUnitTypeColor(unit.amount)" text-color="white" size="56px">
                                    <q-icon :name="getUnitTypeIcon(unit.amount)" size="lg" />
                                  </q-avatar>
                                </div>
                                
                                <!-- Unit Details -->
                                <div class="col">
                                  <div class="unit-name text-h6 q-mb-xs">
                                    {{ getUnitName(unit) }}
                                  </div>
                                  <div class="unit-info row items-center q-gutter-sm q-mb-sm">
                                    <q-chip 
                                      size="sm" 
                                      :color="getElementColor(getUnitElement(unit))" 
                                      text-color="white"
                                      :icon="getElementIcon(getUnitElement(unit))"
                                    >
                                      {{ getUnitElement(unit) }}
                                    </q-chip>
                                    <q-badge color="red" text-color="white">
                                      ⚔️ {{ getUnitPower(unit) }}
                                    </q-badge>
                                    <q-badge color="blue" text-color="white">
                                      🛡️ {{ getUnitDefense(unit) }}
                                    </q-badge>
                                    <q-badge color="green" text-color="white">
                                      {{ formatAmount(unit.amount) }} {{ activeUnitLabel }}
                                    </q-badge>
                                  </div>
                                </div>
                                
                                <!-- Action Buttons -->
                                <div class="col-auto">
                                  <div class="row q-gutter-sm">
                                    <!-- Reorder Buttons -->
                                    <q-btn 
                                      flat 
                                      round 
                                      icon="keyboard_arrow_up" 
                                      size="sm"
                                      color="primary"
                                      :disable="index === 0"
                                      @click="moveUnitUp(index)"
                                    >
                                      <q-tooltip>Move up</q-tooltip>
                                    </q-btn>
                                    <q-btn 
                                      flat 
                                      round 
                                      icon="keyboard_arrow_down" 
                                      size="sm"
                                      color="primary"
                                      :disable="index === selectedUnits.length - 1"
                                      @click="moveUnitDown(index)"
                                    >
                                      <q-tooltip>Move down</q-tooltip>
                                    </q-btn>
                                    <!-- Remove Button -->
                                    <q-btn 
                                      flat 
                                      round 
                                      icon="close" 
                                      size="sm"
                                      color="negative"
                                      @click="removeFromArmy(unit)"
                                    >
                                      <q-tooltip>Remove from army</q-tooltip>
                                    </q-btn>
                                  </div>
                                </div>
                              </div>
                            </q-card-section>
                          </q-card>
                        </div>
                        
                        <!-- Old List Version (Hidden for now) -->
                        <q-list v-if="false" separator class="formation-list-container">
                          <q-item
                            v-for="(unit, index) in selectedUnits" 
                            :key="unit.secret"
                            class="formation-unit-item"
                            :class="[$q.dark.isActive ? 'bg-grey-8' : 'bg-grey-2']"
                            clickable
                          >
                            <!-- Drag Handle -->
                            <q-item-section avatar class="drag-handle">
                              <div class="drag-grip">
                                <q-icon name="drag_indicator" color="grey-6" size="sm" />
                                <div class="formation-position">{{ index + 1 }}</div>
                              </div>
                            </q-item-section>
                            
                            <!-- Unit Avatar -->
                            <q-item-section avatar>
                              <q-avatar :color="getUnitTypeColor(unit.amount)" text-color="white" size="48px">
                                <q-icon :name="getUnitTypeIcon(unit.amount)" size="md" />
                              </q-avatar>
                            </q-item-section>
                            
                            <!-- Unit Details -->
                            <q-item-section>
                              <q-item-label class="text-weight-medium">
                                {{ getUnitName(unit) }}
                              </q-item-label>
                              <q-item-label caption class="unit-details-line">
                                <q-chip 
                                  size="xs" 
                                  :color="getElementColor(getUnitElement(unit))" 
                                  text-color="white"
                                  :icon="getElementIcon(getUnitElement(unit))"
                                  class="q-mr-sm"
                                >
                                  {{ getUnitElement(unit) }}
                                </q-chip>
                                <span class="unit-stats-inline">
                                  <strong>Power:</strong> {{ getUnitPower(unit) }} • 
                                  <strong>Defense:</strong> {{ getUnitDefense(unit) }} • 
                                  <strong>Value:</strong> {{ formatAmount(unit.amount) }} {{ activeUnitLabel }}
                                </span>
                              </q-item-label>
                            </q-item-section>
                            
                            <!-- Reorder Controls -->
                            <q-item-section side class="reorder-controls">
                              <div class="column q-gutter-xs">
                                <q-btn 
                                  flat 
                                  dense 
                                  round 
                                  icon="keyboard_arrow_up" 
                                  size="sm"
                                  :disable="index === 0"
                                  @click="moveUnitUp(index)"
                                  class="reorder-btn"
                                >
                                  <q-tooltip>Move up in formation</q-tooltip>
                                </q-btn>
                                <q-btn 
                                  flat 
                                  dense 
                                  round 
                                  icon="keyboard_arrow_down" 
                                  size="sm"
                                  :disable="index === selectedUnits.length - 1"
                                  @click="moveUnitDown(index)"
                                  class="reorder-btn"
                                >
                                  <q-tooltip>Move down in formation</q-tooltip>
                                </q-btn>
                              </div>
                            </q-item-section>
                            
                            <!-- Remove Button -->
                            <q-item-section side>
                              <q-btn 
                                flat 
                                dense 
                                round 
                                icon="remove_circle" 
                                size="sm" 
                                color="negative"
                                @click="removeFromArmy(unit)"
                                class="remove-unit-btn"
                              >
                                <q-tooltip>Remove from army</q-tooltip>
                              </q-btn>
                            </q-item-section>
                          </q-item>
                        </q-list>
                        
                        <!-- Empty Army Slots -->
                        <div v-if="selectedUnits.length < 10" class="empty-slots-section q-mt-md">
                          <div class="text-caption text-grey-5 q-mb-sm">
                            <q-icon name="add" class="q-mr-xs" />
                            {{ 10 - selectedUnits.length }} empty slot(s) - select units from the left to fill your army
                          </div>
                          <div class="empty-slots-grid">
                            <div 
                              v-for="n in Math.min(10 - selectedUnits.length, 3)" 
                              :key="'empty-visual-' + n"
                              class="empty-slot-visual"
                              :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-1'"
                            >
                              <div class="slot-number">{{ selectedUnits.length + n }}</div>
                              <q-icon name="add_circle_outline" size="lg" color="grey-5" />
                            </div>
                            <div 
                              v-if="10 - selectedUnits.length > 3"
                              class="more-slots-indicator"
                              :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-1'"
                            >
                              <div class="text-caption text-grey-5">
                                +{{ 10 - selectedUnits.length - 3 }} more
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Challenge Settings -->
                    <div class="challenge-settings q-mb-md">
                      <div class="text-h6 q-mb-sm">Challenge Settings</div>
                      
                      <q-input
                        v-model="challengeMessage"
                        label="Challenge Message"
                        placeholder="Who dares face my army in battle?"
                        outlined
                        type="textarea"
                        rows="2"
                        class="q-mb-md"
                      />
                      
                      <div class="row q-gutter-md">
                        <div class="col">
                          <q-select
                            v-model="battleType"
                            :options="battleTypeOptions"
                            label="Battle Type"
                            outlined
                          />
                        </div>
                        <div class="col">
                          <q-select
                            v-model="timeLimit"
                            :options="timeLimitOptions"
                            label="Response Time"
                            outlined
                          />
                        </div>
                      </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="action-buttons">
                      <q-btn
                        color="primary"
                        size="lg"
                        @click="publishChallenge"
                        :disable="selectedUnits.length === 0 || publishing"
                        :loading="publishing"
                        class="full-width q-mb-md"
                      >
                        <q-icon name="campaign" class="q-mr-sm" />
                        Issue Challenge
                      </q-btn>
                      <q-btn
                        flat
                        color="grey"
                        @click="clearArmy"
                        :disable="selectedUnits.length === 0"
                        class="full-width"
                      >
                        Clear Army
                      </q-btn>
                    </div>
                  </div>
                </q-scroll-area>
              </div>

              <!-- Empty Army State -->
              <div v-else class="empty-army-state">
                <div class="text-center q-pa-xl">
                  <q-icon name="groups" size="4rem" :color="$q.dark.isActive ? 'grey-6' : 'grey-4'" />
                  <div class="text-h6 q-mb-md" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                    Build Your Army
                  </div>
                  <div class="text-body2 q-mt-sm" :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-5'">
                    Select units from your collection to build an army of up to 10 units
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-tab-panel>

        <!-- Incoming Challenges Tab -->
        <q-tab-panel name="incoming" class="q-pa-md">
          <div class="text-h6 q-mb-md">Incoming Challenges</div>
          <div v-if="incomingChallenges.length === 0" class="text-center q-pa-xl">
            <q-icon name="inbox" size="3rem" :color="$q.dark.isActive ? 'grey-6' : 'grey-4'" />
            <div class="text-h6 q-mt-md" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
              No Incoming Challenges
            </div>
            <div class="text-body2 q-mt-sm" :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-5'">
              No one has challenged you yet. Check back later!
            </div>
          </div>
          
          <!-- Challenge Cards -->
          <div v-else class="challenges-list">
            <q-card
              v-for="challenge in incomingChallenges"
              :key="challenge.id"
              class="challenge-card q-mb-md"
              flat
              bordered
            >
              <q-card-section>
                <div class="row items-center q-mb-sm">
                  <div class="col">
                    <div class="text-h6">{{ challenge.challengerName || 'Anonymous Warrior' }}</div>
                    <div class="text-caption text-grey-6">{{ challenge.battleType }}</div>
                  </div>
                  <div class="col-auto">
                    <q-chip color="primary" text-color="white" size="sm">
                      {{ challenge.wagerAmount }} {{ challenge.wagerUnit || 'mana' }}
                    </q-chip>
                  </div>
                </div>
                
                <div class="challenge-message q-mb-md">
                  {{ challenge.message || 'Battle challenge issued!' }}
                </div>
                
                <div class="challenge-stats q-mb-md">
                  <q-chip size="xs" color="red" text-color="white" class="q-mr-xs">
                    ⚔️ {{ challenge.totalPower }} Power
                  </q-chip>
                  <q-chip size="xs" color="blue" text-color="white" class="q-mr-xs">
                    🛡️ {{ challenge.totalDefense }} Defense
                  </q-chip>
                  <q-chip size="xs" color="grey" text-color="white">
                    👥 {{ challenge.unitCount }} Units
                  </q-chip>
                </div>
              </q-card-section>
              
              <q-card-actions align="right">
                <q-btn flat color="grey" label="View Details" />
                <q-btn color="primary" label="Accept Challenge" @click="acceptChallenge(challenge)" />
              </q-card-actions>
            </q-card>
          </div>
        </q-tab-panel>

        <!-- My Challenges Tab -->
        <q-tab-panel name="my-challenges" class="q-pa-md">
          <div class="text-h6 q-mb-md">My Challenges</div>
          <div v-if="myChallenges.length === 0" class="text-center q-pa-xl">
            <q-icon name="send" size="3rem" :color="$q.dark.isActive ? 'grey-6' : 'grey-4'" />
            <div class="text-h6 q-mt-md" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
              No Challenges Issued
            </div>
            <div class="text-body2 q-mt-sm" :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-5'">
              Build an army and issue your first challenge!
            </div>
          </div>
          
          <!-- My Challenge Cards -->
          <div v-else class="my-challenges-list">
            <q-card
              v-for="challenge in myChallenges"
              :key="challenge.id"
              class="my-challenge-card q-mb-md"
              flat
              bordered
            >
              <q-card-section>
                <div class="row items-center q-mb-sm">
                  <div class="col">
                    <div class="text-h6">{{ challenge.battleType }} Challenge</div>
                    <div class="text-caption text-grey-6">{{ challenge.wagerAmount }} {{ challenge.wagerUnit || 'mana' }} wager</div>
                  </div>
                  <div class="col-auto">
                    <q-badge 
                      :color="challenge.status === 'open' ? 'info' : challenge.status === 'accepted' ? 'warning' : 'positive'" 
                      :label="challenge.status === 'open' ? 'Waiting' : challenge.status === 'accepted' ? 'Accepted' : 'In Battle'"
                    />
                  </div>
                </div>
                
                <div class="challenge-message q-mb-md">
                  {{ challenge.message || 'Challenge issued!' }}
                </div>
                
                <div class="challenge-stats">
                  <q-chip size="xs" color="grey" text-color="white" class="q-mr-xs">
                    👥 {{ challenge.unitCount }} Units
                  </q-chip>
                  <q-chip size="xs" color="grey" text-color="white">
                    ⏱️ {{ challenge.timeLimit }}
                  </q-chip>
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
              </q-card-actions>
            </q-card>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>

    <!-- Challenge Success Dialog -->
    <q-dialog v-model="showSuccessDialog">
      <q-card style="min-width: 350px">
        <q-card-section class="text-center">
          <q-icon name="check_circle" color="positive" size="3rem" />
          <div class="text-h6 q-mt-md">Challenge Published!</div>
          <div class="text-body2 q-mt-sm">
            Your battle challenge has been broadcast to the network.
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue';
import { useProofsStore } from '../stores/proofs';
import { useMintsStore } from '../stores/mints';
import { useGameEventsStore } from '../stores/gameEvents';
import { useQuasar } from 'quasar';
import * as GameUtils from '../utils/gameUtils';

export default defineComponent({
  name: 'GameChallengeNew',
  setup() {
    const $q = useQuasar();
    const proofsStore = useProofsStore();
    const mintsStore = useMintsStore();
    const gameEventsStore = useGameEventsStore();
    
    // Core data
    const selectedUnits = ref([]);
    const publishing = ref(false);
    const refreshingChallenges = ref(false);
    const showSuccessDialog = ref(false);
    const activeTab = ref('build-army');
    
    // Challenge settings
    const challengeMessage = ref('');
    const battleType = ref('Standard Battle');
    const timeLimit = ref('24 hours');
    
    // Filters
    const filterElement = ref(null);
    
    // Options for dropdowns
    const battleTypeOptions = [
      'Standard Battle',
      'Quick Skirmish', 
      'Epic Siege',
      'Tournament Match'
    ];
    
    const timeLimitOptions = [
      '1 hour',
      '6 hours', 
      '24 hours',
      '3 days',
      '1 week'
    ];
    
    const elementOptions = GameUtils.GAME_ELEMENTS;

    // Use reactive data from game events store
    const incomingChallenges = computed(() => gameEventsStore.incomingChallenges);
    const myChallenges = computed(() => gameEventsStore.myChallenges);
    
    // Auto-refresh interval for challenges
    let autoRefreshInterval = null;

    // Initialize game events
    const initializeGameEvents = async () => {
      try {
        await gameEventsStore.initializeGameEvents();
        
        // Initial challenge load using direct WebSocket
        await loadChallengesDirectly();
        
        // Set up auto-refresh every 10 seconds since NDK subscriptions aren't working
        autoRefreshInterval = setInterval(async () => {
          await loadChallengesDirectly();
        }, 10000);
        
      } catch (error) {
        console.error('Failed to initialize game events:', error);
        $q.notify({
          type: 'warning',
          message: 'Could not connect to game network. Some features may not work.',
          position: 'top'
        });
      }
    };

    // Load challenges directly (extracted from refresh function)
    const loadChallengesDirectly = async () => {
      try {
        const directChallenges = await getDirectWebSocketChallenges();
        
        // Process challenges through the game events store
        directChallenges.forEach(challenge => {
          gameEventsStore.handleChallengeEvent(challenge);
        });
      } catch (error) {
        console.error('Failed to load challenges:', error);
      }
    };

    // Test Nostr connection manually
    const testNostrConnection = async () => {
      console.log('🧪 Manual Nostr test triggered');
      console.log('🧪 Current game events store state:', {
        isInitialized: gameEventsStore.isInitialized,
        connectedRelays: gameEventsStore.connectedRelays
      });
      
      // Force re-initialization
      gameEventsStore.isInitialized = false;
      await initializeGameEvents();
      
      // Test publishing a simple event
      console.log('🧪 Testing simple event publication...');
      try {
        const { useNostrStore } = await import('../stores/nostr');
        const nostrStore = useNostrStore();
        const NDK = (await import('@nostr-dev-kit/ndk')).NDKEvent;
        
        const testEvent = new NDK();
        testEvent.kind = 1; // Simple text note
        testEvent.content = `Test from Manastr at ${new Date().toISOString()}`;
        testEvent.tags = [['t', 'manastr-test']];
        testEvent.ndk = nostrStore.ndk;
        
        console.log('🧪 Publishing test event...');
        await testEvent.sign();
        const result = await testEvent.publish();
        console.log('🧪 Test event published:', testEvent.id, 'result:', result);
        
        // Test querying for challenges
        console.log('🧪 Testing challenge query...');
        const challengeQuery = [{ 
          kinds: [30402], 
          '#t': ['manastr', 'game-challenge'],
          limit: 10 
        }];
        console.log('🧪 Challenge query filter:', challengeQuery);
        
        const challenges = await nostrStore.ndk.fetchEvents(challengeQuery);
        console.log('🧪 Found challenges:', challenges?.size || 0);
        if (challenges && challenges.size > 0) {
          challenges.forEach(challenge => {
            console.log('🧪 Challenge:', {
              id: challenge.id?.slice(0, 8) + '...',
              author: challenge.pubkey.slice(0, 8) + '...',
              tags: challenge.tags,
              content: challenge.content.slice(0, 50) + '...'
            });
          });
        }
        
        $q.notify({
          type: 'positive',
          message: `Test complete: Published event, found ${challenges?.size || 0} challenges`,
          position: 'top'
        });
      } catch (error) {
        console.error('🧪 Failed to publish test event:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to publish test event',
          position: 'top'
        });
      }
    };

    // Reserved units from active challenges
    const reservedUnitSecrets = computed(() => {
      const reserved = new Set();
      
      // Add units from our open/accepted challenges
      myChallenges.value
        .filter(challenge => challenge.status === 'open' || challenge.status === 'accepted')
        .forEach(challenge => {
          if (challenge.armySecrets) {
            challenge.armySecrets.forEach(secret => {
              reserved.add(secret);
            });
          }
        });
      
      return reserved;
    });

    // Refresh challenges manually
    const refreshChallenges = async () => {
      refreshingChallenges.value = true;
      
      try {
        const directChallenges = await getDirectWebSocketChallenges();
        
        // Process challenges through the game events store
        directChallenges.forEach(challenge => {
          gameEventsStore.handleChallengeEvent(challenge);
        });
        
        $q.notify({
          type: 'positive',
          message: `Found ${directChallenges.length} challenges`,
          position: 'top'
        });
        
      } catch (error) {
        console.error('Failed to refresh challenges:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to refresh challenges',
          position: 'top'
        });
      } finally {
        refreshingChallenges.value = false;
      }
    };

    // Test relay connection
    const testRelayConnection = async () => {
      console.log('🧪 Testing relay connection...');
      
      try {
        const { useNostrStore } = await import('../stores/nostr');
        const nostrStore = useNostrStore();
        
        // Test direct WebSocket connection to localhost:7777
        console.log('🧪 Testing direct WebSocket connection...');
        const ws = new WebSocket('ws://localhost:7777');
        
        ws.onopen = () => {
          console.log('🧪 ✅ WebSocket connection to localhost:7777 successful');
          
          // Send a basic REQ to test the relay
          const req = JSON.stringify(['REQ', 'test-sub-' + Date.now(), { kinds: [1], limit: 1 }]);
          console.log('🧪 Sending test REQ:', req);
          ws.send(req);
        };
        
        ws.onmessage = (event) => {
          console.log('🧪 📨 Received message:', event.data);
        };
        
        ws.onerror = (error) => {
          console.error('🧪 ❌ WebSocket error:', error);
        };
        
        ws.onclose = (event) => {
          console.log('🧪 WebSocket closed:', event.code, event.reason);
        };
        
        // Close connection after 3 seconds
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        }, 3000);
        
        // Also test NDK connection status
        console.log('🧪 NDK connection status:');
        console.log('  - NDK initialized:', !!nostrStore.ndk);
        console.log('  - Pubkey available:', !!nostrStore.pubkey);
        if (nostrStore.ndk?.pool?.relays) {
          console.log('  - NDK relay pool:');
          Array.from(nostrStore.ndk.pool.relays.entries()).forEach(([url, relay]) => {
            console.log(`    ${url}: status=${relay.connectivity?.status}, connected=${relay.connectivity?.status === 1}`);
          });
        }
        
        $q.notify({
          type: 'info',
          message: 'Relay connection test started - check console',
          position: 'top'
        });
        
      } catch (error) {
        console.error('🧪 Test failed:', error);
        $q.notify({
          type: 'negative',
          message: 'Relay test failed - check console',
          position: 'top'
        });
      }
    };

    // Get challenges using direct WebSocket (NDK fallback)
    const getDirectWebSocketChallenges = () => {
      return new Promise((resolve) => {
        const ws = new WebSocket('ws://localhost:7777');
        const events = [];
        
        ws.onopen = () => {
          // Query for Manastr challenges
          const reqId = 'challenge-fetch-' + Date.now();
          const req = JSON.stringify(['REQ', reqId, { 
            kinds: [30402], 
            '#t': ['manastr', 'game-challenge'],
            limit: 20 
          }]);
          ws.send(req);
          
          // Timeout after 5 seconds
          setTimeout(() => {
            ws.close();
            resolve(events);
          }, 5000);
        };
        
        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed[0] === 'EVENT') {
              // Convert to NDKEvent-like structure for compatibility
              const nostrEvent = {
                id: parsed[2].id,
                pubkey: parsed[2].pubkey,
                kind: parsed[2].kind,
                created_at: parsed[2].created_at,
                content: parsed[2].content,
                tags: parsed[2].tags,
                tagValue: (tagName) => {
                  const tag = parsed[2].tags.find(t => t[0] === tagName);
                  return tag ? tag[1] : null;
                }
              };
              
              events.push(nostrEvent);
            } else if (parsed[0] === 'EOSE') {
              ws.close();
              resolve(events);
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          resolve(events);
        };
        
        ws.onclose = () => {
          resolve(events);
        };
      });
    };

    // Computed properties - use reactive state, not async action
    const proofs = computed(() => {
      try {
        const rawProofs = proofsStore.proofs;
        if (!rawProofs) {
          console.log('No proofs available from store');
          return [];
        }
        if (!Array.isArray(rawProofs)) {
          console.warn('proofsStore.proofs is not an array:', typeof rawProofs, rawProofs);
          return [];
        }
        console.log('Available proofs:', rawProofs.length);
        const reservedSecrets = reservedUnitSecrets.value;
        
        return rawProofs
          .filter(proof => proof && typeof proof === 'object' && proof.amount && proof.C && proof.secret)
          .map(proof => ({
            ...proof,
            reserved: reservedSecrets.has(proof.secret) // Mark reserved units
          }));
      } catch (error) {
        console.error('Error accessing proofs store:', error);
        return [];
      }
    });

    const activeUnitLabel = computed(() => mintsStore.activeUnitLabel);
    
    const totalAmount = computed(() => {
      const proofsArray = Array.isArray(proofs.value) ? proofs.value : [];
      return proofsArray.reduce((sum, proof) => sum + proof.amount, 0);
    });

    const selectedUnitsValue = computed(() => {
      return selectedUnits.value.reduce((sum, unit) => sum + unit.amount, 0);
    });

    const totalPower = computed(() => {
      return selectedUnits.value.reduce((sum, unit) => sum + GameUtils.getUnitPower(unit), 0);
    });

    const totalDefense = computed(() => {
      return selectedUnits.value.reduce((sum, unit) => sum + GameUtils.getUnitDefense(unit), 0);
    });

    const elementDistribution = computed(() => {
      const distribution = {};
      selectedUnits.value.forEach(unit => {
        const element = GameUtils.getUnitElement(unit);
        distribution[element] = (distribution[element] || 0) + 1;
      });
      return distribution;
    });

    // Group units by amount
    const groupedUnits = computed(() => {
      const groups = {};
      const proofsArray = Array.isArray(proofs.value) ? proofs.value : [];
      
      console.log('Grouping units - proofs array length:', proofsArray.length);
      console.log('Sample proofs:', proofsArray.slice(0, 2));
      
      if (proofsArray.length === 0) {
        console.log('No proofs to group');
        return {};
      }
      
      proofsArray.forEach(proof => {
        if (!groups[proof.amount]) {
          groups[proof.amount] = [];
        }
        groups[proof.amount].push(proof);
      });
      
      console.log('Grouped units by amount:', Object.keys(groups));
      return groups;
    });

    const filteredGroupedUnits = computed(() => {
      const filtered = {};
      
      console.log('Filtering grouped units, current filter:', filterElement.value);
      console.log('Grouped units keys:', Object.keys(groupedUnits.value));
      
      Object.keys(groupedUnits.value).forEach(amount => {
        const units = groupedUnits.value[amount].filter(unit => {
          if (filterElement.value && GameUtils.getUnitElement(unit) !== filterElement.value) return false;
          return true;
        });
        
        console.log(`Amount ${amount}: ${groupedUnits.value[amount].length} units, ${units.length} after filter`);
        
        if (units.length > 0) {
          filtered[amount] = units;
        }
      });
      
      console.log('Final filtered groups:', Object.keys(filtered));
      return filtered;
    });

    // Unit helper functions
    const formatAmount = (amount) => {
      return new Intl.NumberFormat().format(amount);
    };

    // Army management functions
    const toggleUnitSelection = (proof) => {
      if (proof.reserved) {
        $q.notify({
          type: 'warning',
          message: 'This unit is already committed to an active challenge',
          position: 'top'
        });
        return; // Can't select reserved units
      }
      
      const index = selectedUnits.value.findIndex(u => u.secret === proof.secret);
      
      if (index >= 0) {
        // Remove from army
        selectedUnits.value.splice(index, 1);
        console.log('Removed unit from army. New length:', selectedUnits.value.length);
        console.log('Selected units after removal:', selectedUnits.value.map(u => u.secret));
      } else {
        // Add to army (max 10)
        if (selectedUnits.value.length < 10) {
          selectedUnits.value.push(proof);
          console.log('Added unit to army. New length:', selectedUnits.value.length);
          console.log('Selected units after addition:', selectedUnits.value.map(u => u.secret));
          
          // Force reactivity update - this should not be needed but let's test
          console.log('Force checking reactive state...');
          console.log('selectedUnits reactive value:', selectedUnits.value);
          console.log('selectedUnitsValue computed:', selectedUnitsValue.value);
        } else {
          console.log('Army is full, cannot add more units');
          $q.notify({
            type: 'warning',
            message: 'Maximum army size is 10 units',
            position: 'top'
          });
        }
      }
    };

    const removeFromArmy = (unit) => {
      const index = selectedUnits.value.findIndex(u => u.secret === unit.secret);
      if (index >= 0) {
        selectedUnits.value.splice(index, 1);
      }
    };

    const moveUnitUp = (index) => {
      if (index > 0) {
        const unit = selectedUnits.value[index];
        selectedUnits.value.splice(index, 1);
        selectedUnits.value.splice(index - 1, 0, unit);
        $q.notify({
          type: 'info',
          message: `${GameUtils.getUnitName(unit)} moved up in formation`,
          timeout: 1500,
          position: 'top'
        });
      }
    };

    const moveUnitDown = (index) => {
      if (index < selectedUnits.value.length - 1) {
        const unit = selectedUnits.value[index];
        selectedUnits.value.splice(index, 1);
        selectedUnits.value.splice(index + 1, 0, unit);
        $q.notify({
          type: 'info',
          message: `${GameUtils.getUnitName(unit)} moved down in formation`,
          timeout: 1500,
          position: 'top'
        });
      }
    };

    const clearArmy = () => {
      selectedUnits.value = [];
    };

    const isInArmy = (proof) => {
      return selectedUnits.value.some(u => u.secret === proof.secret);
    };

    const getSelectedCount = (amount) => {
      return selectedUnits.value.filter(u => u.amount == amount).length;
    };

    // Challenge management functions
    const acceptChallenge = async (challenge) => {
      if (selectedUnits.value.length === 0) {
        $q.notify({
          type: 'warning',
          message: 'You need to build an army first!',
          position: 'top'
        });
        return;
      }

      try {
        // Use game events store to accept challenge via Nostr
        await gameEventsStore.acceptChallenge(challenge, selectedUnits.value.map(unit => ({
          secret: unit.secret,
          amount: unit.amount,
          power: GameUtils.getUnitPower(unit),
          defense: GameUtils.getUnitDefense(unit),
          element: GameUtils.getUnitElement(unit),
          name: GameUtils.getUnitName(unit)
        })));
        
        clearArmy();
        
      } catch (error) {
        console.error('Failed to accept challenge:', error);
        // Error notification is handled by the store
      }
    };

    const cancelChallenge = (challenge) => {
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
      challenge.status = 'battle';
      $q.notify({
        type: 'positive',
        message: 'Battle started!',
        position: 'top'
      });
    };

    // Nostr publishing
    const publishChallenge = async () => {
      if (selectedUnits.value.length === 0) return;
      
      publishing.value = true;
      
      try {
        // Use game events store to publish to Nostr
        await gameEventsStore.publishGameChallenge({
          battleType: battleType.value,
          wagerAmount: selectedUnitsValue.value,
          wagerUnit: activeUnitLabel.value,
          message: challengeMessage.value || 'Challenge issued!',
          armyData: selectedUnits.value.map(unit => ({
            secret: unit.secret,
            amount: unit.amount,
            power: GameUtils.getUnitPower(unit),
            defense: GameUtils.getUnitDefense(unit),
            element: GameUtils.getUnitElement(unit),
            name: GameUtils.getUnitName(unit)
          })),
          timeLimit: timeLimit.value
        });
        
        showSuccessDialog.value = true;
        clearArmy();
        
      } catch (error) {
        console.error('Failed to publish challenge:', error);
        // Error notification is handled by the store
      } finally {
        publishing.value = false;
      }
    };

    // Initialize component
    onMounted(async () => {
      try {
        // Initialize game events (Nostr connections)
        await initializeGameEvents();
        
        // Debug proof data
        const rawProofsForDebug = proofsStore.proofs;
        console.log('Proofs store data:', {
          rawProofs: rawProofsForDebug,
          type: typeof rawProofsForDebug,
          isArray: Array.isArray(rawProofsForDebug),
          length: Array.isArray(rawProofsForDebug) ? rawProofsForDebug.length : 'N/A'
        });
      } catch (error) {
        console.error('Error during component mounting:', error);
      }
    });

    onUnmounted(() => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
      }
    });
    
    return {
      // Stores
      gameEventsStore,
      
      // Data
      selectedUnits,
      activeTab,
      publishing,
      showSuccessDialog,
      challengeMessage,
      battleType,
      timeLimit,
      filterElement,
      
      // Options
      battleTypeOptions,
      timeLimitOptions,
      elementOptions,
      incomingChallenges,
      myChallenges,
      
      // Computed
      proofs,
      activeUnitLabel,
      totalAmount,
      selectedUnitsValue,
      totalPower,
      totalDefense,
      elementDistribution,
      groupedUnits,
      filteredGroupedUnits,
      
      // Functions
      formatAmount,
      getUnitTypeName: GameUtils.getUnitTypeName,
      getUnitTypeIcon: GameUtils.getUnitTypeIcon,
      getUnitTypeColor: GameUtils.getUnitTypeColor,
      getUnitPower: GameUtils.getUnitPower,
      getUnitDefense: GameUtils.getUnitDefense,
      getUnitElement: GameUtils.getUnitElement,
      getUnitRarity: GameUtils.getUnitRarity,
      getUnitName: GameUtils.getUnitName,
      getElementColor: GameUtils.getElementColor,
      getElementIcon: GameUtils.getElementIcon,
      getRarityColor: GameUtils.getRarityColor,
      toggleUnitSelection,
      removeFromArmy,
      moveUnitUp,
      moveUnitDown,
      clearArmy,
      isInArmy,
      getSelectedCount,
      acceptChallenge,
      cancelChallenge,
      startBattle,
      publishChallenge,
      initializeGameEvents,
      testNostrConnection,
      refreshChallenges,
      testRelayConnection,
      getDirectWebSocketChallenges,
      loadChallengesDirectly,
      refreshingChallenges,
      reservedUnitSecrets
    };
  }
});
</script>

<style scoped>
.full-height {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.manastr-header {
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.challenge-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.full-height-panels {
  flex: 1;
  min-height: 0;
}

.no-padding {
  padding: 0;
  height: 100%;
}

.army-builder-layout {
  height: calc(100vh - 200px); /* Account for header and nav */
  min-height: 600px;
  display: flex;
}

.units-sidebar {
  width: 500px;
  min-width: 450px;
  max-width: 50vw;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header {
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.units-content {
  flex: 1;
}

.unit-group-item {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.units-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.unit-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.unit-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.unit-card.in-army {
  border-color: #1976d2;
  background: rgba(25, 118, 210, 0.1);
}

.unit-card.reserved {
  opacity: 0.6;
  cursor: not-allowed;
}

.unit-card.army-full {
  opacity: 0.4;
  cursor: not-allowed;
}

.unit-card-content {
  padding: 12px;
}

.unit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.unit-name {
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 6px;
  line-height: 1.3;
  text-align: center;
}

.unit-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  margin-bottom: 6px;
  gap: 8px;
}

.stat-item {
  font-family: monospace;
  font-weight: 600;
  flex: 1;
  text-align: center;
}

.unit-element {
  text-align: center;
}

.army-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.army-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.army-header {
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.army-scroll-area {
  flex: 1;
}

.stat-card {
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
}

.body--dark .stat-card {
  background: rgba(255, 255, 255, 0.03);
}

.body--light .stat-card {
  background: rgba(0, 0, 0, 0.03);
}

.formation-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.formation-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  position: relative;
}

.formation-item:hover {
  border-color: #1976d2;
  transform: translateX(2px);
}

.formation-order {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1976d2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 12px;
  flex-shrink: 0;
}

.formation-details {
  flex: 1;
  margin-left: 12px;
}

.formation-unit-name {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.formation-unit-stats {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  font-family: monospace;
}

.formation-empty-slot {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  opacity: 0.6;
}

.formation-empty-slot .formation-order {
  background: transparent;
  color: #666;
  border: 2px dashed #666;
}

.formation-remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
}

.element-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.empty-army-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.challenges-list,
.my-challenges-list {
  max-width: 800px;
  margin: 0 auto;
}

.challenge-card,
.my-challenge-card {
  transition: transform 0.2s ease;
}

.challenge-card:hover,
.my-challenge-card:hover {
  transform: translateY(-2px);
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

/* Tablet and smaller screens */
@media (max-width: 1200px) {
  .units-sidebar {
    width: 400px;
    min-width: 350px;
    max-width: 45vw;
  }
  
  .units-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .army-builder-layout {
    flex-direction: column;
  }
  
  .units-sidebar {
    width: 100%;
    min-width: unset;
    max-width: unset;
    height: 50vh;
  }
  
  .army-panel {
    height: 50vh;
  }
  
  .formation-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .flow-steps .q-btn-group {
    width: 100%;
  }
  
  .flow-steps .q-btn-group .q-btn {
    flex: 1;
    font-size: 0.8rem;
  }
}

/* Enhanced Army Display Styles */
.army-units-section {
  border: 2px solid rgba(25, 118, 210, 0.3);
  border-radius: 8px;
  padding: 16px;
}

.army-unit-card {
  border: 2px solid rgba(25, 118, 210, 0.2);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.army-unit-card:hover {
  border-color: rgba(25, 118, 210, 0.6);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
  transform: translateY(-2px);
}

.position-badge {
  width: 40px;
  height: 40px;
  background: linear-gradient(45deg, #1976d2, #2196f3);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}

.unit-name {
  color: inherit;
  margin: 0;
}

.unit-info {
  margin: 0;
}

.army-units-cards {
  min-height: 100px;
}

.body--dark .army-unit-card {
  background: #424242;
  border-color: rgba(25, 118, 210, 0.4);
}

.body--light .army-unit-card {
  background: white;
  border-color: rgba(25, 118, 210, 0.2);
}

.body--dark .army-units-section {
  border-color: rgba(25, 118, 210, 0.5);
  background: rgba(25, 118, 210, 0.05);
}

.body--light .army-units-section {
  border-color: rgba(25, 118, 210, 0.3);
  background: rgba(25, 118, 210, 0.02);
}

.formation-list-container {
  border-radius: 6px;
  overflow: hidden;
}

.formation-unit-item {
  padding: 16px 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.formation-unit-item:hover {
  transform: translateX(4px);
  border-color: #1976d2;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
}

.drag-handle {
  min-width: 40px;
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-grip {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.formation-position {
  width: 24px;
  height: 24px;
  background: #1976d2;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  margin-top: 4px;
}

.unit-details-line {
  line-height: 1.4;
}

.unit-stats-inline {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.75rem;
}

.reorder-controls .reorder-btn {
  min-height: 24px;
  min-width: 24px;
}

.remove-unit-btn {
  transition: all 0.2s ease;
}

.remove-unit-btn:hover {
  transform: scale(1.1);
}

.empty-slots-section {
  padding: 16px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  text-align: center;
}

.body--light .empty-slots-section {
  border-color: rgba(0, 0, 0, 0.15);
}

.empty-slots-grid {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.empty-slot-visual {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.body--light .empty-slot-visual {
  border-color: rgba(0, 0, 0, 0.2);
}

.slot-number {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(255, 255, 255, 0.8);
  color: #333;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
}

.more-slots-indicator {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.body--light .more-slots-indicator {
  border-color: rgba(0, 0, 0, 0.15);
}

.army-summary {
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.body--light .army-summary {
  border-color: rgba(0, 0, 0, 0.1);
}

.summary-stat {
  text-align: center;
  padding: 8px;
  border-radius: 4px;
}

.element-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* Very small screens */
@media (max-width: 480px) {
  .units-sidebar {
    height: 60vh;
  }
  
  .army-panel {
    height: 40vh;
  }
  
  .formation-unit-item {
    padding: 12px 8px;
  }
  
  .empty-slots-grid {
    gap: 8px;
  }
  
  .empty-slot-visual,
  .more-slots-indicator {
    width: 60px;
    height: 60px;
  }
}
</style>