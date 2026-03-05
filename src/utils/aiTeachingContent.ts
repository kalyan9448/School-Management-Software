// AI-powered topic-specific teaching content generator

export interface TopicContent {
  topicExplanation: string;
  keyDefinitions: Array<{ term: string; definition: string }>;
  formulas: Array<{ name: string; formula: string; description: string }>;
  realWorldExamples: string[];
  instructionalSteps: Array<{ title: string; content: string[]; duration: string }>;
  pedagogyAdjustments: string[];
}

export const generateTopicSpecificContent = (
  topic: string,
  subject: string,
  classLevel: string
): TopicContent => {
  let topicExplanation = '';
  let keyDefinitions: Array<{ term: string; definition: string }> = [];
  let formulas: Array<{ name: string; formula: string; description: string }> = [];
  let realWorldExamples: string[] = [];
  let instructionalSteps: Array<{ title: string; content: string[]; duration: string }> = [];
  let pedagogyAdjustments: string[] = [];

  // Mathematics Topics
  if (subject === 'Mathematics') {
    if (
      topic.toLowerCase().includes('linear equation') ||
      topic.toLowerCase().includes('algebra')
    ) {
      topicExplanation = `Linear equations in one variable are mathematical statements where a variable (usually x) appears to the first power only. These equations form the foundation of algebraic thinking and are essential for solving real-world problems involving unknown quantities. For ${classLevel} students, focus on building intuition through visual representation on number lines and balancing techniques.`;

      keyDefinitions = [
        {
          term: 'Variable',
          definition: 'A symbol (usually x, y, or z) that represents an unknown number',
        },
        {
          term: 'Coefficient',
          definition:
            'The numerical factor multiplied with the variable (in 3x, the coefficient is 3)',
        },
        { term: 'Constant', definition: 'A fixed numerical value that does not change' },
        {
          term: 'Solution',
          definition: 'The value of the variable that makes the equation true',
        },
      ];

      formulas = [
        {
          name: 'Standard Form',
          formula: 'ax + b = c',
          description: 'Where a, b, c are constants and x is the variable',
        },
        {
          name: 'Solution Formula',
          formula: 'x = (c - b) / a',
          description: 'Isolate x by inverse operations',
        },
        {
          name: 'Transposition',
          formula: 'If a + b = c, then a = c - b',
          description: 'Moving terms across equals sign changes their sign',
        },
      ];

      realWorldExamples = [
        '🛒 Shopping Budget: "I have ₹500 and bought a book for ₹120. If I want to buy pens costing ₹25 each, how many can I buy?" Equation: 120 + 25x = 500',
        '🚗 Distance-Time: "A car travels at 60 km/h. How long to cover 240 km?" Equation: 60x = 240',
        '📱 Mobile Plans: "Plan A costs ₹199 + ₹2 per minute. Plan B costs ₹299 + ₹1 per minute. At how many minutes are they equal?" Equation: 199 + 2x = 299 + x',
        '🏃 Age Problems: "Rahul is 3 years older than his sister. Their combined age is 27. Find their ages." Equation: x + (x+3) = 27',
      ];

      instructionalSteps = [
        {
          title: 'Conceptual Foundation',
          duration: '8 mins',
          content: [
            'Start with a balance scale analogy: "Equations are like balanced scales - whatever we do to one side, we must do to the other"',
            'Use concrete example: "I have some marbles (x) plus 5 more. Total is 12. How many marbles did I start with?"',
            'Draw visual representation on board with boxes and numbers',
            'Establish that our goal is to "isolate" x on one side',
          ],
        },
        {
          title: 'Teaching the Solution Method',
          duration: '12 mins',
          content: [
            'Demonstrate step-by-step: Solve 3x + 7 = 22',
            'Step 1: Subtract 7 from both sides → 3x = 15 (explain: removing the constant)',
            'Step 2: Divide both sides by 3 → x = 5 (explain: removing the coefficient)',
            'Verification: Substitute x=5 back: 3(5) + 7 = 15 + 7 = 22 ✓',
            'Solve 2-3 more examples with increasing complexity, involving students in each step',
            'Common mistakes to highlight: forgetting to apply operation to both sides, sign errors during transposition',
          ],
        },
        {
          title: 'Guided Practice with Real Problems',
          duration: '15 mins',
          content: [
            'Problem 1 (Board): "A rectangle\'s perimeter is 40 cm. Length is 12 cm. Find width." → 2(12 + x) = 40',
            'Problem 2 (Pairs): "Temperature conversion: °F = (9/5)°C + 32. If it\'s 77°F, find °C."',
            'Problem 3 (Individual): "Discount problem: After 15% discount, price is ₹850. Find original price." → x - 0.15x = 850',
            'Circulate, observe student work, provide immediate feedback',
            'Select 2-3 students to explain their solution process on board',
          ],
        },
        {
          title: 'Advanced Applications & Extensions',
          duration: '10 mins',
          content: [
            'Introduce equations with variables on both sides: 2x + 5 = x + 12',
            'Show collection method: bring all x terms to one side, constants to other',
            'Connect to word problems: "Two shops - Shop A: ₹50 setup + ₹20/item. Shop B: ₹30/item. When is cost same?"',
            'Challenge problem for quick finishers: Solve (x+3)/2 = 7',
          ],
        },
        {
          title: 'Assessment & Clarification',
          duration: '5 mins',
          content: [
            'Quick self-check: Students solve 5x - 8 = 17 on their own (answer: x = 5)',
            'Show answer, ask students to raise hands if correct (gauge understanding)',
            'Address most common error patterns observed during practice',
            'Preview next lesson: Linear equations with fractions and decimals',
          ],
        },
      ];

      pedagogyAdjustments = [
        `For ${classLevel}: Use concrete manipulatives (blocks, counters) before abstract symbols`,
        'If students struggle: Increase use of visual models (bar models, number lines)',
        'For advanced learners: Introduce algebraic word problems and multi-step equations',
        'Error pattern noticed: If sign errors are common, dedicate 5 extra minutes to transposition rules',
        'Engagement strategy: Use competitive math games like "Equation Race" in pairs',
        'Assessment insight: Create exit ticket with one equation to solve - use results to plan next lesson',
      ];
    } else if (
      topic.toLowerCase().includes('fraction') ||
      topic.toLowerCase().includes('rational')
    ) {
      topicExplanation = `Fractions represent parts of a whole and are fundamental to understanding rational numbers, ratios, and proportions. For ${classLevel} students, developing fraction sense through visual models and real-life contexts is crucial before procedural fluency.`;

      keyDefinitions = [
        {
          term: 'Numerator',
          definition: 'The top number indicating how many parts we have',
        },
        {
          term: 'Denominator',
          definition: 'The bottom number indicating total equal parts',
        },
        {
          term: 'Equivalent Fractions',
          definition:
            'Fractions that represent the same value (e.g., 1/2 = 2/4 = 3/6)',
        },
        {
          term: 'Simplest Form',
          definition:
            'A fraction where numerator and denominator have no common factors except 1',
        },
      ];

      formulas = [
        {
          name: 'Addition (Same Denominator)',
          formula: 'a/c + b/c = (a+b)/c',
          description: 'Add numerators, keep denominator',
        },
        {
          name: 'Multiplication',
          formula: '(a/b) × (c/d) = (a×c)/(b×d)',
          description: 'Multiply numerators and denominators',
        },
        {
          name: 'Finding LCM',
          formula: 'For a/b + c/d, find LCM of b and d',
          description: 'Required for adding unlike fractions',
        },
      ];

      realWorldExamples = [
        '🍕 Pizza Sharing: "Raj ate 2/8 of a pizza, Priya ate 3/8. How much did they eat together?" (Addition)',
        '🧃 Recipe Scaling: "A recipe needs 3/4 cup sugar. You want to make half the recipe. How much sugar?" (Multiplication: 3/4 × 1/2)',
        '📏 Measurement: "A rope is 7/4 meters long. Convert to mixed number." (Understanding improper fractions)',
        '💰 Money Division: "Share ₹150 equally among 4 friends. How much each?" (Division creating fractions)',
      ];

      instructionalSteps = [
        {
          title: 'Visual Fraction Understanding',
          duration: '10 mins',
          content: [
            'Use fraction circles/bars to show parts of a whole',
            'Demonstrate equivalent fractions visually: fold paper to show 1/2 = 2/4 = 4/8',
            'Connect to daily life: half glass of water, quarter of an hour',
            'Interactive activity: Students shade fraction grids',
          ],
        },
        {
          title: 'Operations with Fractions',
          duration: '18 mins',
          content: [
            'Addition with same denominators: 2/7 + 3/7 = 5/7 (only add tops)',
            'Addition with different denominators: find LCM, convert, add',
            'Multiplication: demonstrate with area model',
            'Step-by-step examples with student participation',
          ],
        },
        {
          title: 'Real-World Problem Solving',
          duration: '12 mins',
          content: [
            'Work through pizza/cake sharing scenarios',
            'Measurement problems with fractions',
            'Students create their own fraction word problems',
            'Peer-checking and discussion',
          ],
        },
      ];

      pedagogyAdjustments = [
        'Use physical manipulatives extensively for concrete understanding',
        'If struggling: Spend more time on visual models before algorithms',
        'Connect fractions to decimals and percentages for deeper understanding',
        'Common error: Adding denominators - reinforce "parts of same-sized wholes"',
      ];
    } else if (
      topic.toLowerCase().includes('circle') ||
      topic.toLowerCase().includes('circumference') ||
      topic.toLowerCase().includes('area')
    ) {
      topicExplanation = `Understanding circles involves grasping the relationship between radius, diameter, circumference, and area. The constant π (pi) is fundamental to all circle calculations. For ${classLevel} students, use hands-on measurement activities before introducing formulas to build geometric intuition.`;

      keyDefinitions = [
        { term: 'Radius', definition: 'Distance from center to any point on the circle' },
        {
          term: 'Diameter',
          definition: 'Distance across the circle through its center (2 × radius)',
        },
        {
          term: 'Circumference',
          definition: 'The perimeter or distance around the circle',
        },
        { term: 'Pi (π)', definition: 'Mathematical constant ≈ 3.14 or 22/7' },
        {
          term: 'Area',
          definition: 'The space enclosed within the circle',
        },
      ];

      formulas = [
        {
          name: 'Circumference',
          formula: 'C = 2πr or C = πd',
          description: 'Where r is radius and d is diameter',
        },
        {
          name: 'Area',
          formula: 'A = πr²',
          description: 'Where r is the radius (squared)',
        },
        {
          name: 'Relationship',
          formula: 'd = 2r',
          description: 'Diameter is twice the radius',
        },
      ];

      realWorldExamples = [
        '🎡 Ferris Wheel: "A wheel has radius 7m. How much distance does a point on its edge travel in one complete rotation?" (Circumference)',
        '🍕 Pizza Size: "Which is bigger value: one 14-inch pizza or two 7-inch pizzas?" (Area comparison)',
        '🏃 Running Track: "If the circular track has diameter 140m, how many laps to run 1km?" (Circumference application)',
        '🎯 Dartboard: "What\'s the area of the bullseye if its radius is 2 cm?" (Area calculation)',
      ];

      instructionalSteps = [
        {
          title: 'Exploring Circles Through Measurement',
          duration: '10 mins',
          content: [
            'Hands-on: Students measure circular objects (coins, lids, plates) - diameter and circumference',
            'Calculate ratio: circumference ÷ diameter for each object',
            'Discovery: The ratio is always around 3.14 - introduce this as π (pi)',
            'Historical note: Ancient mathematicians discovered this constant thousands of years ago',
          ],
        },
        {
          title: 'Deriving and Understanding Formulas',
          duration: '12 mins',
          content: [
            'Since C/d = π, therefore C = πd or C = 2πr (substitute d = 2r)',
            'Draw circles with different radii, calculate circumference for each',
            'For area: Show grid method or paper-cutting activity to visualize πr²',
            'Emphasize: Squaring the radius means radius × radius, not radius × 2',
          ],
        },
        {
          title: 'Problem-Solving Practice',
          duration: '15 mins',
          content: [
            'Example 1: Given radius 7 cm, find circumference and area',
            'Example 2: Given diameter 28 m, find radius, circumference, and area',
            'Example 3: Given circumference 44 cm, find radius (reverse problem)',
            'Word problems from real-world examples list',
            'Students work in pairs, then present solutions',
          ],
        },
        {
          title: 'Applications and Extensions',
          duration: '8 mins',
          content: [
            'Semicircle and quarter circle: How do formulas change?',
            'Circular ring (annulus): Area between two concentric circles',
            'Connect to other topics: Wheels, gears, planetary orbits',
            'Challenge: If area of circle is 154 cm², find radius (working backwards)',
          ],
        },
      ];

      pedagogyAdjustments = [
        'Start with concrete materials: string, compass, circular objects',
        'Common error: Confusing radius and diameter - use visual aids consistently',
        'Use π ≈ 22/7 for simpler calculations, π ≈ 3.14 for decimals',
        'Engagement: Measure actual wheels/circular objects in school',
        'For struggling students: Focus on one formula at a time, master before moving to next',
      ];
    }
  }

  // Science Topics
  if (subject === 'Science') {
    if (
      topic.toLowerCase().includes('photosynthesis') ||
      topic.toLowerCase().includes('plant')
    ) {
      topicExplanation = `Photosynthesis is the biochemical process by which green plants convert light energy into chemical energy stored in glucose. This process is fundamental to all life on Earth as it produces oxygen and serves as the primary energy source for the food chain. For ${classLevel} students, emphasize the inputs, outputs, and significance of this process.`;

      keyDefinitions = [
        {
          term: 'Photosynthesis',
          definition:
            'Process by which plants make their own food using sunlight, water, and carbon dioxide',
        },
        {
          term: 'Chlorophyll',
          definition: 'Green pigment in plant leaves that captures light energy',
        },
        {
          term: 'Stomata',
          definition:
            'Tiny pores on leaf surface for gas exchange (CO₂ in, O₂ out)',
        },
        {
          term: 'Glucose',
          definition:
            'Simple sugar produced during photosynthesis, used for plant energy and growth',
        },
      ];

      formulas = [
        {
          name: 'Photosynthesis Equation',
          formula: '6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ + 6O₂',
          description: 'Carbon dioxide + Water + Light → Glucose + Oxygen',
        },
        {
          name: 'Word Equation',
          formula:
            'Carbon dioxide + Water → Glucose + Oxygen (in presence of sunlight and chlorophyll)',
          description: 'Simplified representation for understanding',
        },
      ];

      realWorldExamples = [
        '🌳 Forests as Oxygen Factories: "Amazon rainforest produces 20% of world\'s oxygen through photosynthesis"',
        '🌾 Agriculture: "Farmers ensure adequate sunlight and water for crops to maximize photosynthesis and yield"',
        '🐠 Aquatic Plants: "Underwater plants in aquariums photosynthesize, providing oxygen for fish"',
        '🔋 Solar Panels Inspiration: "Scientists study photosynthesis to design better solar energy systems (biomimicry)"',
      ];

      instructionalSteps = [
        {
          title: 'Engaging Introduction with Demo',
          duration: '7 mins',
          content: [
            'Show a potted plant: "What do you think this plant eats? Does it have a mouth?"',
            'Reveal: "Plants are food factories - they make their own food!"',
            'Demo: Place green leaf in sunlight vs. dark for comparison discussion',
            'Ask: "Why are leaves green?" (introduce chlorophyll)',
          ],
        },
        {
          title: 'Explaining the Process Step-by-Step',
          duration: '15 mins',
          content: [
            'Draw detailed leaf diagram on board showing: chloroplasts, stomata, veins',
            'Explain Step 1: Roots absorb water (H₂O) from soil → travels through stem to leaves',
            'Explain Step 2: Stomata on leaves take in carbon dioxide (CO₂) from air',
            'Explain Step 3: Chlorophyll in chloroplasts captures sunlight energy',
            'Explain Step 4: Light energy converts CO₂ + H₂O into glucose (C₆H₁₂O₆) + oxygen (O₂)',
            'Show the chemical equation and word equation side-by-side',
            'Emphasize: Oxygen is released as "waste" - this is what we breathe!',
          ],
        },
        {
          title: 'Interactive Activity: Photosynthesis Simulation',
          duration: '12 mins',
          content: [
            'Role-play: Students act as different components (water molecules, CO₂, chlorophyll, sunlight)',
            'Move through the process physically to demonstrate molecular interactions',
            'Alternative: Use photosynthesis animation video/simulation software',
            'Students create labeled diagrams in their notebooks',
          ],
        },
        {
          title: 'Real-World Connections & Importance',
          duration: '8 mins',
          content: [
            'Discuss: "Why is photosynthesis called the most important process on Earth?"',
            'Connection 1: All our food comes from plants (directly or indirectly)',
            'Connection 2: Oxygen we breathe is produced by plants',
            'Connection 3: Plants reduce atmospheric CO₂ (climate change discussion)',
            'Show deforestation impact: less photosynthesis = less oxygen, more CO₂',
          ],
        },
        {
          title: 'Quick Assessment & Clarifications',
          duration: '8 mins',
          content: [
            'Quiz: Fill in the blank equation of photosynthesis',
            'Q&A: Address student questions and misconceptions',
            'Common misconception to clarify: "Plants don\'t eat soil - they make food from air and water!"',
            'Homework: Observe a plant at home, draw and label its parts related to photosynthesis',
          ],
        },
      ];

      pedagogyAdjustments = [
        `For ${classLevel}: Use more visuals and hands-on activities than abstract chemical equations`,
        'If concept is difficult: Use analogies (factory making products, kitchen cooking food)',
        'For advanced students: Introduce light and dark reactions (Hill reaction)',
        'Practical: Conduct starch test experiment with variegated leaves (de-starching, light exposure, iodine test)',
        'Engagement: Show time-lapse video of plants growing/responding to light',
        'Assessment: Ask students to draw and explain photosynthesis in their own words',
      ];
    } else if (
      topic.toLowerCase().includes('cell') ||
      topic.toLowerCase().includes('organism')
    ) {
      topicExplanation = `Cells are the basic structural and functional units of all living organisms. Understanding cell structure and functions is fundamental to biology. For ${classLevel} students, use microscope observations and models to make the invisible world of cells tangible and fascinating.`;

      keyDefinitions = [
        {
          term: 'Cell',
          definition: 'The smallest unit of life that can function independently',
        },
        {
          term: 'Cell Membrane',
          definition: 'Outer boundary that controls what enters and exits the cell',
        },
        {
          term: 'Nucleus',
          definition: 'Control center containing genetic material (DNA)',
        },
        {
          term: 'Cytoplasm',
          definition: 'Jelly-like substance filling the cell where organelles float',
        },
      ];

      realWorldExamples = [
        '🏭 Cell as Factory: "Nucleus is the manager, mitochondria are power plants, cell membrane is security"',
        '🍞 Yeast Cells: "Used in bread-making and fermentation - single-celled organisms"',
        '🩸 Blood Cells: "Red blood cells carry oxygen, white blood cells fight infection"',
        '🌱 Plant vs. Animal Cells: "Plant cells have cell walls and chloroplasts, animal cells don\'t"',
      ];

      instructionalSteps = [
        {
          title: 'Discovery Through Microscopy',
          duration: '12 mins',
          content: [
            'If available: Students observe onion peel or cheek cells under microscope',
            'Alternative: Show high-quality images/videos of cells',
            'Guide observation: "What shapes do you see? What structures are visible?"',
            'Historical context: Robert Hooke discovered cells in 1665 looking at cork',
          ],
        },
        {
          title: 'Cell Structure and Functions',
          duration: '15 mins',
          content: [
            'Draw and label plant and animal cell diagrams side by side',
            'Explain each organelle with analogy: nucleus (brain), mitochondria (power station), etc.',
            'Highlight differences: cell wall, chloroplasts in plant cells only',
            'Use color coding for better memory retention',
          ],
        },
        {
          title: 'Hands-On Model Building',
          duration: '13 mins',
          content: [
            'Students create 3D cell models using clay, cardboard, or household items',
            'Each organelle should be correctly placed and labeled',
            'Peer teaching: Students explain their models to partners',
            'Display models in class',
          ],
        },
      ];

      pedagogyAdjustments = [
        'Use  factory or city analogies to relate cell parts to familiar concepts',
        'Create comparison charts for plant vs. animal cells',
        'Show videos of cells in action (movement, division)',
        'For struggling learners: Focus on 3-4 main organelles first',
      ];
    }
  }

  // English Topics
  if (subject === 'English') {
    if (topic.toLowerCase().includes('tense') || topic.toLowerCase().includes('verb')) {
      topicExplanation = `Verb tenses allow us to express when actions occur - past, present, or future. Understanding tenses is crucial for clear communication and effective writing. For ${classLevel} students, focus on practical usage through storytelling and daily life examples before diving into grammatical terminology.`;

      keyDefinitions = [
        {
          term: 'Present Tense',
          definition: 'Actions happening now or habitual actions (I eat, I am eating)',
        },
        {
          term: 'Past Tense',
          definition: 'Actions that have already happened (I ate, I was eating)',
        },
        {
          term: 'Future Tense',
          definition: 'Actions that will happen later (I will eat, I will be eating)',
        },
        {
          term: 'Auxiliary Verb',
          definition:
            'Helping verbs like is, am, are, was, were, will used to form tenses',
        },
      ];

      realWorldExamples = [
        '📱 Social Media: "I am posting a photo" (present continuous) vs "I posted a photo" (past)',
        '📅 Scheduling: "I will meet you tomorrow" (future) vs "I meet you every Monday" (present habitual)',
        '📖 Storytelling: Switching between "Once upon a time..." (past) and present for dramatic effect',
        '🎮 Gaming: "I am playing" (ongoing) vs "I play every day" (habit) vs "I played yesterday" (completed)',
      ];

      instructionalSteps = [
        {
          title: 'Tense Introduction Through Story',
          duration: '8 mins',
          content: [
            'Tell a story mixing tenses: "Yesterday, I went to the market. Now, I am in class. Tomorrow, I will visit my friend."',
            'Ask students to identify: which happened? which is happening? which will happen?',
            'Introduce the concept: "Tenses tell us WHEN things happen"',
            'Create a timeline on the board: PAST ← NOW → FUTURE',
          ],
        },
        {
          title: 'Teaching Each Tense with Examples',
          duration: '18 mins',
          content: [
            'Present Simple: "I eat breakfast" (habit) - give 5 examples, students repeat',
            'Present Continuous: "I am eating breakfast" (now) - show the difference',
            'Past Simple: "I ate breakfast" - how to form: add -ed or irregular forms',
            'Future Simple: "I will eat breakfast" - using "will"',
            'Practice: Convert sentences across tenses as a class',
            'Highlight signal words: now, yesterday, tomorrow, every day, always',
          ],
        },
        {
          title: 'Interactive Practice Activities',
          duration: '12 mins',
          content: [
            'Activity 1: Students write 3 sentences about their day (past, present, future)',
            'Activity 2: Tense sorting game - categorize given sentences into P/Pr/F',
            'Activity 3: Error correction - identify and fix tense mistakes in paragraphs',
            'Peer sharing and feedback',
          ],
        },
      ];

      pedagogyAdjustments = [
        'Use visual timeline consistently to reinforce time concepts',
        'If struggling: Focus on one tense at a time over multiple lessons',
        'Incorporate movement: students move left (past), center (present), right (future) when teacher says a sentence',
        'For better retention: Connect tenses to students\' personal experiences',
      ];
    } else if (
      topic.toLowerCase().includes('comprehension') ||
      topic.toLowerCase().includes('reading')
    ) {
      topicExplanation = `Reading comprehension is the ability to understand, analyze, and interpret written text. For ${classLevel} students, developing strategies like predicting, questioning, and summarizing helps transform passive reading into active meaning-making.`;

      keyDefinitions = [
        {
          term: 'Main Idea',
          definition: 'The central point or most important concept in a passage',
        },
        {
          term: 'Supporting Details',
          definition: 'Facts, examples, or descriptions that explain the main idea',
        },
        {
          term: 'Inference',
          definition: 'Conclusions drawn from evidence and reasoning, not directly stated',
        },
        {
          term: 'Context Clues',
          definition: 'Hints in surrounding text that help understand unfamiliar words',
        },
      ];

      realWorldExamples = [
        '📰 News Articles: Finding main idea in headlines and lead paragraphs',
        '📧 Email Reading: Understanding tone, purpose, and action items',
        '📖 Story Books: Making predictions about what will happen next',
        '📋 Instructions: Following recipes or assembly directions requires comprehension',
      ];

      instructionalSteps = [
        {
          title: 'Pre-Reading Strategies',
          duration: '7 mins',
          content: [
            'Preview the text: title, headings, images - what do you predict?',
            'Activate prior knowledge: "What do you already know about this topic?"',
            'Set a purpose: "Why are we reading this? What should we learn?"',
            'Vocabulary pre-teaching: Introduce 3-4 key words',
          ],
        },
        {
          title: 'Active Reading Techniques',
          duration: '15 mins',
          content: [
            'Model think-aloud: Teacher reads passage, verbalizes thought process',
            'Pause at key points to ask: "What just happened? Why did character do that?"',
            'Annotation: Underline main ideas, circle unknown words, note questions in margins',
            'Chunking: Break text into manageable sections',
            'Students practice with a short paragraph',
          ],
        },
        {
          title: 'Post-Reading Analysis',
          duration: '13 mins',
          content: [
            'Identify main idea: "What is this passage mostly about? (one sentence)"',
            'Find supporting details: "What evidence supports the main idea?"',
            'Make inferences: "What can we conclude that isn\'t directly stated?"',
            'Summarize: "Retell in your own words (beginning, middle, end)"',
            'Group discussion: Compare interpretations',
          ],
        },
        {
          title: 'Comprehension Question Practice',
          duration: '10 mins',
          content: [
            'Different question types: literal (stated), inferential (implied), evaluative (opinion)',
            'Teach strategy: Go back to text to find evidence for answers',
            'Model how to eliminate wrong choices in multiple-choice',
            'Students answer questions independently, then discuss',
          ],
        },
      ];

      pedagogyAdjustments = [
        'Use high-interest texts relevant to students\' lives',
        'Graphic organizers: Story maps, Venn diagrams, KWL charts',
        'For struggling readers: Provide audio support or read-aloud',
        'Build vocabulary through word walls and context clue practice',
        'Gradual release: I do, We do, You do together, You do alone',
      ];
    }
  }

  // Social Science Topics
  if (subject === 'Social Science' || subject === 'Social Studies') {
    if (
      topic.toLowerCase().includes('democracy') ||
      topic.toLowerCase().includes('government')
    ) {
      topicExplanation = `Democracy is a system of government where power rests with the people, who exercise it directly or through elected representatives. For ${classLevel} students, connect democratic principles to school governance, class elections, and current events to make abstract concepts concrete.`;

      keyDefinitions = [
        {
          term: 'Democracy',
          definition:
            'Government by the people, where citizens have the power to make decisions',
        },
        {
          term: 'Republic',
          definition:
            'A form of democracy where people elect representatives to govern',
        },
        {
          term: 'Constitution',
          definition: 'Written set of fundamental rules and principles for governance',
        },
        {
          term: 'Universal Adult Franchise',
          definition: 'Right of all adult citizens to vote, regardless of background',
        },
      ];

      realWorldExamples = [
        '🗳️ School Elections: "Class monitor elections demonstrate democratic voting"',
        '🏛️ Indian Parliament: "Lok Sabha (House of People) and Rajya Sabha (Council of States)"',
        '📜 Student Council: "Representatives voice student concerns to school administration"',
        '⚖️ Court System: "Judiciary ensures laws are fair and protect rights"',
      ];

      instructionalSteps = [
        {
          title: 'Understanding Democracy Through Experience',
          duration: '10 mins',
          content: [
            'Simulation: Class votes on a decision (e.g., homework deadline, activity choice)',
            'Discuss: "How did we make this decision? Was everyone\'s vote equal?"',
            'Definition: "In democracy, people have the power to make choices"',
            'Contrast with other systems: "What if only the tallest student decided? (not democratic)"',
          ],
        },
        {
          title: 'Key Features of Democracy',
          duration: '14 mins',
          content: [
            'Feature 1: Elections - people choose their leaders',
            'Feature 2: Rights - freedom of speech, expression, equality',
            'Feature 3: Rule of Law - everyone follows the same laws',
            'Feature 4: Independent Judiciary - courts protect rights',
            'Feature 5: Accountability - leaders answer to the people',
            'Show examples from India: voting process, fundamental rights',
          ],
        },
        {
          title: 'Indian Democratic System',
          duration: '12 mins',
          content: [
            'Three levels: Central (Union), State, Local (Panchayat/Municipal)',
            'Three branches: Legislature (makes laws), Executive (implements), Judiciary (interprets)',
            'Elections: Who can vote? How often? Role of Election Commission',
            'Case study: Trace how a law is made - from proposal to enactment',
          ],
        },
        {
          title: 'Rights and Responsibilities',
          duration: '9 mins',
          content: [
            'Fundamental Rights: Right to equality, freedom, education, etc.',
            'Fundamental Duties: Respecting flag, protecting environment, etc.',
            'Activity: Students create posters on "My Rights, My Responsibilities"',
            'Discussion: Why are both important?',
          ],
        },
      ];

      pedagogyAdjustments = [
        'Use current news events to illustrate democratic processes',
        'Role-play: Mock parliament session or court hearing',
        'Create connections between school democracy (class rules) and national democracy',
        'Visual aids: Charts of government structure, election process flowcharts',
        'Invite guest speaker: Local elected representative or election official',
      ];
    }
  }

  // Default fallback for any topic not specifically covered
  if (instructionalSteps.length === 0) {
    topicExplanation = `${topic} is a fundamental concept in ${subject} for ${classLevel} students. This topic builds upon previously learned concepts and prepares students for more advanced learning. The teaching approach should be student-centered, using concrete examples and scaffolded instruction.`;

    keyDefinitions = [
      {
        term: 'Core Concept',
        definition: `The fundamental understanding required for ${topic}`,
      },
      {
        term: 'Application',
        definition: 'How this concept is used in practical situations',
      },
    ];

    formulas = [
      {
        name: 'Key Formula/Principle',
        formula: 'Based on topic requirements',
        description: 'To be demonstrated with examples',
      },
    ];

    realWorldExamples = [
      `Practical application of ${topic} in daily life`,
      `Professional context where ${topic} is used`,
      `Historical or current events related to ${topic}`,
    ];

    instructionalSteps = [
      {
        title: `Introduction to ${topic}`,
        duration: '10 mins',
        content: [
          `Begin with a relatable question or scenario related to ${topic}`,
          'Assess prior knowledge through targeted questions',
          'Present the learning objectives clearly',
          'Show relevance to students\' lives',
        ],
      },
      {
        title: `Core Instruction on ${topic}`,
        duration: '15 mins',
        content: [
          'Break down the concept into digestible parts',
          'Use multiple representations (visual, verbal, symbolic)',
          'Provide step-by-step demonstrations',
          'Check for understanding at each step',
        ],
      },
      {
        title: `Guided Practice`,
        duration: '12 mins',
        content: [
          'Work through examples together',
          'Gradually release responsibility to students',
          'Circulate and provide individual support',
          'Address common misconceptions immediately',
        ],
      },
      {
        title: `Independent Application`,
        duration: '8 mins',
        content: [
          'Students work on problems independently',
          'Provide differentiated tasks for varied levels',
          'Monitor progress and offer hints as needed',
          'Select students to share solutions',
        ],
      },
      {
        title: `Review and Extension`,
        duration: '5 mins',
        content: [
          'Summarize key learning points',
          'Quick formative assessment',
          'Preview connections to upcoming topics',
          'Assign relevant homework or practice',
        ],
      },
    ];

    pedagogyAdjustments = [
      `Adjust pace based on ${classLevel} student responses and engagement`,
      'Use formative assessment throughout to guide instruction',
      'Provide additional support for struggling learners',
      'Offer extensions for advanced students',
      'Incorporate collaborative learning opportunities',
    ];
  }

  return {
    topicExplanation,
    keyDefinitions,
    formulas,
    realWorldExamples,
    instructionalSteps,
    pedagogyAdjustments,
  };
};
