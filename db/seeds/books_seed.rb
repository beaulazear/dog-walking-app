# Books Seed Data - Dog Training & Behavior Library
# All books are created as default books (user_id: nil, is_default: true)

puts 'Seeding default books...'

books_data = [
  # CATEGORY 1: CPDT-KA CERTIFICATION ESSENTIALS
  {
    title: 'The Culture Clash (2nd Edition)',
    author: 'Jean Donaldson',
    publisher: 'James & Kenneth Publishers',
    year: 2005,
    pages: 224,
    isbn: '978-1888047059',
    price_range: '$15-20',
    format: 'Paperback, Kindle',
    category: 'CPDT-KA Certification Essentials',
    description: 'The definitive introduction to modern, science-based dog training. Donaldson dismantles outdated dominance theory and explains dog behavior through the lens of learning theory. Required reading for CPDT-KA certification. Covers: operant and classical conditioning, punishment vs. reinforcement, common behavior problems, and how dogs actually learn. Written in an engaging, sometimes humorous style that makes complex concepts accessible. This is THE book that changed dog training from dominance-based to science-based methods.',
    why_you_need_it: 'Foundation for certification exam. Every concept tested on CPDT-KA is rooted in principles from this book.',
    best_for: 'Certification prep, foundational understanding, challenging old myths'
  },
  {
    title: "Don't Shoot the Dog! The New Art of Teaching and Training (Revised Edition)",
    author: 'Karen Pryor',
    publisher: 'Ringpress Books',
    year: 2019,
    pages: 256,
    isbn: '978-1860542985',
    price_range: '$16-22',
    format: 'Paperback, Kindle, Audiobook',
    category: 'CPDT-KA Certification Essentials',
    description: 'The classic book that brought operant conditioning and clicker training to the mainstream. Pryor, a marine mammal trainer, explains the four quadrants of operant conditioning, shaping behavior, and positive reinforcement techniques. Not dog-specific (covers training all species, including humans), which makes the principles even clearer. Practical examples throughout. The revised edition includes updated research and modern applications.',
    why_you_need_it: 'Core learning theory for CPDT-KA. Explains WHY positive reinforcement works better than punishment. Directly tested material.',
    best_for: 'Understanding learning theory, clicker training foundations, behavior shaping'
  },
  {
    title: 'Excel-erated Learning: Explaining in Plain English How Dogs Learn and How Best to Teach Them',
    author: 'Pamela J. Reid, PhD',
    publisher: 'James & Kenneth Publishers',
    year: 1996,
    pages: 167,
    isbn: '978-0966836226',
    price_range: '$18-25',
    format: 'Paperback',
    category: 'CPDT-KA Certification Essentials',
    description: "More technical deep dive into canine learning theory and cognition. Reid has a PhD in psychology and applies rigorous scientific principles to dog training. Covers: classical and operant conditioning in depth, cognitive abilities of dogs, memory and discrimination learning, motivation, and effective communication. Includes charts, diagrams, and research references. Denser read than Culture Clash but essential for understanding the 'why' behind training methods.",
    why_you_need_it: 'CPDT-KA exam tests detailed knowledge of learning theory. This book provides the depth needed to ace those questions.',
    best_for: 'Deep learning theory understanding, certification exam prep, scientific foundations'
  },
  {
    title: 'Behavior Adjustment Training (BAT 2.0): New Practical Techniques for Fear, Frustration, and Aggression in Dogs',
    author: 'Grisha Stewart, MA, CPDT-KA, CBCC-KA',
    publisher: 'Dogwise Publishing',
    year: 2016,
    pages: 330,
    isbn: '978-1617812705',
    price_range: '$25-35',
    format: 'Paperback, Kindle',
    category: 'CPDT-KA Certification Essentials',
    description: 'Comprehensive protocol for working with reactive, fearful, and aggressive dogs. BAT (Behavior Adjustment Training) is a force-free method that uses functional rewards and controlled exposure. Covers: the science of fear and aggression, assessing reactivity, BAT setup and technique, working with different triggers, integration with other training methods. Includes case studies, photos, and detailed protocols. Essential methodology for modern trainers dealing with reactivity (which is common in urban environments).',
    why_you_need_it: 'Major behavior modification protocol likely to appear on certification exams. Critical skill for working with reactive dogs.',
    best_for: 'Reactivity cases, behavior modification, leash reactivity (relevant for pack walks)'
  },
  {
    title: 'How Dogs Learn (Howell Reference Books)',
    author: 'Mary R. Burch, PhD & Jon S. Bailey, PhD',
    publisher: 'Howell Book House',
    year: 1999,
    pages: 208,
    isbn: '978-0876057845',
    price_range: '$15-20',
    format: 'Paperback',
    category: 'CPDT-KA Certification Essentials',
    description: 'Concise, clear explanation of learning principles specifically applied to dogs. Both authors are behavior analysts. Covers: basic principles of behavior, classical and operant conditioning, reinforcement schedules, punishment (and why to avoid it), practical training applications. Written in textbook style but very readable. Good charts and summaries. Excellent quick reference guide.',
    why_you_need_it: 'Supplement to deeper books. Great for quick review before CPDT-KA exam.',
    best_for: 'Quick reference, study guide companion, clear explanations of complex concepts'
  },

  # CATEGORY 2: DOG PSYCHOLOGY & COGNITION
  {
    title: 'Inside of a Dog: What Dogs See, Smell, and Know',
    author: 'Alexandra Horowitz, PhD',
    publisher: 'Scribner',
    year: 2009,
    pages: 384,
    isbn: '978-1416583431',
    price_range: '$16-20',
    format: 'Paperback, Kindle, Audiobook',
    category: 'Dog Psychology & Cognition',
    description: 'Groundbreaking exploration of dog cognition and perception from a cognitive scientist who runs the Dog Cognition Lab at Barnard College. Covers: how dogs perceive time, their olfactory world (smell chapter is mind-blowing), theory of mind in dogs, play behavior, attention and awareness. Written for general audience but based on rigorous research. Challenges assumptions about what dogs understand and experience. Changes how you see dogs forever.',
    why_you_need_it: "Entry point into dog psychology. Perfectly bridges science and practical understanding. You'll reference concepts from this book constantly.",
    best_for: "Understanding the dog's subjective experience, cognitive science perspective, mind-expanding read"
  },
  {
    title: 'The Emotional Lives of Animals: A Leading Scientist Explores Animal Joy, Sorrow, and Empathy',
    author: 'Marc Bekoff, PhD',
    publisher: 'New World Library',
    year: 2007,
    pages: 216,
    isbn: '978-1577315872',
    price_range: '$14-18',
    format: 'Paperback, Kindle',
    category: 'Dog Psychology & Cognition',
    description: "Pioneering ethologist's case for animal sentience and emotional complexity. Not dog-specific but includes many dog examples. Covers: joy, grief, empathy, fairness, compassion in animals; scientific evidence for emotions; ethical implications; why emotions evolved. Bekoff combines field research with philosophical inquiry. Accessible writing, compelling stories, solid science. Challenges the idea that animals are 'just instinct.'",
    why_you_need_it: 'Foundational for understanding dog psychology. Legitimizes treating dogs as emotional beings, not just behavior machines.',
    best_for: 'Understanding animal emotions, ethical framework for training, psychology perspective'
  },
  {
    title: 'How Dogs Love Us: A Neuroscientist and His Adopted Dog Decode the Canine Brain',
    author: 'Gregory Berns, PhD, MD',
    publisher: 'New Harvest',
    year: 2013,
    pages: 272,
    isbn: '978-0544114678',
    price_range: '$16-22',
    format: 'Paperback, Kindle, Audiobook',
    category: 'Dog Psychology & Cognition',
    description: "Neuroscientist's groundbreaking fMRI studies of conscious dogs' brains. Berns trained dogs to sit still in MRI scanners (awake, unrestrained) to study their brain activity. Results show dogs have brain regions associated with positive emotions that activate when they see their owners - evidence that dogs truly love us. Covers: the research process, what dog brains reveal about emotions, implications for understanding consciousness. Part memoir, part science.",
    why_you_need_it: "Hard science proving dogs have emotional lives. Perfect for psychology focus. Changes the conversation from 'do dogs feel?' to 'what do dogs feel?'",
    best_for: 'Neuroscience of emotion, evidence-based psychology, understanding the bond'
  },
  {
    title: 'Dog Is Love: Why and How Your Dog Loves You',
    author: 'Clive D.L. Wynne, PhD',
    publisher: 'Mariner Books',
    year: 2019,
    pages: 272,
    isbn: '978-1328543844',
    price_range: '$16-20',
    format: 'Paperback, Kindle, Audiobook',
    category: 'Dog Psychology & Cognition',
    description: "Behavioral scientist's research-based exploration of what makes dogs unique: their capacity for interspecies love. Wynne argues dogs' superpower isn't intelligence but 'hypersociability' - extreme friendliness toward humans. Covers: genetics of domestication, oxytocin and bonding, cross-cultural studies of dogs, what dogs need from us. Challenges anthropomorphization while affirming the genuine bond.",
    why_you_need_it: 'Explains WHY the human-dog relationship is so powerful. Great counterbalance to purely cognitive approaches.',
    best_for: 'Understanding the bond, what makes dogs special, relationship psychology'
  },
  {
    title: 'Being a Dog: Following the Dog Into a World of Smell',
    author: 'Alexandra Horowitz, PhD',
    publisher: 'Scribner',
    year: 2016,
    pages: 352,
    isbn: '978-1476795997',
    price_range: '$17-22',
    format: 'Paperback, Kindle, Audiobook',
    category: 'Dog Psychology & Cognition',
    description: "Deep dive into dogs' primary sense: smell. Horowitz explores the olfactory world dogs inhabit, which is completely foreign to us. Covers: anatomy of dog noses, what information dogs get from scent, scent detection abilities, how smell shapes behavior and experience. Includes experiments Horowitz conducted and visits to scent researchers. Mind-expanding for understanding how different dogs' perception is from ours.",
    why_you_need_it: 'Understanding sensory experience is key to understanding behavior. Dogs live in a smell-based world we can barely imagine.',
    best_for: "Understanding perception, enrichment ideas, seeing from dog's perspective"
  },
  {
    title: 'Clinical Behavioral Medicine for Small Animals',
    author: 'Karen L. Overall, MA, VMD, PhD, DACVB, CAAB',
    publisher: 'Mosby',
    year: 1997,
    pages: 544,
    isbn: '978-0801679988',
    price_range: '$80-150',
    format: 'Hardcover',
    category: 'Dog Psychology & Cognition',
    description: "THE veterinary behaviorist's bible. Comprehensive clinical reference on behavioral disorders in dogs and cats. Covers: neurochemistry of behavior, anxiety disorders, aggression, compulsive disorders, cognitive dysfunction, psychopharmacology, detailed treatment protocols. Very technical, intended for veterinary professionals. Includes diagnostic criteria, behavior modification protocols, medication guidelines. Dense but invaluable for serious study.",
    why_you_need_it: "This IS 'dog psychiatry.' Clinical, medical approach to behavior problems. No other book goes this deep on behavioral pathology.",
    best_for: 'Clinical understanding of behavior disorders, serious reference, dog psychiatry niche'
  },
  {
    title: 'Canine Behavior: Insights and Answers (2nd Edition)',
    author: 'Bonnie V. Beaver, DVM, MS, DACVB',
    publisher: 'Saunders',
    year: 2009,
    pages: 358,
    isbn: '978-1416056874',
    price_range: '$70-120',
    format: 'Hardcover',
    category: 'Dog Psychology & Cognition',
    description: "Comprehensive veterinary behavior textbook. Covers: normal behavior patterns, behavioral development, communication, social behavior, breed-specific behaviors, abnormal behaviors, medical causes of behavior problems. More textbook-style than Overall's book. Excellent for understanding the full spectrum from normal to pathological behavior.",
    why_you_need_it: 'Understanding normal behavior is essential for recognizing abnormal. Medical perspective trainers often lack.',
    best_for: 'Reference book, normal vs. abnormal behavior, medical considerations'
  },

  # CATEGORY 3: HUMAN-DOG BOND & RELATIONSHIP PSYCHOLOGY
  {
    title: 'Made for Each Other: The Biology of the Human-Animal Bond',
    author: 'Meg Daley Olmert',
    publisher: 'Da Capo Press',
    year: 2009,
    pages: 352,
    isbn: '978-0306817335',
    price_range: '$16-22',
    format: 'Paperback, Kindle',
    category: 'Human-Dog Bond & Relationship Psychology',
    description: "Perfect for human-dog psychology interest. Explores the biochemistry and evolution of human-animal bonds. Covers: oxytocin's role in bonding (mutual gaze between humans and dogs increases oxytocin in BOTH species), co-evolution of humans and dogs, stress reduction from animal contact, therapeutic applications. Scientific but very readable.",
    why_you_need_it: 'Core text for understanding human-dog relationship psychology. Bridges interest in human behavior and dog behavior.',
    best_for: 'Relationship psychology, understanding the bond at chemical level'
  },
  {
    title: 'The Forever Dog: Surprising New Science to Help Your Canine Companion Live Younger, Healthier, and Longer',
    author: 'Rodney Habib & Dr. Karen Shaw Becker, DVM',
    publisher: 'Harper Wave',
    year: 2021,
    pages: 448,
    isbn: '978-0063038226',
    price_range: '$18-28',
    format: 'Hardcover, Kindle, Audiobook',
    category: 'Human-Dog Bond & Relationship Psychology',
    description: 'Holistic approach to canine longevity and wellness. Covers: nutrition, environmental factors, mental enrichment, emotional health, epigenetics, preventive care. Modern, science-based but considers the whole dog - physical, mental, emotional. Includes research on what makes dogs thrive, not just survive.',
    why_you_need_it: 'Holistic perspective aligns with interest in dog psychology and overall wellbeing. Training is part of wellness, not separate.',
    best_for: 'Whole-dog wellness approach, modern science, lifestyle factors in behavior'
  },
  {
    title: 'In Defense of Dogs: Why Dogs Need Our Understanding',
    author: 'John Bradshaw, PhD',
    publisher: 'Penguin Books',
    year: 2011,
    pages: 352,
    isbn: '978-0143119876',
    price_range: '$15-18',
    format: 'Paperback, Kindle',
    category: 'Human-Dog Bond & Relationship Psychology',
    description: "Anthrozoologist's examination of how we misunderstand dogs through anthropomorphization. Bradshaw argues we need to understand dogs as dogs, not furry humans, but also affirms their emotional lives. Covers: evolution and domestication, sensory world, social behavior, human-dog communication, training methods. Balanced, scientific perspective.",
    why_you_need_it: 'Critical thinking about dogs. Helps avoid both pitfalls: over-humanizing and under-appreciating their experience.',
    best_for: 'Balanced perspective, anthrozoology, understanding dogs on their terms'
  },
  {
    title: 'Treating Separation Anxiety in Dogs',
    author: 'Malena DeMartini-Price, CTC',
    publisher: 'Dogwise Publishing',
    year: 2014,
    pages: 176,
    isbn: '978-1617811401',
    price_range: '$20-30',
    format: 'Paperback, Kindle',
    category: 'Human-Dog Bond & Relationship Psychology',
    description: 'Essential post-COVID book. Detailed protocol for treating separation anxiety, which exploded during pandemic. Covers: distinguishing true separation anxiety from other issues, systematic desensitization protocol, when to use medication, case studies, remote training methods. Step-by-step, compassionate approach.',
    why_you_need_it: "COVID changed things - separation anxiety is one of the biggest changes. You'll encounter this constantly.",
    best_for: 'Separation anxiety protocol, pandemic-related behavior issues, anxiety treatment'
  },
  {
    title: 'Fired Up, Frantic, and Freaked Out: Training the Crazy Dog from Over the Top to Under Control',
    author: 'Laura VanArendonk Baugh, CPDT-KA, KPACTP',
    publisher: 'Dogwise Publishing',
    year: 2013,
    pages: 272,
    isbn: '978-1617811128',
    price_range: '$22-30',
    format: 'Paperback, Kindle',
    category: 'Human-Dog Bond & Relationship Psychology',
    description: 'Training for anxious, reactive, and fearful dogs. Covers: neuroscience of arousal and fear, recognizing stress signals, working under threshold, building confidence, specific protocols for different issues. Explains WHY dogs get stuck in reactive patterns and how to help them. Trauma-informed approach.',
    why_you_need_it: 'Excellent for psychology interest - explains the neuroscience behind fear and anxiety. Practical protocols for common urban dog issues.',
    best_for: 'Reactivity, fear, anxiety, understanding arousal and stress, neuroscience of behavior'
  },

  # CATEGORY 4: PACK DYNAMICS & CANINE COMMUNICATION
  {
    title: 'On Talking Terms with Dogs: Calming Signals (2nd Edition)',
    author: 'Turid Rugaas',
    publisher: 'Dogwise Publishing',
    year: 2006,
    pages: 80,
    isbn: '978-1929242360',
    price_range: '$12-18',
    format: 'Paperback',
    category: 'Pack Dynamics & Canine Communication',
    description: 'Essential for pack walk management. Short, photo-rich guide to canine calming signals - the subtle body language dogs use to communicate stress, discomfort, and peaceful intent. Covers: yawning, lip licking, turning away, sniffing ground, play bows, etc. Each signal explained with photos and context. Quick read but invaluable reference.',
    why_you_need_it: 'Essential for daily pack walks. Reading these signals prevents escalation. Will reference constantly.',
    best_for: 'Canine communication, pack walk safety, early intervention, essential reference'
  },
  {
    title: 'Canine Body Language: A Photographic Guide',
    author: 'Brenda Aloff',
    publisher: 'Dogwise Publishing',
    year: 2005,
    pages: 384,
    isbn: '978-1929242511',
    price_range: '$30-40',
    format: 'Large paperback',
    category: 'Pack Dynamics & Canine Communication',
    description: 'Comprehensive visual guide to dog body language. Hundreds of photos with detailed annotations explaining every nuance of posture, facial expression, ear position, tail carriage, etc. Covers: stress signals, play signals, aggression warning signs, calming behaviors, social interaction. Large format book designed for study.',
    why_you_need_it: "Critical for pack walk safety and management. Most detailed body language resource available. Reference guide you'll use forever.",
    best_for: 'Reading subtle signals, pack dynamics, preventing problems, photo reference'
  },
  {
    title: 'Social, Civil, & Savvy: Training & Socializing Puppies to Become the Best Possible Dogs',
    author: 'Laura VanArendonk Baugh, CPDT-KA, KPACTP',
    publisher: 'Dogwise Publishing',
    year: 2018,
    pages: 256,
    isbn: '978-1617812163',
    price_range: '$20-28',
    format: 'Paperback, Kindle',
    category: 'Pack Dynamics & Canine Communication',
    description: 'Modern, science-based approach to puppy socialization and development. Covers: critical periods, proper socialization (not just exposure), building confidence, preventing future behavior problems, group dynamics, social learning. Explains how early experiences shape adult behavior.',
    why_you_need_it: 'Understanding socialization helps assess which dogs can handle pack walks and which need different approaches. Prevention focus.',
    best_for: 'Puppy development, socialization protocols, preventing behavior problems, group dynamics'
  },
  {
    title: 'Successful Dog Adoption',
    author: 'Sue Sternberg',
    publisher: 'Howell Book House',
    year: 2003,
    pages: 340,
    isbn: '978-0764526527',
    price_range: '$20-30',
    format: 'Paperback',
    category: 'Pack Dynamics & Canine Communication',
    description: "Shelter behavior assessment protocols including dog-dog interaction testing. Sternberg's temperament tests are used in shelters nationwide. Covers: assessing arousal levels, predicting aggression, dog-dog compatibility, stress in shelter dogs. While focused on adoption, the assessment techniques apply to evaluating dogs for pack walks.",
    why_you_need_it: 'Assessment protocols for evaluating which dogs can safely walk together. Reading arousal in multi-dog settings.',
    best_for: 'Dog-dog compatibility assessment, arousal evaluation, pack composition decisions'
  },

  # CATEGORY 5: URBAN & SPECIALIZED TRAINING
  {
    title: 'Plenty in Life Is Free: Reflections on Dogs, Training and Finding Grace',
    author: 'Kathy Sdao, MA, CAAB, ACAAB',
    publisher: 'Dogwise Publishing',
    year: 2012,
    pages: 192,
    isbn: '978-1617810398',
    price_range: '$18-25',
    format: 'Paperback, Kindle',
    category: 'Urban & Specialized Training',
    description: "Modern take on impulse control and relationship-based training. Challenges the old 'Nothing in Life is Free' (NILIF) protocol. Argues for building cooperation through positive reinforcement rather than controlling resources. Covers: impulse control exercises, choice and agency for dogs, modern manners training, urban living skills.",
    why_you_need_it: 'Urban dog manners without dominance theory. Practical for city dogs who need impulse control but benefit from choice.',
    best_for: 'Urban environment challenges, modern manners training, impulse control, city living'
  },
  {
    title: 'Control Unleashed: Creating a Focused and Confident Dog',
    author: 'Leslie McDevitt, MLA, CDBC, CPDT-KA',
    publisher: 'Clean Run Productions',
    year: 2007,
    pages: 228,
    isbn: '978-1892694201',
    price_range: '$25-35',
    format: 'Paperback',
    category: 'Urban & Specialized Training',
    description: 'Originally developed for dog sports but perfect for reactive city dogs. Focus and impulse control games for dogs in high-distraction environments. Covers: building attention, working around triggers, relaxation protocols, pattern games, Look at That (LAT) game. Step-by-step exercises with troubleshooting.',
    why_you_need_it: 'Perfect for urban pack walks - high distraction environment, need focus and calm around triggers. Games are fun and effective.',
    best_for: 'Urban reactivity, high-distraction training, focus work, pack walk management'
  },
  {
    title: 'Control Unleashed: Reactive to Relaxed',
    author: 'Leslie McDevitt, MLA, CDBC, CPDT-KA',
    publisher: 'Clean Run Productions',
    year: 2019,
    pages: 320,
    isbn: '978-1892694669',
    price_range: '$30-40',
    format: 'Paperback',
    category: 'Urban & Specialized Training',
    description: 'Specifically focused on reactive dogs (whereas original Control Unleashed was for sports dogs). Detailed protocols for helping reactive dogs relax and focus. Covers: pattern games, emergency U-turns, mat work, Look at That for reactivity, systematic desensitization, counterconditioning.',
    why_you_need_it: 'Urban environments = lots of reactivity. Essential toolkit for helping reactive dogs in pack walks or solo training.',
    best_for: 'Leash reactivity, urban triggers, helping dogs stay under threshold'
  },

  # CATEGORY 6: ENRICHMENT & WELLNESS
  {
    title: "Canine Enrichment for the Real World: Making It a Part of Your Dog's Daily Life",
    author: 'Allie Bender & Emily Strong',
    publisher: 'Dogwise Publishing',
    year: 2019,
    pages: 192,
    isbn: '978-1617812620',
    price_range: '$22-30',
    format: 'Paperback, Kindle',
    category: 'Enrichment & Wellness',
    description: "Holistic approach to enrichment across all areas of life: physical, cognitive, social, sensory. Moves beyond 'puzzle toys' to comprehensive lifestyle enrichment. Covers: assessing individual dog's needs, creating enrichment plans, enrichment for behavior modification, environmental design. Explains why enrichment isn't optional - it's fundamental to emotional health.",
    why_you_need_it: 'Whole dog approach needs enrichment foundation. Training is part of enrichment, not separate from it.',
    best_for: 'Holistic wellness, enrichment protocols, understanding dog needs beyond training'
  },
  {
    title: 'The Science of Making Your Dog Happy',
    author: 'Zazie Todd, PhD',
    publisher: 'Greystone Books',
    year: 2023,
    pages: 272,
    isbn: '978-1771647915',
    price_range: '$18-26',
    format: 'Hardcover, Kindle, Audiobook',
    category: 'Enrichment & Wellness',
    description: "Evidence-based guide to canine welfare and happiness. Todd reviews peer-reviewed research on what actually improves dogs' quality of life. Covers: enrichment, training methods, human-dog relationship, stress, health, end-of-life care. Each chapter summarizes current science with practical applications.",
    why_you_need_it: 'Science-backed approach to wellbeing. Helps make evidence-based decisions about training and care.',
    best_for: 'Evidence-based welfare, modern research, psychology focus, what makes dogs happy'
  },

  # CATEGORY 7: EVOLUTION & DOMESTICATION
  {
    title: 'The Genius of Dogs: How Dogs Are Smarter Than You Think',
    author: 'Brian Hare, PhD & Vanessa Woods',
    publisher: 'Plume',
    year: 2013,
    pages: 400,
    isbn: '978-0142180846',
    price_range: '$16-20',
    format: 'Paperback, Kindle, Audiobook',
    category: 'Evolution & Domestication',
    description: "Research from Duke Canine Cognition Center on dog intelligence and cognition. Covers: evolution of dog cognition, how dogs read human social cues, comparative cognition (dogs vs. wolves vs. apes), what 'smart' means for dogs. Argues dogs aren't smart like wolves - they're smart in unique ways suited to living with humans.",
    why_you_need_it: 'Understanding evolutionary psychology of dogs helps explain modern behavior. Background knowledge that enriches everything else.',
    best_for: 'Cognitive evolution, understanding dog intelligence, comparative behavior'
  },
  {
    title: 'Dog Sense: How the New Science of Dog Behavior Can Make You A Better Friend to Your Pet',
    author: 'John Bradshaw, PhD',
    publisher: 'Basic Books',
    year: 2011,
    pages: 352,
    isbn: '978-0465030675',
    price_range: '$15-19',
    format: 'Paperback, Kindle',
    category: 'Evolution & Domestication',
    description: 'How dogs became dogs - domestication, evolution, and what it means for behavior. Covers: origins of dogs, genetics of behavior, sensory world, why dogs do what they do, debunking dominance/alpha myths. Scientific but very readable.',
    why_you_need_it: 'Understanding evolutionary background explains modern behavior patterns. Solid debunking of alpha theory with evidence.',
    best_for: 'Domestication history, evolutionary perspective, debunking myths with science'
  },

  # CATEGORY 8: AGGRESSION & PROBLEM BEHAVIORS
  {
    title: 'Aggression in Dogs: Practical Management, Prevention & Behaviour Modification',
    author: 'Brenda Aloff',
    publisher: 'Dogwise Publishing',
    year: 2002,
    pages: 486,
    isbn: '978-1929242511',
    price_range: '$35-50',
    format: 'Paperback',
    category: 'Aggression & Problem Behaviors',
    description: "Comprehensive guide to understanding and treating aggression. Covers: types of aggression, assessment protocols, safety management, behavior modification techniques, when to refer out. Very detailed with case studies. Includes body language photos (Aloff's specialty).",
    why_you_need_it: "Eventually you'll encounter aggression. Need to know when you can help and when to refer to specialist.",
    best_for: 'Aggression assessment, understanding different aggression types, safety protocols'
  },
  {
    title: 'Mine! A Practical Guide to Resource Guarding in Dogs',
    author: 'Jean Donaldson',
    publisher: 'Kinship Communications (SF/SPCA)',
    year: 2002,
    pages: 108,
    isbn: '978-0970562944',
    price_range: '$15-20',
    format: 'Paperback',
    category: 'Aggression & Problem Behaviors',
    description: "Donaldson's detailed protocol for treating resource guarding. Covers: understanding the behavior, assessment of severity, step-by-step desensitization protocol, working with different guarded items, prevention. Clear, practical, widely used protocol.",
    why_you_need_it: 'Resource guarding is common. You need a solid protocol for treating it safely.',
    best_for: 'Resource guarding protocol, behavior modification, common problem behavior'
  },

  # CATEGORY 9: PROFESSIONAL DEVELOPMENT
  {
    title: 'The Midnight Dog Walkers: Positive Training and Practical Advice for Living with Reactive and Aggressive Dogs',
    author: 'Annie Phenix, CPDT-KA',
    publisher: 'Dogwise Publishing',
    year: 2016,
    pages: 176,
    isbn: '978-1617812071',
    price_range: '$20-28',
    format: 'Paperback, Kindle',
    category: 'Professional Development',
    description: 'For trainers working with reactive and aggressive dogs. Combines training protocols with emotional support for owners. Covers: living with difficult dogs, management strategies, training protocols, supporting clients through the journey. Compassionate, realistic approach.',
    why_you_need_it: 'Human psychology matters as much as dog psychology. Helps support clients emotionally while training their dogs.',
    best_for: 'Client support, working with difficult cases, human side of training'
  },

  # CATEGORY 10: REFERENCE & QUICK GUIDES
  {
    title: 'The Toolbox for Building a Great Family Dog',
    author: 'Terry Ryan',
    publisher: 'Legacy Canine Behavior & Training, Inc.',
    year: 2013,
    pages: 416,
    isbn: '978-1617811142',
    price_range: '$30-40',
    format: 'Paperback',
    category: 'Reference & Quick Guides',
    description: 'Comprehensive, practical guide to training foundational behaviors. Covers: puppy basics, essential manners, problem prevention, step-by-step training protocols. Ryan is a legendary trainer (trained with the Brelands, pioneers of operant conditioning). Clear instructions with troubleshooting for each behavior.',
    why_you_need_it: "Solid reference for teaching basic behaviors. When a client asks 'how do I teach sit-stay?' you have a proven protocol.",
    best_for: 'Training protocols, basic manners, reference guide, practical how-tos'
  },
  {
    title: 'The Power of Positive Dog Training (2nd Edition)',
    author: 'Pat Miller, CBCC-KA, CPDT-KA',
    publisher: 'Howell Book House',
    year: 2008,
    pages: 352,
    isbn: '978-0470241738',
    price_range: '$18-25',
    format: 'Paperback, Kindle',
    category: 'Reference & Quick Guides',
    description: 'Comprehensive positive reinforcement training guide for all levels. Covers: basic obedience, behavior modification, problem-solving, training plans. Week-by-week training programs included. Miller is well-respected trainer and author. Accessible to beginners but thorough enough for professionals.',
    why_you_need_it: 'Good book to recommend to clients. Solid positive reinforcement approach you can stand behind.',
    best_for: 'Client recommendations, training plans, positive methods overview'
  },
  {
    title: 'Oh Behave! Dogs from Pavlov to Premack to Pinker',
    author: 'Jean Donaldson',
    publisher: 'Dogwise Publishing',
    year: 2008,
    pages: 144,
    isbn: '978-1929242863',
    price_range: '$18-25',
    format: 'Paperback',
    category: 'Reference & Quick Guides',
    description: "Donaldson's collection of essays on learning theory, behavior, and training philosophy. Covers: Premack principle, conditioned emotional responses, classical vs. operant conditioning, cognitive biases in dog training. More conversational than Culture Clash but equally insightful.",
    why_you_need_it: 'Expands on Culture Clash concepts. Good for continued learning after basics are solid.',
    best_for: 'Deepening learning theory knowledge, training philosophy, critical thinking'
  },

  # CATEGORY 11: SPECIALIZED TOPICS
  {
    title: 'Do Over Dogs: Give Your Dog a Second Chance for a First Class Life',
    author: 'Pat Miller, CBCC-KA, CPDT-KA',
    publisher: 'Dogwise Publishing',
    year: 2010,
    pages: 304,
    isbn: '978-1929242894',
    price_range: '$22-30',
    format: 'Paperback, Kindle',
    category: 'Specialized Topics',
    description: 'Specifically for dogs with behavioral baggage - shelter dogs, rescue dogs, dogs with trauma history. Covers: building trust, addressing fear and anxiety, systematic behavior modification, patience and realistic expectations. Compassionate, practical approach. Recognizes these dogs need different approach than puppies raised well.',
    why_you_need_it: 'Many of your clients will have rescue dogs. Understanding trauma-informed training is essential.',
    best_for: 'Rescue dogs, trauma history, building trust, realistic expectations'
  },
  {
    title: "Brenda Aloff's Fundamentals: Foundation Training for Every Dog",
    author: 'Brenda Aloff',
    publisher: 'Dogwise Publishing',
    year: 2011,
    pages: 456,
    isbn: '978-1617810183',
    price_range: '$35-45',
    format: 'Paperback',
    category: 'Specialized Topics',
    description: "Comprehensive foundation training system. Covers: attention and focus, impulse control, spatial awareness, body awareness, handler focus, building drive and motivation. Very detailed with photos. Aloff's systematic approach to building a solid training foundation.",
    why_you_need_it: 'Systematic approach to foundations. Understanding how to build from ground up with any dog.',
    best_for: 'Foundation training, systematic approach, building blocks of training'
  },

  # CATEGORY 12: TRAINING SPECIFIC SKILLS
  {
    title: 'When Pigs Fly!: Training Success with Impossible Dogs',
    author: 'Jane Killion',
    publisher: 'Dogwise Publishing',
    year: 2007,
    pages: 176,
    isbn: '978-1929242511',
    price_range: '$20-28',
    format: 'Paperback',
    category: 'Training Specific Skills',
    description: "Training 'difficult to train' dogs - independent breeds, easily distracted dogs, low-food-motivation dogs. Covers: building drive and motivation, making training fun, dealing with stubbornness (or what looks like stubbornness), creative problem-solving. Fun, encouraging approach that celebrates challenging dogs.",
    why_you_need_it: "Not all dogs are eager Labs. You'll work with hounds, terriers, primitive breeds that don't fit the mold.",
    best_for: 'Difficult breeds, building motivation, creative training approaches'
  },
  {
    title: 'Click to Calm: Healing the Aggressive Dog',
    author: 'Emma Parsons',
    publisher: 'Sunshine Books',
    year: 2004,
    pages: 224,
    isbn: '978-1890948207',
    price_range: '$25-35',
    format: 'Paperback',
    category: 'Training Specific Skills',
    description: "Using clicker training to modify aggressive behavior. Parsons' personal journey with her aggressive dog and the protocols she developed. Covers: clicker basics, working with aggression, systematic desensitization, management, case studies. Pioneering work in applying clicker training to serious behavior problems.",
    why_you_need_it: 'Aggression protocol using positive reinforcement. Proof that force-free methods work even for serious cases.',
    best_for: 'Clicker training for aggression, behavior modification, force-free approaches to serious problems'
  },
  {
    title: 'Reaching the Animal Mind: Clicker Training and What It Teaches Us About All Animals',
    author: 'Karen Pryor',
    publisher: 'Scribner',
    year: 2009,
    pages: 304,
    isbn: '978-0743297776',
    price_range: '$16-22',
    format: 'Paperback, Kindle, Audiobook',
    category: 'Training Specific Skills',
    description: "Pryor's deeper exploration of clicker training across species. Covers: shaping complex behaviors, problem-solving in training, creativity in teaching, applications beyond dogs. Stories from marine mammals, horses, humans, and dogs. Explains the art and science of shaping behavior.",
    why_you_need_it: 'Deepens clicker training skills. Understanding principles at this level makes you better at applying them.',
    best_for: 'Advanced clicker training, shaping complex behaviors, training artistry'
  },

  # CATEGORY 13: CRITICAL THINKING & SCIENCE
  {
    title: 'Canine Confidential: Why Dogs Do What They Do',
    author: 'Marc Bekoff, PhD',
    publisher: 'University of Chicago Press',
    year: 2018,
    pages: 256,
    isbn: '978-0226433240',
    price_range: '$16-20',
    format: 'Paperback, Kindle',
    category: 'Critical Thinking & Science',
    description: "Ethologist's answers to common questions about dog behavior. Covers: why dogs play, what they understand, how they communicate, whether they have morality, personality in dogs. Question-and-answer format makes it accessible. Scientific but not dry.",
    why_you_need_it: 'Understanding natural behavior helps distinguish normal from problematic. Good for explaining dog behavior to clients.',
    best_for: 'Understanding normal behavior, ethology, explaining behavior to clients'
  },
  {
    title: 'Decoding Your Dog: Explaining Common Dog Behaviors and How to Prevent or Change Unwanted Ones',
    author: 'American College of Veterinary Behaviorists',
    publisher: 'Houghton Mifflin Harcourt',
    year: 2014,
    pages: 432,
    isbn: '978-0547738390',
    price_range: '$18-25',
    format: 'Paperback, Kindle',
    category: 'Critical Thinking & Science',
    description: 'Written by board-certified veterinary behaviorists. Covers: normal behavior, common behavior problems, when to seek help, behavior modification basics, medical considerations. Authoritative source from the highest credentialed professionals in field.',
    why_you_need_it: 'Learn from the experts with highest credentials. Understanding their perspective helps know when to refer.',
    best_for: 'Authoritative information, medical perspective, knowing your limits'
  },

  # CATEGORY 14: STRESS & ANXIETY
  {
    title: 'Help for Your Fearful Dog: A Step-by-Step Guide to Helping Your Dog Conquer His Fears',
    author: 'Nicole Wilde',
    publisher: 'Phantom Publishing',
    year: 2006,
    pages: 232,
    isbn: '978-0966772678',
    price_range: '$20-28',
    format: 'Paperback',
    category: 'Stress & Anxiety',
    description: 'Comprehensive guide to working with fearful dogs. Covers: understanding fear, body language, desensitization and counterconditioning protocols, building confidence, specific fears (loud noises, new people, etc.). Practical, compassionate approach. Step-by-step protocols for various fear issues.',
    why_you_need_it: 'Fear is common, especially in city dogs. Need solid protocols for helping fearful dogs.',
    best_for: 'Fear protocols, building confidence, desensitization plans'
  },
  {
    title: 'From Fearful to Fear Free: A Positive Program to Free Your Dog from Anxiety, Fears, and Phobias',
    author: 'Marty Becker, DVM & Mikkel Becker',
    publisher: 'HCI',
    year: 2018,
    pages: 352,
    isbn: '978-0757319655',
    price_range: '$18-26',
    format: 'Paperback, Kindle',
    category: 'Stress & Anxiety',
    description: "Part of Fear Free movement in veterinary care. Covers: recognizing fear and anxiety, reducing stress in all aspects of dog's life, medication when appropriate, creating Fear Free home. Modern, welfare-focused approach.",
    why_you_need_it: 'Fear Free is becoming industry standard. Understanding this approach is increasingly important.',
    best_for: 'Stress reduction, Fear Free methodology, modern welfare approach'
  },
  {
    title: 'Stress in Dogs: Learn How Dogs Show Stress and What You Can Do to Help',
    author: 'Martina Scholz & Clarissa von Reinhardt',
    publisher: 'Dogwise Publishing',
    year: 2007,
    pages: 128,
    isbn: '978-1929242917',
    price_range: '$18-24',
    format: 'Paperback',
    category: 'Stress & Anxiety',
    description: 'Focus on recognizing and reducing stress. Covers: stress signals, causes of stress, health impacts, management strategies, creating calm environments. European perspective (German authors). Photo-illustrated guide to stress signals.',
    why_you_need_it: 'Understanding stress is fundamental to welfare and behavior. Prevention-focused approach.',
    best_for: 'Stress recognition, stress management, welfare focus'
  },

  # CATEGORY 15: PLAY & ENRICHMENT
  {
    title: 'Play Together, Stay Together: Happy and Healthy Play Between People and Dogs',
    author: 'Patricia B. McConnell, PhD & Karen B. London, PhD',
    publisher: 'Black Dog Publishing',
    year: 2008,
    pages: 104,
    isbn: '978-1891767166',
    price_range: '$12-18',
    format: 'Booklet',
    category: 'Play & Enrichment',
    description: 'Short guide to appropriate play between dogs and humans. Covers: types of play, play signals, when play is problematic, teaching good play habits, safety considerations. Quick, practical read. Good for teaching clients about healthy play.',
    why_you_need_it: 'Play is part of enrichment and relationship. Understanding healthy play helps prevent problems.',
    best_for: 'Play behavior, enrichment, teaching clients about play'
  },

  # CATEGORY 16: PUPPIES & DEVELOPMENT
  {
    title: 'Perfect Puppy in 7 Days: How to Start Your Puppy Off Right',
    author: 'Dr. Sophia Yin, DVM, MS',
    publisher: 'CattleDog Publishing',
    year: 2011,
    pages: 192,
    isbn: '978-0964151875',
    price_range: '$20-28',
    format: 'Paperback',
    category: 'Puppies & Development',
    description: "Week-by-week puppy training plan from legendary veterinarian/behaviorist. Covers: first week home, house training, socialization, basic manners, handling exercises. Clear photos, step-by-step protocols. Yin's force-free methods are gold standard.",
    why_you_need_it: 'Solid puppy protocols from one of the best. When clients get puppies, you have a proven plan.',
    best_for: 'Puppy training, socialization, foundation skills, client recommendations'
  },
  {
    title: 'Puppy Start Right: Foundation Training for the Companion Dog',
    author: 'Kenneth Martin, DVM & Debbie Martin, VT, CPDT-KA, CBCC-KA',
    publisher: 'Sunshine Books',
    year: 2011,
    pages: 248,
    isbn: '978-1890948221',
    price_range: '$25-35',
    format: 'Paperback',
    category: 'Puppies & Development',
    description: 'Comprehensive puppy training curriculum designed for puppy classes. Covers: socialization, bite inhibition, body handling, foundation behaviors, problem prevention. Written by veterinary behaviorist and certified trainer couple. Includes class curriculum structure.',
    why_you_need_it: 'If you offer puppy training, this gives you proven curriculum. Comprehensive and force-free.',
    best_for: 'Puppy classes, socialization protocols, puppy curriculum'
  },
  {
    title: 'Before and After Getting Your Puppy: The Positive Approach to Raising a Happy, Healthy, & Well-Behaved Dog',
    author: 'Dr. Ian Dunbar',
    publisher: 'New World Library',
    year: 2004,
    pages: 256,
    isbn: '978-1577314554',
    price_range: '$14-20',
    format: 'Paperback, Kindle',
    category: 'Puppies & Development',
    description: "Dunbar's classic puppy guide (combines two earlier books). Covers: choosing a puppy, first days home, socialization, bite inhibition, house training, basic manners. Pioneered positive puppy training. Easy to read, practical advice.",
    why_you_need_it: 'Classic puppy guide. Good to recommend to clients. Dunbar pioneered modern puppy training.',
    best_for: 'Puppy basics, client recommendations, accessible introduction'
  },

  # CATEGORY 17: RELATIONSHIP & COMMUNICATION
  {
    title: 'The Other End of the Leash: Why We Do What We Do Around Dogs',
    author: 'Patricia B. McConnell, PhD',
    publisher: 'Ballantine Books',
    year: 2002,
    pages: 288,
    isbn: '978-0345446787',
    price_range: '$16-20',
    format: 'Paperback, Kindle, Audiobook',
    category: 'Relationship & Communication',
    description: "Perfect for human-dog psychology interest. Applied animal behaviorist's exploration of communication gaps between humans and dogs. Covers: how our primate nature conflicts with dog nature, why we misunderstand each other, how to communicate better, what dogs understand about us. Fascinating blend of human and dog psychology.",
    why_you_need_it: 'Core text for understanding human side of human-dog relationship. Most training problems are communication problems.',
    best_for: 'Human-dog communication, relationship psychology, unique niche'
  },
  {
    title: 'For the Love of a Dog: Understanding Emotion in You and Your Best Friend',
    author: 'Patricia B. McConnell, PhD',
    publisher: 'Ballantine Books',
    year: 2006,
    pages: 368,
    isbn: '978-0345477354',
    price_range: '$17-22',
    format: 'Paperback, Kindle, Audiobook',
    category: 'Relationship & Communication',
    description: 'Exploration of emotions in both humans and dogs. Covers: facial expressions, emotional contagion between species, fear and joy, anger and happiness, emotional lives of dogs. Scientific but heartfelt. McConnell combines research with personal stories.',
    why_you_need_it: 'Emotion is central to behavior. Understanding emotional lives of dogs AND humans improves training outcomes.',
    best_for: 'Emotional understanding, human-dog bond, psychology focus'
  },
  {
    title: 'How to Behave So Your Dog Behaves (Revised and Updated 2nd Edition)',
    author: 'Dr. Sophia Yin, DVM, MS',
    publisher: 'TFH Publications',
    year: 2010,
    pages: 352,
    isbn: '978-0793806423',
    price_range: '$20-30',
    format: 'Paperback',
    category: 'Relationship & Communication',
    description: "Yin's comprehensive training guide focusing on human behavior changes. Covers: body language, timing, reading dogs, basic training, behavior problems. Photo-illustrated with Yin's excellent visual guides. Emphasizes that changing human behavior changes dog behavior.",
    why_you_need_it: "Training the human is often more important than training the dog. Yin's visual guides are excellent.",
    best_for: 'Human behavior modification, visual learning, practical protocols'
  }
]

# Create all books
books_data.each_with_index do |book_attrs, index|
  Book.create!(
    user_id: nil, # Default books have no user
    is_default: true,
    status: 'not_started',
    progress_percentage: 0,
    **book_attrs
  )

  print '.' if ((index + 1) % 10).zero?
end

puts "\n✓ Successfully seeded #{books_data.count} default books!"
puts 'Books by category:'

# Print summary by category
books_by_category = Book.defaults.group(:category).count
books_by_category.each do |category, count|
  puts "  - #{category}: #{count} books"
end
