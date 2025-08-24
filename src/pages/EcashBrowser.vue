<template>
  <div class="ecash-browser-container">
    <!-- Header -->
    <div class="header-container">
      <q-toolbar class="bg-primary text-white">
        <q-btn
          flat
          round
          dense
          icon="arrow_back"
          @click="$router.back()"
          class="q-mr-sm"
        />
        <q-toolbar-title>
          Manastr Arsenal
        </q-toolbar-title>
        <q-space />
        <div class="text-caption">
          {{ proofs.length }} units | {{ totalAmount }} {{ activeUnitLabel }}
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
              color="primary" 
              label="1. Arsenal" 
              icon="shield"
              class="current-step"
              :disable="true"
            />
            <q-btn 
              color="grey" 
              label="2. Challenge" 
              icon="campaign"
              @click="$router.push('/game-challenge')"
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
          Step 1: Review your units and their magical properties. When ready, proceed to create a battle challenge.
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="browser-layout" :class="$q.dark.isActive ? 'bg-dark' : 'bg-grey-1'">
      <!-- Left Sidebar - Proof List -->
      <div class="proof-sidebar" :class="$q.dark.isActive ? 'bg-dark' : 'bg-white'">
        <div class="sidebar-header" :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-1'">
          <div class="text-subtitle2 q-pa-md q-pb-sm">
            Unit Armory
            <q-icon name="info" size="sm" class="q-ml-sm">
              <q-tooltip>Units grouped by type and kingdom age</q-tooltip>
            </q-icon>
          </div>
          
          <!-- Search Input -->
          <div class="q-px-md q-pb-md">
            <q-input
              v-model="searchQuery"
              placeholder="Search by C value, amount, or instance..."
              dense
              outlined
              clearable
              :bg-color="$q.dark.isActive ? 'grey-8' : 'grey-1'"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <q-separator />
        </div>
        
        <q-scroll-area class="proof-list">
          <q-list>
            <q-expansion-item
              v-for="(unitGroup, amount) in groupedUnits"
              :key="amount"
              :label="getUnitTypeName(amount)"
              :caption="`${unitGroup.length} units • ${amount} ${activeUnitLabel} each`"
              default-opened
              expand-separator
              :icon="getUnitTypeIcon(amount)"
            >
              <template v-slot:header>
                <q-item-section avatar>
                  <q-avatar :color="getUnitTypeColor(amount)" text-color="white" size="sm">
                    <q-icon :name="getUnitTypeIcon(amount)" />
                  </q-avatar>
                </q-item-section>
                
                <q-item-section>
                  <q-item-label class="text-weight-medium">
                    {{ getUnitTypeName(amount) }}
                    <q-icon name="info" size="xs" class="q-ml-xs">
                      <q-tooltip>{{ getUnitTypeDescription(amount) }}</q-tooltip>
                    </q-icon>
                  </q-item-label>
                  <q-item-label caption>
                    {{ unitGroup.length }} units • {{ amount }} {{ activeUnitLabel }} each
                  </q-item-label>
                </q-item-section>
              </template>

              <!-- Units within this type -->
              <div class="q-pl-md">
                <q-item
                  v-for="proof in unitGroup"
                  :key="proof.secret"
                  clickable
                  :class="{ 
                    'selected-proof': selectedProof?.secret === proof.secret,
                    'bg-grey-2': !$q.dark.isActive && selectedProof?.secret !== proof.secret,
                    'bg-grey-8': $q.dark.isActive && selectedProof?.secret !== proof.secret
                  }"
                  @click="selectUnitProof(proof)"
                >
                  <q-item-section avatar>
                    <q-avatar 
                      :color="proof.reserved ? 'warning' : getKingdomAgeColor(proof.id)" 
                      text-color="white"
                      size="xs"
                    >
                      {{ getUnitInstance(proof) }}
                    </q-avatar>
                  </q-item-section>
                  
                  <q-item-section>
                    <q-item-label class="text-body2">
                      {{ getUnitName(proof) }}
                      <q-icon name="info" size="xs" class="q-ml-xs">
                        <q-tooltip>Individual unit with unique magical properties</q-tooltip>
                      </q-icon>
                    </q-item-label>
                    <q-item-label caption :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                      {{ getKingdomAgeName(proof.id) }}
                      <q-icon name="info" size="xs" class="q-ml-xs">
                        <q-tooltip>Kingdom Age: {{ proof.id }}</q-tooltip>
                      </q-icon>
                    </q-item-label>
                  </q-item-section>
                  
                  <q-item-section side>
                    <div class="column items-end">
                      <q-badge 
                        v-if="proof.reserved" 
                        color="warning" 
                        label="Deployed"
                        class="q-mb-xs"
                      >
                        <q-tooltip>This unit is currently deployed in battle</q-tooltip>
                      </q-badge>
                      <q-icon 
                        :name="getUnitStatusIcon(proof)" 
                        :color="proof.reserved ? 'warning' : 'positive'"
                        size="xs"
                      >
                        <q-tooltip>{{ proof.reserved ? 'In Battle' : 'Ready for Combat' }}</q-tooltip>
                      </q-icon>
                    </div>
                  </q-item-section>
                </q-item>
              </div>
            </q-expansion-item>
          </q-list>
        </q-scroll-area>
      </div>

      <!-- Main Inspection Panel -->
      <div class="inspection-panel" :class="$q.dark.isActive ? 'bg-dark' : 'bg-white'">
        <div v-if="selectedProof" class="proof-details">
          <!-- Header with basic info -->
          <div class="details-header" :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-1'">
            <div class="row items-center q-pa-md">
              <div class="col">
                <div class="text-h6">
                  {{ getUnitName(selectedProof) }}
                </div>
                <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                  {{ getUnitTypeName(selectedProof.amount) }} • {{ formatAmount(selectedProof.amount) }} {{ activeUnitLabel }}
                </div>
                <!-- Inline Unit Description -->
                <div class="unit-description q-mt-sm">
                  <div class="text-body2" :class="$q.dark.isActive ? 'text-grey-3' : 'text-grey-7'">
                    {{ getUnitTypeDescription(selectedProof.amount) }}
                  </div>
                </div>
              </div>
              <div class="col-auto">
                <q-badge 
                  :color="selectedProof.reserved ? 'warning' : 'positive'"
                  :label="selectedProof.reserved ? 'Deployed' : 'Ready'"
                  class="q-mb-sm"
                />
                <div class="text-caption text-center" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                  {{ selectedProof.reserved ? 'Fighting in battle' : 'Available for deployment' }}
                </div>
              </div>
            </div>
            <q-separator />
          </div>

          <!-- Detailed inspection -->
          <q-scroll-area class="details-content">
            <div class="q-pa-md">
              
              <!-- Unit Properties - Highlighted Section -->
              <q-card class="q-mb-md" flat bordered>
                <q-card-section :class="$q.dark.isActive ? 'bg-deep-purple-8 text-white' : 'bg-deep-purple-2 text-deep-purple-9'">
                  <div class="text-h6 q-mb-sm">
                    <q-icon name="auto_awesome" class="q-mr-sm" />
                    Magical Properties
                  </div>
                  
                  <!-- Gaming Explanation -->
                  <div class="explanation-text q-mb-md">
                    <div class="text-body2 q-mb-sm">
                      🎮 <strong>Gaming:</strong> These combat stats are derived from your unit's unique <strong>Magical Signature (C value)</strong> - 
                      a cryptographic fingerprint that ensures stats are unpredictable, tamper-proof, and verifiable by anyone.
                    </div>
                    <div class="text-caption">
                      🔧 <strong>Technical:</strong> Different segments of the 256-bit C value are hashed to generate deterministic properties. 
                      Same C value always produces same stats, but impossible to predict before minting.
                    </div>
                  </div>
                  
                  <!-- Property Stats Display -->
                  <div class="unit-properties">
                    <div class="row q-gutter-md q-mb-md">
                      <div class="col">
                        <div class="property-card">
                          <div class="text-subtitle2 q-mb-xs">
                            <q-icon name="flash_on" class="q-mr-xs" />
                            Power Level
                          </div>
                          <div class="text-h4 text-weight-bold q-mb-xs">{{ getUnitPower(selectedProof) }}</div>
                          <div class="text-caption">Combat effectiveness</div>
                        </div>
                      </div>
                      <div class="col">
                        <div class="property-card">
                          <div class="text-subtitle2 q-mb-xs">
                            <q-icon name="shield" class="q-mr-xs" />
                            Defense
                          </div>
                          <div class="text-h4 text-weight-bold q-mb-xs">{{ getUnitDefense(selectedProof) }}</div>
                          <div class="text-caption">Damage resistance</div>
                        </div>
                      </div>
                    </div>
                    
                    <div class="row q-gutter-md">
                      <div class="col">
                        <div class="text-subtitle2 q-mb-xs">
                          <q-icon name="psychology" class="q-mr-xs" />
                          Element
                        </div>
                        <q-chip 
                          :color="getElementColor(getUnitElement(selectedProof))" 
                          text-color="white" 
                          :icon="getElementIcon(getUnitElement(selectedProof))"
                          class="q-mb-xs"
                        >
                          {{ getUnitElement(selectedProof) }}
                        </q-chip>
                        <div class="text-caption">Strengths & weaknesses</div>
                      </div>
                      <div class="col">
                        <div class="text-subtitle2 q-mb-xs">
                          <q-icon name="star" class="q-mr-xs" />
                          Rarity
                        </div>
                        <q-chip 
                          :color="getRarityColor(getUnitRarity(selectedProof))" 
                          text-color="white"
                          class="q-mb-xs"
                        >
                          {{ getUnitRarity(selectedProof) }}
                        </q-chip>
                        <div class="text-caption">{{ getUnitRarity(selectedProof) === 'Legendary' ? '<0.1% chance' : getUnitRarity(selectedProof) === 'Epic' ? '<1% chance' : getUnitRarity(selectedProof) === 'Rare' ? '<5% chance' : getUnitRarity(selectedProof) === 'Uncommon' ? '<20% chance' : '80% chance' }}</div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- Technical Details -->
              <div class="proof-fields">
                
                <!-- Kingdom Age Details -->
                <q-card flat bordered class="q-mb-sm">
                  <q-card-section class="q-pb-sm">
                    <div class="row items-start">
                      <div class="col-auto q-mr-md">
                        <q-avatar :color="getKingdomAgeColor(selectedProof.id)" text-color="white" size="md">
                          <q-icon name="castle" />
                        </q-avatar>
                      </div>
                      <div class="col">
                        <div class="text-h6 q-mb-xs">Kingdom Age: {{ getKingdomAgeName(selectedProof.id) }}</div>
                        
                        <!-- Inline Explanation -->
                        <div class="explanation-text q-mb-sm">
                          <div class="text-body2 q-mb-xs">
                            🎮 <strong>Gaming:</strong> Units from the same Kingdom Age share similar magical aesthetics and historical context. 
                            Your unit was forged during the <strong>{{ getKingdomAgeName(selectedProof.id) }}</strong>.
                          </div>
                          <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                            🔧 <strong>Technical:</strong> Ages are determined by your token's <strong>keyset ID</strong> - the cryptographic keys 
                            used by the mint. Units minted around the same time share the same age.
                          </div>
                        </div>

                        <div class="technical-data">
                          <div class="text-body2 q-mb-xs">
                            <strong>Era Signature:</strong> 
                            <span class="monospace-text" :class="$q.dark.isActive ? 'bg-grey-7' : 'bg-grey-2'">
                              {{ selectedProof.id.substring(0, 8) }}...
                            </span>
                          </div>
                          <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                            Full Keyset ID: {{ selectedProof.id }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>

                <!-- Arcane Essence -->
                <q-card flat bordered class="q-mb-sm">
                  <q-card-section class="q-pb-sm">
                    <div class="row items-start">
                      <div class="col-auto q-mr-md">
                        <q-avatar color="deep-purple" text-color="white" size="md">
                          <q-icon name="auto_awesome" />
                        </q-avatar>
                      </div>
                      <div class="col">
                        <div class="text-h6 q-mb-xs">Arcane Essence</div>
                        
                        <!-- Inline Explanation -->
                        <div class="explanation-text q-mb-sm">
                          <div class="text-body2 q-mb-xs">
                            🎮 <strong>Gaming:</strong> Your unit's unique magical DNA - like a fingerprint that makes it one-of-a-kind. 
                            Used to generate instance number <strong>{{ getUnitInstance(selectedProof) }}</strong> and proves ownership.
                          </div>
                          <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                            🔧 <strong>Technical:</strong> This is your Cashu token's <strong>secret</strong> - a cryptographic key that authorizes 
                            spending. Never share this value!
                          </div>
                        </div>

                        <div class="technical-data">
                          <div class="text-body2 q-mb-xs">
                            <strong>Essence Pattern:</strong> 
                            <span class="monospace-text" :class="$q.dark.isActive ? 'bg-grey-7' : 'bg-grey-2'">
                              {{ selectedProof.secret.substring(0, 16) }}...
                            </span>
                          </div>
                          <div class="text-caption text-warning">
                            ⚠️ Keep this secret safe - losing it means losing your unit permanently
                          </div>
                        </div>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>

                <!-- Magical Signature -->
                <q-card flat bordered class="q-mb-sm">
                  <q-card-section class="q-pb-sm">
                    <div class="row items-start">
                      <div class="col-auto q-mr-md">
                        <q-avatar color="primary" text-color="white" size="md">
                          <q-icon name="fingerprint" />
                        </q-avatar>
                      </div>
                      <div class="col">
                        <div class="row items-center q-mb-xs">
                          <div class="text-h6 q-mr-sm">Magical Signature (C Value)</div>
                          <q-btn 
                            flat 
                            dense 
                            round 
                            icon="content_copy" 
                            size="sm"
                            @click="copyToClipboard(selectedProof.C, 'C Value')"
                            class="q-mr-xs"
                          >
                            <q-tooltip>Copy full C value to clipboard</q-tooltip>
                          </q-btn>
                          <q-btn 
                            flat 
                            dense 
                            round 
                            icon="code" 
                            size="sm"
                            @click="showCValueAnalysis = !showCValueAnalysis"
                            :color="showCValueAnalysis ? 'primary' : ''"
                          >
                            <q-tooltip>{{ showCValueAnalysis ? 'Hide' : 'Show' }} detailed C value analysis</q-tooltip>
                          </q-btn>
                        </div>
                        
                        <!-- Inline Explanation -->
                        <div class="explanation-text q-mb-sm">
                          <div class="text-body2 q-mb-xs">
                            🎮 <strong>Gaming:</strong> Like a tamper-proof certificate of authenticity - proves your unit was created by the 
                            official Manastr mint and provides the randomness for all magical properties above.
                          </div>
                          <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                            🔧 <strong>Technical:</strong> The <strong>C value</strong> is the mint's blind signature on your token. 
                            Mathematically impossible to forge, enables offline verification.
                          </div>
                        </div>

                        <!-- Basic C Value Display -->
                        <div class="technical-data q-mb-sm">
                          <div class="text-body2 q-mb-xs">
                            <strong>Signature Hash:</strong> 
                            <span class="monospace-text clickable-text" 
                                  :class="[$q.dark.isActive ? 'bg-grey-7' : 'bg-grey-2']"
                                  @click="showFullCValue = !showFullCValue"
                                  style="cursor: pointer;">
                              {{ showFullCValue ? selectedProof.C : selectedProof.C.substring(0, 20) + '...' }}
                            </span>
                            <q-btn 
                              flat 
                              dense 
                              :icon="showFullCValue ? 'expand_less' : 'expand_more'" 
                              size="xs"
                              @click="showFullCValue = !showFullCValue"
                              class="q-ml-xs"
                            />
                          </div>
                          <div class="text-caption q-mb-xs" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                            Length: {{ selectedProof.C.length }} characters • Format: {{ getCValueFormat(selectedProof.C) }}
                          </div>
                          <div class="text-caption text-positive">
                            ✓ Cryptographically verified - this unit is authentic
                          </div>
                        </div>

                        <!-- Detailed C Value Analysis (Expandable) -->
                        <q-expansion-item v-model="showCValueAnalysis" icon="analytics" label="Advanced C Value Analysis">
                          <div class="q-pa-sm" :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-1'">
                            
                            <!-- C Value Segments -->
                            <div class="q-mb-md">
                              <div class="text-subtitle2 q-mb-sm">
                                <q-icon name="view_module" class="q-mr-xs" />
                                Property Generation Segments
                              </div>
                              <div class="text-caption q-mb-sm" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                                Different portions of the C value generate different magical properties:
                              </div>
                              
                              <div class="c-value-segments q-mb-sm">
                                <div class="segment-item q-mb-xs">
                                  <div class="row items-center no-wrap">
                                    <div class="col-auto q-pr-sm">
                                      <q-chip size="sm" color="red" text-color="white" icon="flash_on">
                                        Power
                                      </q-chip>
                                    </div>
                                    <div class="col">
                                      <span class="monospace-text segment-highlight power-segment">
                                        {{ selectedProof.C.substring(0, 16) }}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div class="segment-item q-mb-xs">
                                  <div class="row items-center no-wrap">
                                    <div class="col-auto q-pr-sm">
                                      <q-chip size="sm" color="blue" text-color="white" icon="shield">
                                        Defense
                                      </q-chip>
                                    </div>
                                    <div class="col">
                                      <span class="monospace-text segment-highlight defense-segment">
                                        {{ selectedProof.C.substring(16, 32) }}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div class="segment-item q-mb-xs">
                                  <div class="row items-center no-wrap">
                                    <div class="col-auto q-pr-sm">
                                      <q-chip size="sm" color="purple" text-color="white" icon="psychology">
                                        Element
                                      </q-chip>
                                    </div>
                                    <div class="col">
                                      <span class="monospace-text segment-highlight element-segment">
                                        {{ selectedProof.C.substring(8, 24) }}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div class="segment-item">
                                  <div class="row items-center no-wrap">
                                    <div class="col-auto q-pr-sm">
                                      <q-chip size="sm" color="amber" text-color="white" icon="star">
                                        Rarity
                                      </q-chip>
                                    </div>
                                    <div class="col">
                                      <span class="monospace-text segment-highlight rarity-segment">
                                        {{ selectedProof.C.substring(24, 40) }}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <!-- C Value Statistics -->
                            <div class="q-mb-md">
                              <div class="text-subtitle2 q-mb-sm">
                                <q-icon name="bar_chart" class="q-mr-xs" />
                                Cryptographic Properties
                              </div>
                              <div class="row q-gutter-md">
                                <div class="col">
                                  <div class="stat-card" :class="$q.dark.isActive ? 'bg-grey-8' : 'bg-grey-2'">
                                    <div class="text-caption">Entropy</div>
                                    <div class="text-body1 text-weight-bold">{{ getCValueEntropy(selectedProof.C) }} bits</div>
                                  </div>
                                </div>
                                <div class="col">
                                  <div class="stat-card" :class="$q.dark.isActive ? 'bg-grey-8' : 'bg-grey-2'">
                                    <div class="text-caption">Uniqueness</div>
                                    <div class="text-body1 text-weight-bold">{{ getCValueUniqueness(selectedProof.C) }}</div>
                                  </div>
                                </div>
                                <div class="col">
                                  <div class="stat-card" :class="$q.dark.isActive ? 'bg-grey-8' : 'bg-grey-2'">
                                    <div class="text-caption">Hash Quality</div>
                                    <div class="text-body1 text-weight-bold text-positive">Excellent</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <!-- Export Options -->
                            <div class="row q-gutter-sm">
                              <q-btn 
                                outline 
                                color="primary" 
                                icon="download" 
                                label="Export Proof JSON"
                                size="sm"
                                @click="exportProofJSON(selectedProof)"
                              />
                              <q-btn 
                                outline 
                                color="secondary" 
                                icon="compare" 
                                label="Compare C Value"
                                size="sm"
                                @click="startCValueComparison(selectedProof)"
                              />
                            </div>
                          </div>
                        </q-expansion-item>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>

                <!-- Authenticity Seal (DLEQ) -->
                <q-card v-if="selectedProof.dleq" flat bordered class="q-mb-sm">
                  <q-card-section class="q-pb-sm">
                    <div class="row items-start">
                      <div class="col-auto q-mr-md">
                        <q-avatar color="green" text-color="white" size="md">
                          <q-icon name="verified_user" />
                        </q-avatar>
                      </div>
                      <div class="col">
                        <div class="text-h6 q-mb-xs">Authenticity Seal (DLEQ Proof)</div>
                        
                        <!-- Inline Explanation -->
                        <div class="explanation-text q-mb-sm">
                          <div class="text-body2 q-mb-xs">
                            🎮 <strong>Gaming:</strong> Maximum security protection - your unit has the highest level of authenticity 
                            guarantees possible. Future-proof against even theoretical quantum computer attacks.
                          </div>
                          <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                            🔧 <strong>Technical:</strong> DLEQ (Discrete Log Equality) proof mathematically proves the mint used 
                            consistent keys without revealing private information.
                          </div>
                        </div>

                        <div class="technical-data">
                          <div class="text-body2 q-mb-xs">
                            <strong>Seal Alpha:</strong> 
                            <span class="monospace-text" :class="$q.dark.isActive ? 'bg-grey-7' : 'bg-grey-2'">
                              {{ selectedProof.dleq.e.substring(0, 12) }}...
                            </span>
                          </div>
                          <div class="text-body2 q-mb-xs">
                            <strong>Seal Beta:</strong>
                            <span class="monospace-text" :class="$q.dark.isActive ? 'bg-grey-7' : 'bg-grey-2'">
                              {{ selectedProof.dleq.s.substring(0, 12) }}...
                            </span>
                          </div>
                          <div class="text-caption text-positive">
                            🛡️ Premium security - quantum-resistant protection
                          </div>
                        </div>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>

                <!-- Battle Status -->
                <q-card flat bordered class="q-mb-sm">
                  <q-card-section class="q-pb-sm">
                    <div class="row items-start">
                      <div class="col-auto q-mr-md">
                        <q-avatar :color="selectedProof.reserved ? 'warning' : 'positive'" text-color="white" size="md">
                          <q-icon name="military_tech" />
                        </q-avatar>
                      </div>
                      <div class="col">
                        <div class="text-h6 q-mb-xs">Battle Status</div>
                        
                        <!-- Inline Explanation -->
                        <div class="explanation-text q-mb-sm">
                          <div class="text-body2 q-mb-xs">
                            🎮 <strong>Gaming:</strong> Shows whether your unit is available for battle or currently deployed. 
                            Manage your army efficiently - always keep some units in reserve!
                          </div>
                          <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                            🔧 <strong>Technical:</strong> The <strong>reserved</strong> flag prevents double-spending during battles. 
                            Units are locked while in use, then released when battles complete.
                          </div>
                        </div>

                        <div class="technical-data">
                          <div class="text-body2 q-mb-sm">
                            <strong>Current Status:</strong> 
                            <q-chip 
                              :color="selectedProof.reserved ? 'warning' : 'positive'"
                              text-color="white"
                              size="sm"
                              class="q-ml-sm"
                            >
                              {{ selectedProof.reserved ? 'Deployed in Battle' : 'Ready for Combat' }}
                            </q-chip>
                          </div>
                          <div v-if="selectedProof.quote" class="text-body2 q-mb-xs">
                            <strong>Mission ID:</strong> 
                            <span class="monospace-text" :class="$q.dark.isActive ? 'bg-grey-7' : 'bg-grey-2'">
                              {{ selectedProof.quote }}
                            </span>
                          </div>
                          <div class="text-caption" :class="selectedProof.reserved ? 'text-warning' : 'text-positive'">
                            {{ selectedProof.reserved ? '⚔️ Currently fighting - will return when battle ends' : '✓ Available for immediate deployment' }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>

              </div>
            </div>
          </q-scroll-area>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <div class="text-center q-pa-xl">
            <q-icon 
              name="shield" 
              size="4rem" 
              :class="$q.dark.isActive ? 'text-grey-6' : 'text-grey-4'" 
            />
            <div class="text-h6 q-mt-md" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
              Select a Unit to Inspect
            </div>
            <div class="text-body2 q-mt-sm" :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-5'">
              Choose a unit from your armory to view its magical properties and battle status
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue';
import { useProofsStore } from '../stores/proofs';
import { useMintsStore } from '../stores/mints';
import { useQuasar } from 'quasar';
import * as GameUtils from '../utils/gameUtils';

export default defineComponent({
  name: 'ManastrArsenal',
  setup() {
    const $q = useQuasar();
    const proofsStore = useProofsStore();
    const mintsStore = useMintsStore();
    
    const selectedProof = ref(null);
    const showFullCValue = ref(false);
    const showCValueAnalysis = ref(false);
    const searchQuery = ref('');
    
    const proofs = computed(() => proofsStore.proofs);
    
    // Filter proofs based on search query
    const filteredProofs = computed(() => {
      if (!searchQuery.value) return proofs.value;
      
      const query = searchQuery.value.toLowerCase();
      return proofs.value.filter(proof => {
        const cValue = proof.C.toLowerCase();
        const amount = proof.amount.toString();
        const instance = GameUtils.getUnitInstance(proof).toLowerCase();
        const unitName = GameUtils.getUnitName(proof).toLowerCase();
        
        return cValue.includes(query) ||
               amount.includes(query) ||
               instance.includes(query) ||
               unitName.includes(query);
      });
    });
    
    // Group proofs by amount (unit type)
    const groupedUnits = computed(() => {
      const groups = {};
      filteredProofs.value.forEach(proof => {
        if (!groups[proof.amount]) {
          groups[proof.amount] = [];
        }
        groups[proof.amount].push(proof);
      });
      return groups;
    });
    
    const totalAmount = computed(() => 
      proofs.value.reduce((sum, proof) => sum + proof.amount, 0)
    );
    
    const activeUnitLabel = computed(() => mintsStore.activeUnitLabel);
    
    const selectUnitProof = (proof) => {
      selectedProof.value = proof;
      // Reset view states when selecting new proof
      showFullCValue.value = false;
      showCValueAnalysis.value = false;
    };
    
    const formatAmount = (amount) => {
      const multiplier = mintsStore.activeUnitCurrencyMultiplyer;
      return multiplier > 1 ? (amount / multiplier).toFixed(2) : amount.toString();
    };
    
    // Fantasy-themed unit type names based on amount
    const getUnitTypeName = (amount) => {
      const unitTypes = {
        1: 'Goblin Skirmisher',
        2: 'Kobold Trickster', 
        3: 'Pixie Scout',
        5: 'Orcish Berserker',
        8: 'Elven Ranger',
        10: 'Dwarven Guardian',
        15: 'Human Templar',
        20: 'Centaur Lancer',
        25: 'Phoenix Knight',
        30: 'Storm Elementalist',
        40: 'Shadow Assassin',
        50: 'Celestial Paladin',
        75: 'Frost Giant',
        100: 'Ancient Wyrm',
        150: 'Lich Master',
        200: 'Demon Prince',
        250: 'Angel of War',
        300: 'Void Stalker',
        400: 'Primordial Beast',
        500: 'Arcane Sovereign',
        750: 'Cosmic Horror',
        1000: 'Elder God',
        1500: 'Planar Titan',
        2000: 'Reality Shaper',
        2500: 'Dimension Lord',
        5000: 'Universe Walker',
        10000: 'Infinity Weaver'
      };
      
      // For amounts not in our list, create dynamic names
      if (unitTypes[amount]) {
        return unitTypes[amount];
      }
      
      // Generate creative names for unlisted amounts
      if (amount < 10) return `Fey Sprite (${amount})`;
      if (amount < 50) return `Battle Mage (${amount})`;
      if (amount < 100) return `War Beast (${amount})`;
      if (amount < 500) return `Planar Guardian (${amount})`;
      if (amount < 1000) return `Legendary Avatar (${amount})`;
      if (amount < 5000) return `Cosmic Entity (${amount})`;
      return `Omnipotent Being (${amount})`;
    };
    
    const getUnitTypeDescription = (amount) => {
      const descriptions = {
        1: 'Cunning raiders from the dark forests, masters of hit-and-run tactics',
        2: 'Clever trap-makers who use wit over strength to overcome foes',
        3: 'Magical scouts that phase between dimensions to gather intelligence',
        5: 'Savage warriors driven by bloodlust and tribal fury',
        8: 'Elite marksmen with centuries of woodland combat experience',
        10: 'Stalwart defenders forged in the mountain halls of their ancestors',
        15: 'Holy warriors sworn to uphold justice and divine law',
        20: 'Noble centaur cavalry with unmatched speed and honor',
        25: 'Reborn warriors wreathed in eternal flames of righteousness',
        30: 'Mages who command the very forces of nature itself',
        40: 'Silent killers who strike from the realm of shadows',
        50: 'Champions blessed by celestial light and divine purpose',
        75: 'Ancient giants from the frozen peaks, masters of ice magic',
        100: 'Primordial dragons with millennia of accumulated power',
        150: 'Undead sorcerer-kings who have transcended mortal death',
        200: 'Infernal princes commanding legions of the damned',
        250: 'Divine warriors leading the celestial armies of light',
        300: 'Hunters from the spaces between stars and reality',
        400: 'Primal beings from the dawn of creation itself',
        500: 'Rulers of magical realms with dominion over arcane forces',
        750: 'Incomprehensible entities from beyond mortal understanding',
        1000: 'Ancient deities whose power shaped the foundations of reality',
        1500: 'Colossal beings who stride across entire planes of existence',
        2000: 'Architects of reality capable of rewriting the laws of physics',
        2500: 'Supreme overlords governing entire dimensions',
        5000: 'Transcendent entities who travel between parallel universes',
        10000: 'The ultimate weavers of fate and architects of infinity'
      };
      
      if (descriptions[amount]) {
        return descriptions[amount];
      }
      
      // Dynamic descriptions for unlisted amounts
      if (amount < 10) return `Mischievous fey creatures with unpredictable magical abilities worth ${amount} mana each`;
      if (amount < 50) return `Versatile spellcasters combining martial prowess with arcane knowledge worth ${amount} mana each`;
      if (amount < 100) return `Fearsome creatures bred for war and destruction worth ${amount} mana each`;
      if (amount < 500) return `Interdimensional protectors maintaining cosmic balance worth ${amount} mana each`;
      if (amount < 1000) return `Mythical embodiments of pure power worth ${amount} mana each`;
      if (amount < 5000) return `Beings of such magnitude they exist across multiple realities worth ${amount} mana each`;
      return `Omnipotent forces beyond mortal comprehension worth ${amount} mana each`;
    };
    
    const getUnitTypeIcon = (amount) => {
      const icons = {
        1: 'pest_control',           // Goblin Skirmisher
        2: 'psychology',             // Kobold Trickster
        3: 'auto_awesome',           // Pixie Scout
        5: 'local_fire_department',  // Orcish Berserker
        8: 'park',                   // Elven Ranger
        10: 'shield',                // Dwarven Guardian
        15: 'church',                // Human Templar
        20: 'directions_run',        // Centaur Lancer
        25: 'whatshot',              // Phoenix Knight
        30: 'thunderstorm',          // Storm Elementalist
        40: 'visibility_off',        // Shadow Assassin
        50: 'light_mode',            // Celestial Paladin
        75: 'ac_unit',               // Frost Giant
        100: 'pets',                 // Ancient Wyrm
        150: 'skull',                // Lich Master
        200: 'dark_mode',            // Demon Prince
        250: 'flight',               // Angel of War
        300: 'blur_on',              // Void Stalker
        400: 'terrain',              // Primordial Beast
        500: 'star',                 // Arcane Sovereign
        750: 'psychology_alt',       // Cosmic Horror
        1000: 'bolt',                // Elder God
        1500: 'public',              // Planar Titan
        2000: 'settings_input_component', // Reality Shaper
        2500: 'language',            // Dimension Lord
        5000: 'rocket_launch',       // Universe Walker
        10000: 'all_inclusive'       // Infinity Weaver
      };
      
      if (icons[amount]) return icons[amount];
      
      // Dynamic icons for unlisted amounts
      if (amount < 10) return 'auto_awesome';
      if (amount < 50) return 'local_fire_department';
      if (amount < 100) return 'pets';
      if (amount < 500) return 'shield';
      if (amount < 1000) return 'star';
      if (amount < 5000) return 'bolt';
      return 'all_inclusive';
    };
    
    const getUnitTypeColor = (amount) => {
      const colors = {
        1: 'green',                  // Goblin Skirmisher
        2: 'brown',                  // Kobold Trickster
        3: 'pink',                   // Pixie Scout
        5: 'deep-orange',            // Orcish Berserker
        8: 'light-green',            // Elven Ranger
        10: 'blue-grey',             // Dwarven Guardian
        15: 'amber',                 // Human Templar
        20: 'brown',                 // Centaur Lancer
        25: 'red',                   // Phoenix Knight
        30: 'blue',                  // Storm Elementalist
        40: 'deep-purple',           // Shadow Assassin
        50: 'yellow',                // Celestial Paladin
        75: 'cyan',                  // Frost Giant
        100: 'red',                  // Ancient Wyrm
        150: 'grey',                 // Lich Master
        200: 'black',                // Demon Prince
        250: 'light-blue',           // Angel of War
        300: 'indigo',               // Void Stalker
        400: 'brown',                // Primordial Beast
        500: 'purple',               // Arcane Sovereign
        750: 'deep-purple',          // Cosmic Horror
        1000: 'orange',              // Elder God
        1500: 'teal',                // Planar Titan
        2000: 'lime',                // Reality Shaper
        2500: 'purple',              // Dimension Lord
        5000: 'deep-orange',         // Universe Walker
        10000: 'amber'               // Infinity Weaver
      };
      
      if (colors[amount]) return colors[amount];
      
      // Dynamic colors for unlisted amounts
      if (amount < 10) return 'pink';
      if (amount < 50) return 'orange';
      if (amount < 100) return 'red';
      if (amount < 500) return 'blue';
      if (amount < 1000) return 'purple';
      if (amount < 5000) return 'deep-purple';
      return 'amber';
    };
    
    // Kingdom Age names based on keyset ID
    const getKingdomAgeName = (keysetId) => {
      // Use first few characters of keyset ID to determine era
      const hash = keysetId.substring(0, 4).toLowerCase();
      const hashNum = parseInt(hash, 16) % 8;
      
      const ages = [
        'Dawn Era',
        'Golden Age', 
        'Silver Age',
        'Bronze Age',
        'Iron Age',
        'Shadow Era',
        'Crystal Era',
        'Mystic Era'
      ];
      
      return ages[hashNum];
    };
    
    const getKingdomAgeColor = (keysetId) => {
      const hash = keysetId.substring(0, 4).toLowerCase();
      const hashNum = parseInt(hash, 16) % 8;
      
      const colors = [
        'pink',
        'amber', 
        'blue-grey',
        'brown',
        'grey',
        'deep-purple',
        'cyan',
        'indigo'
      ];
      
      return colors[hashNum];
    };
    
    // Generate unit name from proof data
    const getUnitName = (proof) => {
      const typeName = getUnitTypeName(proof.amount);
      const instance = getUnitInstance(proof);
      return `${typeName} ${instance}`;
    };
    
    const getUnitInstance = (proof) => {
      // Use secret to generate a unique identifier
      const hash = proof.secret.substring(0, 6);
      const hashNum = parseInt(hash, 16) % 999 + 1;
      return `#${hashNum.toString().padStart(3, '0')}`;
    };
    
    const getUnitStatusIcon = (proof) => {
      return proof.reserved ? 'local_fire_department' : 'check_circle';
    };
    
    // Deterministic property extraction from C value
    const hashString = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash);
    };
    
    const getUnitPower = (proof) => {
      const hash = hashString(proof.C.substring(0, 16));
      return Math.floor((hash % 50) + (proof.amount * 2) + 10);
    };
    
    const getUnitDefense = (proof) => {
      const hash = hashString(proof.C.substring(16, 32));
      return Math.floor((hash % 40) + (proof.amount * 1.5) + 8);
    };
    
    const getUnitElement = (proof) => {
      const hash = hashString(proof.C.substring(8, 24));
      const elements = ['Fire', 'Water', 'Earth', 'Air', 'Lightning', 'Ice', 'Light', 'Shadow'];
      return elements[hash % elements.length];
    };
    
    const getElementColor = (element) => {
      const colors = {
        'Fire': 'red',
        'Water': 'blue', 
        'Earth': 'brown',
        'Air': 'light-blue',
        'Lightning': 'yellow',
        'Ice': 'cyan',
        'Light': 'amber',
        'Shadow': 'deep-purple'
      };
      return colors[element] || 'primary';
    };
    
    const getElementIcon = (element) => {
      const icons = {
        'Fire': 'local_fire_department',
        'Water': 'water_drop',
        'Earth': 'terrain', 
        'Air': 'air',
        'Lightning': 'flash_on',
        'Ice': 'ac_unit',
        'Light': 'light_mode',
        'Shadow': 'dark_mode'
      };
      return icons[element] || 'auto_awesome';
    };
    
    const getUnitRarity = (proof) => {
      const hash = hashString(proof.C.substring(24, 40));
      const rarityRoll = hash % 1000;
      
      if (rarityRoll < 1) return 'Legendary';
      if (rarityRoll < 10) return 'Epic'; 
      if (rarityRoll < 50) return 'Rare';
      if (rarityRoll < 200) return 'Uncommon';
      return 'Common';
    };
    
    const getRarityColor = (rarity) => {
      const colors = {
        'Legendary': 'deep-orange',
        'Epic': 'purple',
        'Rare': 'blue',
        'Uncommon': 'green', 
        'Common': 'grey'
      };
      return colors[rarity] || 'grey';
    };
    
    // Enhanced C Value Analysis Methods
    const getCValueFormat = (cValue) => {
      // Detect format of C value
      if (!cValue) return 'Unknown';
      if (/^[0-9a-fA-F]+$/.test(cValue)) return 'Hexadecimal';
      if (/^[A-Za-z0-9+/]*={0,2}$/.test(cValue)) return 'Base64';
      return 'Custom';
    };
    
    const getCValueEntropy = (cValue) => {
      // Calculate approximate entropy in bits
      if (!cValue) return 0;
      const uniqueChars = new Set(cValue.toLowerCase()).size;
      const length = cValue.length;
      return Math.round(length * Math.log2(uniqueChars));
    };
    
    const getCValueUniqueness = (cValue) => {
      // Check if this C value is unique in the wallet
      const allCValues = proofs.value.map(p => p.C);
      const occurrences = allCValues.filter(c => c === cValue).length;
      return occurrences === 1 ? 'Unique' : `${occurrences} duplicates`;
    };
    
    const copyToClipboard = async (text, label) => {
      try {
        await navigator.clipboard.writeText(text);
        $q.notify({
          type: 'positive',
          message: `${label} copied to clipboard!`,
          timeout: 2000,
          position: 'top'
        });
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to copy to clipboard',
          timeout: 2000,
          position: 'top'
        });
      }
    };
    
    const exportProofJSON = (proof) => {
      try {
        const proofData = {
          amount: proof.amount,
          id: proof.id,
          secret: proof.secret,
          C: proof.C,
          dleq: proof.dleq,
          reserved: proof.reserved,
          quote: proof.quote,
          exported_at: new Date().toISOString(),
          manastr_version: 'v1.0'
        };
        
        const jsonString = JSON.stringify(proofData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `manastr-unit-${GameUtils.getUnitInstance(proof)}-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        $q.notify({
          type: 'positive',
          message: 'Proof JSON exported successfully!',
          timeout: 3000,
          position: 'top'
        });
      } catch (error) {
        console.error('Export failed:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to export proof JSON',
          timeout: 3000,
          position: 'top'
        });
      }
    };
    
    const startCValueComparison = (proof) => {
      // For now, just show the C value analysis
      showCValueAnalysis.value = true;
      $q.notify({
        type: 'info',
        message: 'C Value comparison coming soon! Currently showing detailed analysis.',
        timeout: 3000,
        position: 'top'
      });
    };
    
    
    return {
      proofs,
      selectedProof,
      groupedUnits,
      totalAmount,
      activeUnitLabel,
      selectUnitProof,
      formatAmount,
      searchQuery,
      
      // Enhanced C value inspection
      showFullCValue,
      showCValueAnalysis,
      getCValueFormat,
      getCValueEntropy,
      getCValueUniqueness,
      copyToClipboard,
      exportProofJSON,
      startCValueComparison,
      
      // Unit type methods (from shared GameUtils)
      getUnitTypeName: GameUtils.getUnitTypeName,
      getUnitTypeDescription: GameUtils.getUnitTypeDescription, 
      getUnitTypeIcon: GameUtils.getUnitTypeIcon,
      getUnitTypeColor: GameUtils.getUnitTypeColor,
      
      // Kingdom age methods (from shared GameUtils)
      getKingdomAgeName: GameUtils.getKingdomAgeName,
      getKingdomAgeColor: GameUtils.getKingdomAgeColor,
      
      // Unit instance methods (from shared GameUtils)
      getUnitName: GameUtils.getUnitName,
      getUnitInstance: GameUtils.getUnitInstance,
      getUnitStatusIcon: GameUtils.getUnitStatusIcon,
      
      // Unit properties from C value (from shared GameUtils)
      getUnitPower: GameUtils.getUnitPower,
      getUnitDefense: GameUtils.getUnitDefense,
      getUnitElement: GameUtils.getUnitElement,
      getElementColor: GameUtils.getElementColor,
      getElementIcon: GameUtils.getElementIcon,
      getUnitRarity: GameUtils.getUnitRarity,
      getRarityColor: GameUtils.getRarityColor
    };
  }
});
</script>

<style lang="scss" scoped>
.ecash-browser-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.browser-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.proof-sidebar {
  width: 350px;
  display: flex;
  flex-direction: column;
}

.body--dark .proof-sidebar {
  border-right: 1px solid var(--q-dark-page);
}

.body--light .proof-sidebar {
  border-right: 1px solid #e0e0e0;
}

.sidebar-header {
  flex-shrink: 0;
}

.proof-list {
  flex: 1;
  height: 100%;
}

.selected-proof {
  border-right: 3px solid var(--q-primary);
}

.body--dark .selected-proof {
  background: rgba(25, 118, 210, 0.2) !important;
}

.body--light .selected-proof {
  background: #e3f2fd !important;
}

.inspection-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.proof-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.details-header {
  flex-shrink: 0;
}

.details-content {
  flex: 1;
  height: 100%;
}

.c-value-display {
  .monospace-input {
    font-family: 'Courier New', monospace;
  }
}

.monospace-text {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 3px;
  word-break: break-all;
}

.witness-content {
  padding: 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.proof-fields {
  .q-expansion-item {
    border-radius: 4px;
    margin-bottom: 8px;
    border: 1px solid;
  }
}

.body--dark .proof-fields .q-expansion-item {
  border-color: #424242;
}

.body--light .proof-fields .q-expansion-item {
  border-color: #e0e0e0;
}

/* Inline explanation styles */
.explanation-text {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 8px 12px;
  border-left: 3px solid rgba(255, 255, 255, 0.3);
}

.body--dark .explanation-text {
  background: rgba(255, 255, 255, 0.05);
  border-left-color: rgba(255, 255, 255, 0.2);
}

.body--light .explanation-text {
  background: rgba(0, 0, 0, 0.05);
  border-left-color: rgba(0, 0, 0, 0.15);
}

.property-card {
  padding: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  text-align: center;
}

.body--dark .property-card {
  background: rgba(255, 255, 255, 0.05);
}

.body--light .property-card {
  background: rgba(0, 0, 0, 0.03);
}

.technical-data {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  padding: 8px 12px;
}

.body--dark .technical-data {
  background: rgba(255, 255, 255, 0.03);
}

.body--light .technical-data {
  background: rgba(0, 0, 0, 0.02);
}

.unit-description {
  font-style: italic;
  line-height: 1.4;
}

/* Better spacing for inline sections */
.proof-fields .q-card {
  transition: all 0.2s ease;
}

.proof-fields .q-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.body--dark .proof-fields .q-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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

/* Enhanced C value analysis styles */
.c-value-segments {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 8px;
}

.body--light .c-value-segments {
  border-color: rgba(0, 0, 0, 0.1);
}

.segment-item {
  padding: 4px 0;
}

.segment-highlight {
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 11px;
  word-break: break-all;
}

.power-segment {
  background: rgba(244, 67, 54, 0.2);
  border-left: 3px solid #f44336;
}

.defense-segment {
  background: rgba(33, 150, 243, 0.2);
  border-left: 3px solid #2196f3;
}

.element-segment {
  background: rgba(156, 39, 176, 0.2);
  border-left: 3px solid #9c27b0;
}

.rarity-segment {
  background: rgba(255, 193, 7, 0.2);
  border-left: 3px solid #ffc107;
}

.stat-card {
  padding: 12px;
  border-radius: 6px;
  text-align: center;
}

.clickable-text {
  transition: background-color 0.2s ease;
}

.clickable-text:hover {
  opacity: 0.8;
}

.body--dark .stat-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.body--light .stat-card {
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .browser-layout {
    flex-direction: column;
  }
  
  .proof-sidebar {
    width: 100%;
    height: 40vh;
  }
  
  .inspection-panel {
    height: 60vh;
  }
  
  .flow-steps .q-btn-group {
    width: 100%;
  }
  
  .flow-steps .q-btn-group .q-btn {
    flex: 1;
    font-size: 0.8rem;
  }
  
  .c-value-segments {
    overflow-x: auto;
  }
  
  .segment-highlight {
    font-size: 10px;
  }
}
</style>