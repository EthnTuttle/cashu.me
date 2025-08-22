<template>
  <q-dialog 
    v-model="show" 
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="info-dialog-card">
      <!-- Header -->
      <q-card-section class="row items-center q-pa-md bg-primary text-white">
        <q-icon :name="config.icon" size="md" class="q-mr-md" />
        <div class="text-h5 flex-1">{{ config.title }}</div>
        <q-btn
          flat
          round
          dense
          icon="close"
          @click="show = false"
          class="text-white"
        />
      </q-card-section>

      <!-- Content -->
      <q-card-section class="info-content">
        <div class="row">
          <!-- Left Column - Manastr Gaming Context -->
          <div class="col-12 col-md-6 q-pr-md">
            <div class="gaming-context-panel">
              <div class="section-header">
                <q-icon name="videogame_asset" class="q-mr-sm" />
                <span class="text-h6">In Manastr Gaming</span>
              </div>
              
              <div class="context-content" v-html="config.gamingExplanation"></div>
              
              <!-- Visual Examples for Gaming -->
              <div v-if="config.gamingExamples" class="gaming-examples">
                <div class="text-subtitle2 q-mt-md q-mb-sm">
                  <q-icon name="psychology" class="q-mr-xs" />
                  How This Works in Battle:
                </div>
                <div class="examples-grid">
                  <q-card
                    v-for="(example, index) in config.gamingExamples"
                    :key="index"
                    flat
                    bordered
                    class="example-card"
                  >
                    <q-card-section class="q-pa-sm">
                      <div class="example-title">{{ example.scenario }}</div>
                      <div class="example-description">{{ example.explanation }}</div>
                      <div v-if="example.outcome" class="example-outcome">
                        <q-icon name="arrow_forward" size="xs" class="q-mr-xs" />
                        {{ example.outcome }}
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>

              <!-- Interactive Demo -->
              <div v-if="config.interactiveDemo" class="interactive-demo">
                <div class="text-subtitle2 q-mt-lg q-mb-sm">
                  <q-icon name="play_circle" class="q-mr-xs" />
                  Try It Yourself:
                </div>
                <component 
                  :is="config.interactiveDemo.component"
                  v-bind="config.interactiveDemo.props"
                />
              </div>
            </div>
          </div>

          <!-- Right Column - Technical Deep Dive -->
          <div class="col-12 col-md-6 q-pl-md">
            <div class="technical-context-panel">
              <div class="section-header technical">
                <q-icon name="code" class="q-mr-sm" />
                <span class="text-h6">Technical Deep Dive</span>
              </div>
              
              <div class="tech-content" v-html="config.technicalExplanation"></div>

              <!-- Code Examples -->
              <div v-if="config.codeExamples" class="code-examples">
                <div class="text-subtitle2 q-mt-md q-mb-sm">
                  <q-icon name="integration_instructions" class="q-mr-xs" />
                  Implementation Details:
                </div>
                <q-expansion-item
                  v-for="(code, index) in config.codeExamples"
                  :key="index"
                  :label="code.title"
                  icon="code"
                  class="code-expansion"
                >
                  <div class="code-block">
                    <pre><code>{{ code.code }}</code></pre>
                  </div>
                  <div v-if="code.explanation" class="code-explanation">
                    {{ code.explanation }}
                  </div>
                </q-expansion-item>
              </div>

              <!-- Technical Specs -->
              <div v-if="config.technicalSpecs" class="technical-specs">
                <div class="text-subtitle2 q-mt-md q-mb-sm">
                  <q-icon name="settings" class="q-mr-xs" />
                  Technical Specifications:
                </div>
                <q-list dense class="spec-list">
                  <q-item
                    v-for="(spec, key) in config.technicalSpecs"
                    :key="key"
                    class="spec-item"
                  >
                    <q-item-section avatar style="min-width: 100px;">
                      <span class="spec-label">{{ key }}:</span>
                    </q-item-section>
                    <q-item-section>
                      <span class="spec-value">{{ spec }}</span>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>

              <!-- Security Implications -->
              <div v-if="config.securityNotes" class="security-section">
                <div class="text-subtitle2 q-mt-md q-mb-sm">
                  <q-icon name="security" class="q-mr-xs" />
                  Security & Privacy:
                </div>
                <q-banner rounded class="security-banner">
                  <template v-slot:avatar>
                    <q-icon name="verified_user" color="positive" />
                  </template>
                  <div class="security-content" v-html="config.securityNotes"></div>
                </q-banner>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Footer Actions -->
      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          v-if="config.learnMoreUrl"
          flat
          color="primary"
          :href="config.learnMoreUrl"
          target="_blank"
          icon="open_in_new"
          label="Learn More"
        />
        <q-btn
          flat
          color="primary"
          @click="show = false"
          label="Got It!"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent, ref, watch } from 'vue';

export default defineComponent({
  name: 'ManastrInfoDialog',
  props: {
    modelValue: Boolean,
    config: {
      type: Object,
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const show = ref(props.modelValue);

    watch(
      () => props.modelValue,
      (newValue) => {
        show.value = newValue;
      }
    );

    watch(show, (newValue) => {
      emit('update:modelValue', newValue);
    });

    return {
      show
    };
  }
});
</script>

<style lang="scss" scoped>
.info-dialog-card {
  max-height: 95vh;
  display: flex;
  flex-direction: column;
}

.info-content {
  flex: 1;
  overflow-y: auto;
  max-height: calc(95vh - 140px);
}

.section-header {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 16px;
  color: #1976d2;
  
  &.technical {
    color: #7b1fa2;
  }
}

.body--dark .section-header {
  border-bottom-color: #424242;
}

.gaming-context-panel,
.technical-context-panel {
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.gaming-context-panel {
  background: linear-gradient(145deg, #e3f2fd 0%, #f3e5f5 100%);
  border-left: 4px solid #1976d2;
}

.body--dark .gaming-context-panel {
  background: linear-gradient(145deg, rgba(25, 118, 210, 0.1) 0%, rgba(123, 31, 162, 0.1) 100%);
}

.technical-context-panel {
  background: linear-gradient(145deg, #f3e5f5 0%, #e8f5e8 100%);
  border-left: 4px solid #7b1fa2;
}

.body--dark .technical-context-panel {
  background: linear-gradient(145deg, rgba(123, 31, 162, 0.1) 0%, rgba(76, 175, 80, 0.1) 100%);
}

.context-content,
.tech-content {
  line-height: 1.6;
  margin-bottom: 16px;

  ::v-deep(h3) {
    margin: 16px 0 8px 0;
    color: #1976d2;
  }

  ::v-deep(p) {
    margin-bottom: 12px;
  }

  ::v-deep(ul) {
    margin: 8px 0;
    padding-left: 20px;
  }

  ::v-deep(strong) {
    color: #1976d2;
  }
}

.body--dark .context-content ::v-deep(h3),
.body--dark .context-content ::v-deep(strong),
.body--dark .tech-content ::v-deep(h3),
.body--dark .tech-content ::v-deep(strong) {
  color: #90caf9;
}

.gaming-examples {
  margin-top: 20px;
}

.examples-grid {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.example-card {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid #e0e0e0;
}

.body--dark .example-card {
  background: rgba(255, 255, 255, 0.05);
  border-color: #424242;
}

.example-title {
  font-weight: 600;
  color: #1976d2;
  margin-bottom: 4px;
}

.body--dark .example-title {
  color: #90caf9;
}

.example-description {
  font-size: 14px;
  margin-bottom: 8px;
  color: #666;
}

.body--dark .example-description {
  color: #bbb;
}

.example-outcome {
  font-size: 13px;
  font-style: italic;
  color: #2e7d32;
  display: flex;
  align-items: center;
}

.body--dark .example-outcome {
  color: #81c784;
}

.code-examples {
  margin-top: 20px;
}

.code-expansion {
  margin-bottom: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.body--dark .code-expansion {
  border-color: #424242;
}

.code-block {
  background: #f5f5f5;
  padding: 12px;
  margin: 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  overflow-x: auto;
}

.body--dark .code-block {
  background: #2d2d2d;
  color: #f5f5f5;
}

.code-explanation {
  padding: 0 12px 12px;
  font-size: 14px;
  color: #666;
}

.body--dark .code-explanation {
  color: #bbb;
}

.technical-specs {
  margin-top: 20px;
}

.spec-list {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  padding: 8px;
}

.body--dark .spec-list {
  background: rgba(255, 255, 255, 0.05);
}

.spec-item {
  min-height: 32px;
  padding: 4px 0;
}

.spec-label {
  font-weight: 600;
  color: #7b1fa2;
}

.body--dark .spec-label {
  color: #ce93d8;
}

.spec-value {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #333;
}

.body--dark .spec-value {
  color: #ccc;
}

.security-section {
  margin-top: 20px;
}

.security-banner {
  background: #e8f5e8;
  border-left: 4px solid #4caf50;
}

.body--dark .security-banner {
  background: rgba(76, 175, 80, 0.1);
}

.security-content {
  line-height: 1.5;
  
  ::v-deep(strong) {
    color: #2e7d32;
  }
}

.body--dark .security-content ::v-deep(strong) {
  color: #81c784;
}

.interactive-demo {
  margin-top: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  border: 2px dashed #1976d2;
}

.body--dark .interactive-demo {
  background: rgba(255, 255, 255, 0.02);
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .info-content .row {
    flex-direction: column;
  }
  
  .col-md-6 {
    padding: 0 !important;
    margin-bottom: 20px;
  }
}
</style>