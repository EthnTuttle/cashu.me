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
          <q-icon name="info" size="sm" class="q-ml-sm">
            <q-tooltip>View and manage your magical units and their properties</q-tooltip>
          </q-icon>
        </q-toolbar-title>
        <q-space />
        <div class="text-caption">
          {{ proofs.length }} units | {{ totalAmount }} {{ activeUnitLabel }}
        </div>
      </q-toolbar>
    </div>

    <!-- Main Content -->
    <div class="browser-layout" :class="$q.dark.isActive ? 'bg-dark' : 'bg-grey-1'">
      <!-- Left Sidebar - Proof List -->
      <div class="proof-sidebar" :class="$q.dark.isActive ? 'bg-dark' : 'bg-white'">
        <div class="sidebar-header" :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-1'">
          <div class="text-subtitle2 q-pa-md">
            Unit Armory
            <q-icon name="info" size="sm" class="q-ml-sm">
              <q-tooltip>Units grouped by type and kingdom age</q-tooltip>
            </q-icon>
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
                  <q-icon name="info" size="sm" class="q-ml-sm">
                    <q-tooltip>{{ getUnitTypeName(selectedProof.amount) }} from {{ getKingdomAgeName(selectedProof.id) }}</q-tooltip>
                  </q-icon>
                </div>
                <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                  {{ getUnitTypeName(selectedProof.amount) }} • {{ formatAmount(selectedProof.amount) }} {{ activeUnitLabel }}
                </div>
              </div>
              <div class="col-auto">
                <q-badge 
                  :color="selectedProof.reserved ? 'warning' : 'positive'"
                  :label="selectedProof.reserved ? 'Deployed' : 'Ready'"
                >
                  <q-tooltip>{{ selectedProof.reserved ? 'This unit is currently deployed in battle' : 'This unit is ready for combat' }}</q-tooltip>
                </q-badge>
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
                    <q-icon name="info" size="sm" class="q-ml-sm">
                      <q-tooltip>Properties derived from the unit's unique magical signature</q-tooltip>
                    </q-icon>
                  </div>
                  
                  <!-- Decoded Properties from C Value -->
                  <div class="unit-properties">
                    <div class="row q-gutter-md q-mb-md">
                      <div class="col">
                        <div class="text-subtitle2">
                          <q-icon name="flash_on" class="q-mr-xs" />
                          Power Level
                          <q-icon name="info" size="xs" class="q-ml-xs">
                            <q-tooltip>Combat effectiveness derived from magical signature</q-tooltip>
                          </q-icon>
                        </div>
                        <div class="text-h4 text-weight-bold">{{ getUnitPower(selectedProof) }}</div>
                      </div>
                      <div class="col">
                        <div class="text-subtitle2">
                          <q-icon name="shield" class="q-mr-xs" />
                          Defense
                          <q-icon name="info" size="xs" class="q-ml-xs">
                            <q-tooltip>Defensive capabilities from magical essence</q-tooltip>
                          </q-icon>
                        </div>
                        <div class="text-h4 text-weight-bold">{{ getUnitDefense(selectedProof) }}</div>
                      </div>
                    </div>
                    
                    <div class="row q-gutter-md">
                      <div class="col">
                        <div class="text-subtitle2">
                          <q-icon name="psychology" class="q-mr-xs" />
                          Element
                          <q-icon name="info" size="xs" class="q-ml-xs">
                            <q-tooltip>Elemental affinity determined by magical signature</q-tooltip>
                          </q-icon>
                        </div>
                        <q-chip 
                          :color="getElementColor(getUnitElement(selectedProof))" 
                          text-color="white" 
                          :icon="getElementIcon(getUnitElement(selectedProof))"
                        >
                          {{ getUnitElement(selectedProof) }}
                        </q-chip>
                      </div>
                      <div class="col">
                        <div class="text-subtitle2">
                          <q-icon name="star" class="q-mr-xs" />
                          Rarity
                          <q-icon name="info" size="xs" class="q-ml-xs">
                            <q-tooltip>Rarity tier based on magical pattern complexity</q-tooltip>
                          </q-icon>
                        </div>
                        <q-chip 
                          :color="getRarityColor(getUnitRarity(selectedProof))" 
                          text-color="white"
                        >
                          {{ getUnitRarity(selectedProof) }}
                        </q-chip>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- Technical Details -->
              <div class="proof-fields">
                
                <!-- Kingdom Age Details -->
                <q-expansion-item
                  expand-separator
                  icon="castle"
                  :label="`Kingdom Age: ${getKingdomAgeName(selectedProof.id)}`"
                  :header-inset-level="0.5"
                  :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
                >
                  <template v-slot:header>
                    <q-item-section avatar>
                      <q-icon name="castle" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Kingdom Age: {{ getKingdomAgeName(selectedProof.id) }}</q-item-label>
                      <q-item-label caption>
                        <q-icon name="info" size="xs" class="q-mr-xs">
                          <q-tooltip>The era when this unit's magical essence was forged</q-tooltip>
                        </q-icon>
                        Era of magical creation
                      </q-item-label>
                    </q-item-section>
                  </template>
                  
                  <div class="q-pa-md" :class="$q.dark.isActive ? 'bg-grey-8' : 'bg-grey-1'">
                    <div class="text-body2 q-mb-sm">
                      <strong>Age:</strong> {{ getKingdomAgeName(selectedProof.id) }}
                    </div>
                    <div class="text-body2 q-mb-sm">
                      <strong>Era Signature:</strong> 
                      <span class="monospace-text" :class="$q.dark.isActive ? 'bg-grey-7' : 'bg-grey-2'">
                        {{ selectedProof.id.substring(0, 8) }}...
                      </span>
                    </div>
                    <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                      Full ID: {{ selectedProof.id }}
                    </div>
                  </div>
                </q-expansion-item>

                <!-- Arcane Essence -->
                <q-expansion-item
                  expand-separator
                  icon="auto_awesome"
                  label="Arcane Essence"
                  :header-inset-level="0.5"
                  :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
                >
                  <template v-slot:header>
                    <q-item-section avatar>
                      <q-icon name="auto_awesome" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Arcane Essence</q-item-label>
                      <q-item-label caption>
                        <q-icon name="info" size="xs" class="q-mr-xs">
                          <q-tooltip>The unique magical signature that defines this unit's properties</q-tooltip>
                        </q-icon>
                        Unique magical identifier
                      </q-item-label>
                    </q-item-section>
                  </template>
                  
                  <div class="q-pa-md" :class="$q.dark.isActive ? 'bg-grey-8' : 'bg-grey-1'">
                    <div class="text-body2 q-mb-sm">
                      <strong>Essence Pattern:</strong> 
                      <span class="monospace-text" :class="$q.dark.isActive ? 'bg-grey-7' : 'bg-grey-2'">
                        {{ selectedProof.secret.substring(0, 16) }}...
                      </span>
                    </div>
                    <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                      This pattern determines the unit's unique abilities and characteristics
                    </div>
                  </div>
                </q-expansion-item>

                <!-- Magical Signature -->
                <q-expansion-item
                  expand-separator
                  icon="fingerprint"
                  label="Magical Signature (C)"
                  :header-inset-level="0.5"
                  :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
                >
                  <template v-slot:header>
                    <q-item-section avatar>
                      <q-icon name="fingerprint" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Magical Signature</q-item-label>
                      <q-item-label caption>
                        <q-icon name="info" size="xs" class="q-mr-xs">
                          <q-tooltip>The cryptographic signature that validates this unit's magical authenticity</q-tooltip>
                        </q-icon>
                        Authenticity validation
                      </q-item-label>
                    </q-item-section>
                  </template>
                  
                  <div class="q-pa-md" :class="$q.dark.isActive ? 'bg-grey-8' : 'bg-grey-1'">
                    <div class="text-body2 q-mb-sm">
                      <strong>Signature Hash:</strong> 
                      <span class="monospace-text" :class="$q.dark.isActive ? 'bg-grey-7' : 'bg-grey-2'">
                        {{ selectedProof.C.substring(0, 20) }}...
                      </span>
                    </div>
                    <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                      This signature proves the unit's legitimacy and is used to derive its properties
                    </div>
                  </div>
                </q-expansion-item>

                <!-- Authenticity Seal (DLEQ) -->
                <q-expansion-item
                  v-if="selectedProof.dleq"
                  expand-separator
                  icon="verified_user"
                  label="Authenticity Seal"
                  :header-inset-level="0.5"
                  :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
                >
                  <template v-slot:header>
                    <q-item-section avatar>
                      <q-icon name="verified_user" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Authenticity Seal</q-item-label>
                      <q-item-label caption>
                        <q-icon name="info" size="xs" class="q-mr-xs">
                          <q-tooltip>Advanced cryptographic proof ensuring this unit cannot be counterfeited</q-tooltip>
                        </q-icon>
                        Anti-forgery protection
                      </q-item-label>
                    </q-item-section>
                  </template>
                  
                  <div class="q-pa-md" :class="$q.dark.isActive ? 'bg-grey-8' : 'bg-grey-1'">
                    <div class="text-body2 q-mb-sm">
                      <strong>Seal Alpha:</strong> 
                      <span class="monospace-text" :class="$q.dark.isActive ? 'bg-grey-7' : 'bg-grey-2'">
                        {{ selectedProof.dleq.e.substring(0, 12) }}...
                      </span>
                    </div>
                    <div class="text-body2">
                      <strong>Seal Beta:</strong>
                      <span class="monospace-text" :class="$q.dark.isActive ? 'bg-grey-7' : 'bg-grey-2'">
                        {{ selectedProof.dleq.s.substring(0, 12) }}...
                      </span>
                    </div>
                  </div>
                </q-expansion-item>

                <!-- Battle Orders -->
                <q-expansion-item
                  expand-separator
                  icon="military_tech"
                  label="Battle Status"
                  :header-inset-level="0.5"
                  :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
                >
                  <template v-slot:header>
                    <q-item-section avatar>
                      <q-icon name="military_tech" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Battle Status</q-item-label>
                      <q-item-label caption>
                        <q-icon name="info" size="xs" class="q-mr-xs">
                          <q-tooltip>Current deployment and availability status</q-tooltip>
                        </q-icon>
                        Deployment information
                      </q-item-label>
                    </q-item-section>
                  </template>
                  
                  <div class="q-pa-md" :class="$q.dark.isActive ? 'bg-grey-8' : 'bg-grey-1'">
                    <div class="text-body2 q-mb-sm">
                      <strong>Status:</strong> 
                      <q-chip 
                        :color="selectedProof.reserved ? 'warning' : 'positive'"
                        text-color="white"
                        size="sm"
                      >
                        {{ selectedProof.reserved ? 'Deployed in Battle' : 'Ready for Combat' }}
                      </q-chip>
                    </div>
                    <div v-if="selectedProof.quote" class="text-body2">
                      <strong>Mission ID:</strong> {{ selectedProof.quote }}
                    </div>
                    <div v-if="!selectedProof.reserved" class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                      This unit is available for immediate deployment
                    </div>
                  </div>
                </q-expansion-item>

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

export default defineComponent({
  name: 'ManastrArsenal',
  setup() {
    const $q = useQuasar();
    const proofsStore = useProofsStore();
    const mintsStore = useMintsStore();
    
    const selectedProof = ref(null);
    
    const proofs = computed(() => proofsStore.proofs);
    
    // Group proofs by amount (unit type)
    const groupedUnits = computed(() => {
      const groups = {};
      proofs.value.forEach(proof => {
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
    
    return {
      proofs,
      selectedProof,
      groupedUnits,
      totalAmount,
      activeUnitLabel,
      selectUnitProof,
      formatAmount,
      
      // Unit type methods
      getUnitTypeName,
      getUnitTypeDescription, 
      getUnitTypeIcon,
      getUnitTypeColor,
      
      // Kingdom age methods
      getKingdomAgeName,
      getKingdomAgeColor,
      
      // Unit instance methods
      getUnitName,
      getUnitInstance,
      getUnitStatusIcon,
      
      // Unit properties from C value
      getUnitPower,
      getUnitDefense,
      getUnitElement,
      getElementColor,
      getElementIcon,
      getUnitRarity,
      getRarityColor
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
}
</style>