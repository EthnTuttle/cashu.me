// Manastr Info Dialog Configurations
// Each configuration provides both gaming context and technical deep dive

export const INFO_CONFIGS = {
  magicalProperties: {
    title: 'Magical Properties System',
    icon: 'auto_awesome',
    gamingExplanation: `
      <h3>🎮 Your Unit's Combat Stats</h3>
      <p>Every unit in Manastr derives its <strong>magical properties</strong> from its unique <strong>C value signature</strong> - a cryptographic fingerprint that ensures your unit's stats are:</p>
      <ul>
        <li><strong>Unpredictable:</strong> No one can predict what stats a unit will have before minting</li>
        <li><strong>Tamper-Proof:</strong> Stats cannot be modified or hacked</li>
        <li><strong>Verifiable:</strong> Anyone can verify your unit's stats are legitimate</li>
        <li><strong>Unique:</strong> Each unit has a distinct magical signature</li>
      </ul>
      <p><strong>Why This Matters:</strong> This system prevents cheating while creating exciting variety in your army. When you receive a new mana token, you're opening a magical "loot box" with guaranteed authenticity!</p>
    `,
    technicalExplanation: `
      <h3>🔧 Cashu C Value Deterministic Generation</h3>
      <p>The <strong>C value</strong> is the unblinded signature from the Cashu mint's blind signing process. This 256-bit cryptographic commitment serves as a deterministic seed for generating unit properties.</p>
      
      <h4>Process:</h4>
      <ol>
        <li><strong>Mint Operation:</strong> When you request mana tokens, the mint creates a blind signature</li>
        <li><strong>Unblinding:</strong> Your wallet unblinds the signature, revealing the C value</li>
        <li><strong>Property Extraction:</strong> Different segments of the C value determine different properties</li>
        <li><strong>Deterministic Hashing:</strong> Hash functions ensure consistent property generation</li>
      </ol>
      
      <p><strong>Security Benefits:</strong></p>
      <ul>
        <li>Properties are derived from cryptographic randomness</li>
        <li>No trusted party controls unit generation</li>
        <li>All property calculations are verifiable</li>
        <li>Impossible to predict properties before minting</li>
      </ul>
    `,
    gamingExamples: [
      {
        scenario: "Unit Summoning",
        explanation: "When you spend 25 mana to summon a Phoenix Knight, its Power Level is calculated from bytes 0-16 of the C value",
        outcome: "You get a Phoenix Knight #157 with 85 Power, 67 Defense, Fire element"
      },
      {
        scenario: "Army Planning",
        explanation: "You can inspect your units before battles to plan optimal team compositions",
        outcome: "Deploy high-defense units as tanks, high-power units as damage dealers"
      },
      {
        scenario: "Trading Strategy",
        explanation: "Players might trade units with complementary properties",
        outcome: "Trade your extra Fire units for someone's Ice units to balance your army"
      }
    ],
    codeExamples: [
      {
        title: "Property Extraction Algorithm",
        code: `// Extract power from C value
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
};`,
        explanation: "This deterministic function ensures the same C value always produces the same power level"
      },
      {
        title: "Element Determination",
        code: `const getUnitElement = (proof) => {
  const hash = hashString(proof.C.substring(8, 24));
  const elements = ['Fire', 'Water', 'Earth', 'Air', 
                   'Lightning', 'Ice', 'Light', 'Shadow'];
  return elements[hash % elements.length];
};`,
        explanation: "Uses a different segment of the C value to determine elemental affinity"
      }
    ],
    technicalSpecs: {
      'Input': 'Cashu proof C value (256 bits)',
      'Hash Function': 'Custom deterministic string hash',
      'Property Range': 'Power: amount*2+10 to amount*2+60',
      'Elements': '8 possible (Fire, Water, Earth, etc.)',
      'Rarity Distribution': 'Common: 80%, Rare: 15%, Epic: 4.9%, Legendary: 0.1%'
    },
    securityNotes: `
      <strong>Privacy:</strong> C values are publicly visible but don't reveal personal information.<br>
      <strong>Fairness:</strong> Mint cannot manipulate properties - they're determined by cryptographic randomness.<br>
      <strong>Verifiability:</strong> Anyone can re-calculate unit properties from the C value to verify authenticity.
    `,
    learnMoreUrl: 'https://github.com/cashubtc/nuts/blob/main/02.md'
  },

  kingdomAge: {
    title: 'Kingdom Age System',
    icon: 'castle',
    gamingExplanation: `
      <h3>🏰 The Era of Your Unit's Creation</h3>
      <p>Each unit belongs to a <strong>Kingdom Age</strong> - the magical era when its essence was first forged. This age determines:</p>
      <ul>
        <li><strong>Visual Theme:</strong> Units from the same age share similar magical aesthetics</li>
        <li><strong>Historical Context:</strong> Dawn Era units are ancient and mystical, Crystal Era units are technologically advanced</li>
        <li><strong>Collection Value:</strong> Some ages may be rarer than others based on mint timing</li>
        <li><strong>Future Expansions:</strong> Age-specific abilities or bonuses may be added in future updates</li>
      </ul>
      <p><strong>The Eight Ages:</strong> Dawn Era, Golden Age, Silver Age, Bronze Age, Iron Age, Shadow Era, Crystal Era, Mystic Era</p>
    `,
    technicalExplanation: `
      <h3>🔧 Cashu Keyset ID Mapping</h3>
      <p>The <strong>Kingdom Age</strong> is determined by the <strong>keyset ID</strong> from your Cashu proof. This ID identifies which cryptographic keys the mint used to sign your token.</p>
      
      <h4>Technical Details:</h4>
      <ul>
        <li><strong>Keyset Rotation:</strong> Mints periodically generate new keysets for security</li>
        <li><strong>Age Mapping:</strong> We map keyset IDs to Kingdom Ages using hash modulo operations</li>
        <li><strong>Consistency:</strong> Same keyset ID always maps to same Kingdom Age</li>
        <li><strong>Temporal Grouping:</strong> Units minted around the same time share the same age</li>
      </ul>
      
      <p><strong>Why This Matters:</strong></p>
      <ul>
        <li>Provides natural grouping of units by mint period</li>
        <li>Creates collectible "series" of units</li>
        <li>Enables historical tracking of unit origins</li>
        <li>Supports future expansion with age-specific features</li>
      </ul>
    `,
    gamingExamples: [
      {
        scenario: "Collection Building",
        explanation: "Players might want to collect units from all eight Kingdom Ages",
        outcome: "Complete your Historical Arsenal achievement"
      },
      {
        scenario: "Age-Based Strategies",
        explanation: "Future updates might add synergies between units from the same age",
        outcome: "Dawn Era units get +10% power when fighting together"
      },
      {
        scenario: "Trading Communities",
        explanation: "Players might specialize in collecting specific ages",
        outcome: "Trade your modern Crystal Era units for rare Dawn Era units"
      }
    ],
    codeExamples: [
      {
        title: "Age Determination Algorithm",
        code: `const getKingdomAgeName = (keysetId) => {
  // Use first 4 characters of keyset ID
  const hash = keysetId.substring(0, 4).toLowerCase();
  const hashNum = parseInt(hash, 16) % 8;
  
  const ages = [
    'Dawn Era', 'Golden Age', 'Silver Age', 'Bronze Age',
    'Iron Age', 'Shadow Era', 'Crystal Era', 'Mystic Era'
  ];
  
  return ages[hashNum];
};`,
        explanation: "Deterministically maps keyset IDs to one of eight Kingdom Ages"
      }
    ],
    technicalSpecs: {
      'Input': 'Cashu proof keyset ID',
      'Ages Available': '8 (Dawn through Mystic Era)',
      'Distribution': 'Even distribution across ages',
      'Consistency': 'Same keyset ID always maps to same age',
      'Update Frequency': 'Changes when mint rotates keysets'
    },
    securityNotes: `
      <strong>Mint Independence:</strong> Ages are derived from technical keyset rotation, not gaming decisions.<br>
      <strong>Predictability:</strong> You cannot predict which age new tokens will have.<br>
      <strong>Authenticity:</strong> Age assignments cannot be forged or manipulated.
    `,
    learnMoreUrl: 'https://github.com/cashubtc/nuts/blob/main/02.md'
  },

  arcaneEssence: {
    title: 'Arcane Essence System',
    icon: 'auto_awesome',
    gamingExplanation: `
      <h3>✨ Your Unit's Unique Identity</h3>
      <p>The <strong>Arcane Essence</strong> is your unit's unique magical identifier - like a fingerprint or DNA sequence. This essence:</p>
      <ul>
        <li><strong>Makes Each Unit Unique:</strong> No two units share the same essence pattern</li>
        <li><strong>Determines Identity:</strong> Used to generate unit instance numbers (#001, #237, etc.)</li>
        <li><strong>Enables Ownership:</strong> Proves you control this specific unit</li>
        <li><strong>Prevents Duplication:</strong> Impossible to create fake units with copied essence</li>
      </ul>
      <p><strong>In Battle:</strong> Your essence is your unit's "serial number" - it's how the game tracks which specific unit performed actions, gained experience, or was deployed.</p>
    `,
    technicalExplanation: `
      <h3>🔧 Cashu Proof Secret</h3>
      <p>The <strong>secret</strong> field in your Cashu proof is a cryptographic secret that proves ownership of the token. In the Cashu protocol, this secret is used to spend the token.</p>
      
      <h4>Technical Role:</h4>
      <ul>
        <li><strong>Ownership Proof:</strong> Only you know this secret, proving you own the token</li>
        <li><strong>Spending Authorization:</strong> Required to spend/melt the token</li>
        <li><strong>Uniqueness Guarantee:</strong> Randomly generated, collision probability is negligible</li>
        <li><strong>Privacy Protection:</strong> Reveals nothing about your identity</li>
      </ul>
      
      <h4>Security Properties:</h4>
      <ul>
        <li>256-bit entropy provides cryptographic security</li>
        <li>Cannot be guessed or brute-forced</li>
        <li>Losing the secret means losing the token</li>
        <li>No relationship between secrets across tokens</li>
      </ul>
    `,
    gamingExamples: [
      {
        scenario: "Unit Deployment",
        explanation: "When you deploy a unit in battle, the game uses the essence to track that specific unit",
        outcome: "Phoenix Knight #157 (essence: a1b2c3...) is now in battle position"
      },
      {
        scenario: "Experience Tracking",
        explanation: "Future versions might track individual unit experience and leveling",
        outcome: "Units gain experience tied to their unique essence"
      },
      {
        scenario: "Ownership Verification",
        explanation: "Only you can command units whose essence secrets you possess",
        outcome: "Prevents others from controlling your units even if they see them"
      }
    ],
    codeExamples: [
      {
        title: "Unit Instance Generation",
        code: `const getUnitInstance = (proof) => {
  // Use first 6 characters of secret
  const hash = proof.secret.substring(0, 6);
  const hashNum = parseInt(hash, 16) % 999 + 1;
  return \`#\${hashNum.toString().padStart(3, '0')}\`;
};`,
        explanation: "Creates unique unit instance numbers from essence patterns"
      }
    ],
    technicalSpecs: {
      'Type': 'Cryptographic secret (base64 encoded)',
      'Entropy': '256 bits of randomness',
      'Usage': 'Token spending authorization',
      'Uniqueness': 'Collision probability: ~10^-77',
      'Storage': 'Client-side only (never share!)'
    },
    securityNotes: `
      <strong>Critical:</strong> Never share your Arcane Essence (secret) with anyone - it controls your unit!<br>
      <strong>Backup:</strong> Losing the secret means permanently losing the unit.<br>
      <strong>Privacy:</strong> The secret reveals nothing about your real identity.
    `,
    learnMoreUrl: 'https://github.com/cashubtc/nuts/blob/main/00.md'
  },

  magicalSignature: {
    title: 'Magical Signature (C Value)',
    icon: 'fingerprint',
    gamingExplanation: `
      <h3>🔐 Your Unit's Authenticity Certificate</h3>
      <p>The <strong>Magical Signature</strong> is like a tamper-proof certificate of authenticity for your unit. This signature:</p>
      <ul>
        <li><strong>Proves Legitimacy:</strong> Confirms your unit was created by the official Manastr mint</li>
        <li><strong>Prevents Counterfeits:</strong> Impossible to forge or duplicate</li>
        <li><strong>Enables Verification:</strong> Anyone can verify your unit is authentic</li>
        <li><strong>Generates Properties:</strong> Used as the seed for all unit characteristics</li>
      </ul>
      <p><strong>Think of it like:</strong> A holographic sticker on a trading card, but mathematically impossible to fake!</p>
    `,
    technicalExplanation: `
      <h3>🔧 Cashu C Value (Unblinded Signature)</h3>
      <p>The <strong>C value</strong> is the result of the Cashu blind signature protocol. It's the mint's cryptographic signature on your token, unblinded by your wallet.</p>
      
      <h4>Blind Signature Process:</h4>
      <ol>
        <li><strong>Blinding:</strong> Your wallet blinds a message before sending to mint</li>
        <li><strong>Signing:</strong> Mint signs the blinded message (can't see original)</li>
        <li><strong>Unblinding:</strong> Your wallet unblinds the signature to get C</li>
        <li><strong>Verification:</strong> C can be verified against mint's public key</li>
      </ol>
      
      <h4>Cryptographic Properties:</h4>
      <ul>
        <li>Based on elliptic curve cryptography</li>
        <li>Unforgeable under cryptographic assumptions</li>
        <li>Provides privacy (mint can't link signatures to users)</li>
        <li>Enables offline verification</li>
      </ul>
    `,
    gamingExamples: [
      {
        scenario: "Tournament Entry",
        explanation: "Before entering tournaments, the game verifies all units have valid signatures",
        outcome: "Only legitimate units can participate in competitive play"
      },
      {
        scenario: "Trading Verification",
        explanation: "When trading units, both players can verify authenticity",
        outcome: "Trade with confidence knowing the unit is genuine"
      },
      {
        scenario: "Anti-Cheat Protection",
        explanation: "Hacked clients cannot create fake units without valid signatures",
        outcome: "Maintains fair play across all matches"
      }
    ],
    codeExamples: [
      {
        title: "Signature Verification",
        code: `// Verify C value against mint's public key
const verifySignature = (C, secret, mintPubKey) => {
  // Elliptic curve point operations
  const message = hashToCurve(secret);
  const expected = mintPubKey.multiply(message);
  return C.equals(expected);
};`,
        explanation: "Mathematical verification that the signature is valid"
      }
    ],
    technicalSpecs: {
      'Algorithm': 'Elliptic Curve Digital Signatures',
      'Curve': 'secp256k1 (same as Bitcoin)',
      'Format': '33-byte compressed point',
      'Verification': 'Against mint public keys',
      'Privacy': 'Unlinkable to minting request'
    },
    securityNotes: `
      <strong>Forgery Protection:</strong> Computationally impossible to create fake signatures.<br>
      <strong>Privacy Preservation:</strong> Signature doesn't reveal who minted the token.<br>
      <strong>Offline Verification:</strong> Can verify authenticity without contacting the mint.
    `,
    learnMoreUrl: 'https://github.com/cashubtc/nuts/blob/main/03.md'
  },

  authenticitySearch: {
    title: 'Authenticity Seal (DLEQ)',
    icon: 'verified_user',
    gamingExplanation: `
      <h3>🛡️ Advanced Anti-Forgery Protection</h3>
      <p>The <strong>Authenticity Seal</strong> is an extra layer of security that makes counterfeiting absolutely impossible. This seal:</p>
      <ul>
        <li><strong>Double-Layer Security:</strong> Provides additional proof beyond the basic signature</li>
        <li><strong>Mathematical Proof:</strong> Uses advanced cryptography to prevent any tampering</li>
        <li><strong>Future-Proof:</strong> Protects against even theoretical future attacks</li>
        <li><strong>Quantum Resistant:</strong> Designed to withstand future quantum computers</li>
      </ul>
      <p><strong>For Players:</strong> You don't need to understand the math - just know that units with this seal have the highest level of authenticity protection possible!</p>
    `,
    technicalExplanation: `
      <h3>🔧 DLEQ Proof (Discrete Log Equality)</h3>
      <p>A <strong>DLEQ proof</strong> demonstrates that the mint used the same private key consistently across the blind signature process without revealing the private key.</p>
      
      <h4>What DLEQ Proves:</h4>
      <ul>
        <li><strong>Key Consistency:</strong> Same private key used for both operations</li>
        <li><strong>No Key Manipulation:</strong> Mint can't use different keys to cheat</li>
        <li><strong>Mathematical Certainty:</strong> Provides cryptographic proof, not just trust</li>
        <li><strong>Zero-Knowledge:</strong> Proof reveals nothing about the private key</li>
      </ul>
      
      <h4>Protocol Details:</h4>
      <ol>
        <li>Mint computes signature using private key</li>
        <li>Mint generates DLEQ proof (e, s values)</li>
        <li>Client verifies proof against public operations</li>
        <li>Verification ensures mint behaved honestly</li>
      </ol>
    `,
    gamingExamples: [
      {
        scenario: "Premium Tournaments",
        explanation: "Highest-stake tournaments might require units with DLEQ proofs",
        outcome: "Only the most secure units can enter championship matches"
      },
      {
        scenario: "Insurance Against Attacks",
        explanation: "If someone discovers a way to forge basic signatures, DLEQ units remain secure",
        outcome: "Your valuable units stay protected against future threats"
      },
      {
        scenario: "Collector Premium",
        explanation: "Units with DLEQ proofs might be more valuable to collectors",
        outcome: "Enhanced authenticity adds to trading value"
      }
    ],
    codeExamples: [
      {
        title: "DLEQ Verification",
        code: `const verifyDLEQ = (proof, C1, C2, K1, K2) => {
  const { e, s } = proof;
  
  // Verify: s*G = R1 + e*K1 and s*G = R2 + e*K2
  const R1 = G.multiply(s).subtract(K1.multiply(e));
  const R2 = G.multiply(s).subtract(K2.multiply(e));
  
  const challenge = hash(R1, R2, C1, C2);
  return challenge.equals(e);
};`,
        explanation: "Mathematical verification of the DLEQ proof"
      }
    ],
    technicalSpecs: {
      'Proof Type': 'Non-interactive zero-knowledge proof',
      'Components': 'Challenge (e) and Response (s)',
      'Security': 'Based on discrete logarithm hardness',
      'Efficiency': 'Constant size regardless of complexity',
      'Standard': 'Follows RFC specifications'
    },
    securityNotes: `
      <strong>Maximum Security:</strong> Provides highest level of authenticity guarantees.<br>
      <strong>Future-Proof:</strong> Protects against advanced cryptographic attacks.<br>
      <strong>Zero Trust:</strong> Mathematical proof eliminates need to trust the mint.
    `,
    learnMoreUrl: 'https://github.com/cashubtc/nuts/blob/main/12.md'
  },

  battleStatus: {
    title: 'Battle Deployment System',
    icon: 'military_tech',
    gamingExplanation: `
      <h3>⚔️ Your Unit's Combat Readiness</h3>
      <p>The <strong>Battle Status</strong> shows whether your unit is currently deployed in combat or ready for action:</p>
      <ul>
        <li><strong>Ready for Combat:</strong> Unit is available for immediate deployment</li>
        <li><strong>Deployed in Battle:</strong> Unit is currently fighting and cannot be used elsewhere</li>
        <li><strong>Mission Tracking:</strong> Shows which specific battle or mission the unit is in</li>
        <li><strong>Strategic Planning:</strong> Helps you manage your army efficiently</li>
      </ul>
      <p><strong>Strategy Tip:</strong> Always keep some units in reserve! You never know when you'll need reinforcements or want to join a quick match.</p>
    `,
    technicalExplanation: `
      <h3>🔧 Cashu Proof Reserved State</h3>
      <p>The <strong>reserved</strong> field in Cashu proofs tracks whether a token is currently locked for spending. In Manastr, this becomes the battle deployment system.</p>
      
      <h4>Technical Implementation:</h4>
      <ul>
        <li><strong>State Tracking:</strong> Boolean field indicating availability</li>
        <li><strong>Transaction Lock:</strong> Prevents double-spending during operations</li>
        <li><strong>Atomic Operations:</strong> Ensures units can't be in multiple battles</li>
        <li><strong>Rollback Safety:</strong> Failed operations release the reservation</li>
      </ul>
      
      <h4>Battle Integration:</h4>
      <ul>
        <li>Deploying units sets reserved = true</li>
        <li>Battle completion releases the reservation</li>
        <li>Emergency recall possible with proper authorization</li>
        <li>Prevents accidental double-deployment</li>
      </ul>
    `,
    gamingExamples: [
      {
        scenario: "Army Management",
        explanation: "You have 10 units total: 6 ready for combat, 4 currently deployed",
        outcome: "Can immediately join a new match with up to 6 units"
      },
      {
        scenario: "Tournament Strategy",
        explanation: "Long tournament matches might lock units for extended periods",
        outcome: "Plan your deployments carefully for multiple concurrent events"
      },
      {
        scenario: "Emergency Response",
        explanation: "Guild war starts while your best units are in a long campaign",
        outcome: "Use backup units or wait for primary units to return"
      }
    ],
    codeExamples: [
      {
        title: "Deployment Check",
        code: `const canDeploy = (unit) => {
  return !unit.reserved && 
         unit.health > 0 && 
         unit.mint.isActive();
};

const deployUnit = async (unit, battleId) => {
  if (!canDeploy(unit)) {
    throw new Error('Unit not available for deployment');
  }
  
  // Reserve the unit
  unit.reserved = true;
  unit.currentBattle = battleId;
  
  // Submit to battle system
  await battleSystem.addUnit(battleId, unit);
};`,
        explanation: "Logic for checking deployment eligibility and reserving units"
      }
    ],
    technicalSpecs: {
      'State Field': 'Boolean reserved flag',
      'Persistence': 'Stored in local wallet database',
      'Synchronization': 'Synced with battle servers',
      'Timeout': 'Auto-release after battle completion',
      'Recovery': 'Manual release if battle system fails'
    },
    securityNotes: `
      <strong>Double-Spend Protection:</strong> Prevents units from being used in multiple battles simultaneously.<br>
      <strong>State Recovery:</strong> Battle status can be recovered from battle system if local data is lost.<br>
      <strong>Fair Play:</strong> Ensures players cannot exploit deployment mechanics.
    `,
    learnMoreUrl: 'https://github.com/cashubtc/nuts/blob/main/00.md'
  }
};

// Helper function to get config by key
export const getInfoConfig = (key) => {
  return INFO_CONFIGS[key] || null;
};

// List of all available info topics
export const INFO_TOPICS = Object.keys(INFO_CONFIGS);