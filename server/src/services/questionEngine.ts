import { generateFigureQuestion } from './svgGenerator';

export interface Question {
  question: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: string[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  category: string;
  questionSvg?: string;
}

// ─── Question Banks ───────────────────────────────────────────────────────────

const LOCAL_GK_QUESTIONS = [
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: "B",
    explanation: "Mars is called the Red Planet because iron minerals in its soil oxidize (or rust), causing the soil and atmosphere to look red.",
    category: "General Knowledge",
    type: "GK - Science"
  },
  {
    question: "Who was the first Prime Minister of India?",
    options: ["Mahatma Gandhi", "Jawaharlal Nehru", "Dr. B. R. Ambedkar", "Sardar Vallabhbhai Patel"],
    correctAnswer: "B",
    explanation: "Pandit Jawaharlal Nehru was the first Prime Minister of independent India, serving from 1947 until 1964.",
    category: "General Knowledge",
    type: "GK - History"
  },
  {
    question: "What is the capital city of India?",
    options: ["Mumbai", "Kolkata", "Chennai", "New Delhi"],
    correctAnswer: "D",
    explanation: "New Delhi is the capital of India and the seat of all three branches of the Government of India.",
    category: "General Knowledge",
    type: "GK - Geography"
  },
  {
    question: "Which is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Pacific Ocean", "Arctic Ocean"],
    correctAnswer: "C",
    explanation: "The Pacific Ocean is the largest and deepest of Earth's oceanic divisions, extending from the Arctic Ocean in the north to the Southern Ocean in the south.",
    category: "General Knowledge",
    type: "GK - Geography"
  },
  {
    question: "How many bones are there in an adult human body?",
    options: ["206", "300", "150", "250"],
    correctAnswer: "A",
    explanation: "An adult human skeleton is made up of 206 bones, whereas a newborn baby has around 270 bones which fuse together as they grow.",
    category: "General Knowledge",
    type: "GK - Science"
  },
  {
    question: "सौरमंडल का सबसे गर्म ग्रह कौन सा है? (Which is the hottest planet in the solar system?)",
    options: ["बुध (Mercury)", "शुक्र (Venus)", "मंगल (Mars)", "बृहस्पति (Jupiter)"],
    correctAnswer: "B",
    explanation: "शुक्र (Venus) सौरमंडल का सबसे गर्म ग्रह है क्योंकि इसका घना वातावरण ग्रीनहाउस गैसों (जैसे कार्बन डाइऑक्साइड) को रोक कर तापमान को लगभग 475°C तक बढ़ा देता है।",
    category: "General Knowledge",
    type: "GK - Science"
  },
  { question: "Which country is the largest by area?", options: ["China", "USA", "Russia", "Canada"], correctAnswer: "C", explanation: "Russia is the world's largest country by area, covering about 17.1 million km².", category: "General Knowledge", type: "GK - Geography" },
  { question: "What is the currency of Japan?", options: ["Yuan", "Won", "Yen", "Baht"], correctAnswer: "C", explanation: "The Japanese Yen (JPY) is the official currency of Japan.", category: "General Knowledge", type: "GK - World" },
  { question: "Which river is the longest in the world?", options: ["Amazon", "Nile", "Yangtze", "Mississippi"], correctAnswer: "B", explanation: "The Nile River in Africa is considered the longest river in the world at approximately 6,650 km.", category: "General Knowledge", type: "GK - Geography" },
  { question: "How many continents are there on Earth?", options: ["5", "6", "7", "8"], correctAnswer: "C", explanation: "Earth has 7 continents: Asia, Africa, North America, South America, Antarctica, Europe, and Australia.", category: "General Knowledge", type: "GK - Geography" },
  { question: "Who painted the Mona Lisa?", options: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Van Gogh"], correctAnswer: "C", explanation: "The Mona Lisa was painted by Italian Renaissance artist Leonardo da Vinci around 1503–1519.", category: "General Knowledge", type: "GK - Art" },
  { question: "Which is the smallest country in the world?", options: ["Monaco", "San Marino", "Vatican City", "Liechtenstein"], correctAnswer: "C", explanation: "Vatican City is the world's smallest country both by area (0.44 km²) and population.", category: "General Knowledge", type: "GK - Geography" },
  { question: "What gas do plants absorb during photosynthesis?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correctAnswer: "C", explanation: "Plants absorb CO₂ from the air and use sunlight and water to convert it into glucose and oxygen.", category: "General Knowledge", type: "GK - Science" },
  { question: "What is the national animal of India?", options: ["Lion", "Elephant", "Bengal Tiger", "Leopard"], correctAnswer: "C", explanation: "The Bengal Tiger (Panthera tigris tigris) was declared India's national animal in 1973 under Project Tiger.", category: "General Knowledge", type: "GK - India" },
  { question: "Who invented the telephone?", options: ["Thomas Edison", "Nikola Tesla", "Alexander Graham Bell", "Guglielmo Marconi"], correctAnswer: "C", explanation: "Alexander Graham Bell is credited with inventing the first practical telephone in 1876.", category: "General Knowledge", type: "GK - Inventions" },
  { question: "Which planet has the most moons?", options: ["Jupiter", "Saturn", "Uranus", "Neptune"], correctAnswer: "B", explanation: "Saturn has the most confirmed moons — over 140 as of 2024, surpassing Jupiter.", category: "General Knowledge", type: "GK - Science" },
  { question: "In which year did India gain independence?", options: ["1945", "1947", "1950", "1942"], correctAnswer: "B", explanation: "India gained independence from British rule on August 15, 1947.", category: "General Knowledge", type: "GK - India" },
  { question: "What is the chemical symbol for Gold?", options: ["Gd", "Go", "Au", "Ag"], correctAnswer: "C", explanation: "Gold's symbol Au comes from the Latin word 'Aurum'. Silver's symbol is Ag (Argentum).", category: "General Knowledge", type: "GK - Science" },
  { question: "Which is the largest desert in the world?", options: ["Sahara", "Arabian", "Gobi", "Antarctic"], correctAnswer: "D", explanation: "Antarctica is technically the world's largest desert (cold desert) at 14.2 million km². The Sahara is the largest hot desert.", category: "General Knowledge", type: "GK - Geography" },
  { question: "Who wrote the national anthem of India?", options: ["Bankim Chandra Chattopadhyay", "Rabindranath Tagore", "Mahatma Gandhi", "Sarojini Naidu"], correctAnswer: "B", explanation: "Jana Gana Mana was written by Rabindranath Tagore and adopted as India's national anthem on January 24, 1950.", category: "General Knowledge", type: "GK - India" }
];

// ─── Science & Technology Questions ──────────────────────────────────────────

interface QItem { question: string; options: string[]; correctAnswer: string; explanation: string; type: string; }

const SCIENCE_TECH_QUESTIONS: QItem[] = [
  { question: "What does 'AI' stand for in technology?", options: ["Automated Interface", "Artificial Intelligence", "Advanced Integration", "Automated Intelligence"], correctAnswer: "B", explanation: "AI stands for Artificial Intelligence — the simulation of human intelligence in machines.", type: "Technology" },
  { question: "Which company developed the ChatGPT AI model?", options: ["Google", "Meta", "OpenAI", "Microsoft"], correctAnswer: "C", explanation: "ChatGPT was developed by OpenAI, an AI research company founded in 2015.", type: "Technology" },
  { question: "What is the speed of light?", options: ["3×10⁶ m/s", "3×10⁸ m/s", "3×10¹⁰ m/s", "3×10⁴ m/s"], correctAnswer: "B", explanation: "The speed of light in a vacuum is approximately 3×10⁸ metres per second (300,000 km/s).", type: "Physics" },
  { question: "Which planet did NASA's Perseverance Rover land on in 2021?", options: ["Moon", "Jupiter", "Mars", "Venus"], correctAnswer: "C", explanation: "NASA's Perseverance Rover landed on Mars on February 18, 2021, in the Jezero Crater.", type: "Space" },
  { question: "What does DNA stand for?", options: ["Digital Numeric Algorithm", "Deoxyribonucleic Acid", "Dynamic Nucleus Arrangement", "Dual Nucleic Atom"], correctAnswer: "B", explanation: "DNA stands for Deoxyribonucleic Acid — the molecule that carries genetic information in living organisms.", type: "Biology" },
  { question: "Which element is the most abundant in the human body?", options: ["Carbon", "Hydrogen", "Nitrogen", "Oxygen"], correctAnswer: "D", explanation: "Oxygen is the most abundant element in the human body, making up about 65% of body mass (mostly in water).", type: "Biology" },
  { question: "What is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi Body"], correctAnswer: "C", explanation: "Mitochondria produce ATP (energy) through cellular respiration, earning the nickname 'powerhouse of the cell'.", type: "Biology" },
  { question: "Who is known as the father of the internet?", options: ["Bill Gates", "Steve Jobs", "Vint Cerf", "Tim Berners-Lee"], correctAnswer: "C", explanation: "Vint Cerf and Bob Kahn co-invented the TCP/IP protocols, the foundation of the internet, in the 1970s.", type: "Technology" },
  { question: "Which programming language is known as the 'language of the web'?", options: ["Python", "Java", "JavaScript", "C++"], correctAnswer: "C", explanation: "JavaScript is the primary language for web development, running directly in browsers.", type: "Technology" },
  { question: "What is the largest organ in the human body?", options: ["Liver", "Brain", "Lungs", "Skin"], correctAnswer: "D", explanation: "The skin is the largest organ, covering the entire body with a surface area of about 2 m².", type: "Biology" },
  { question: "Which gas makes up most of Earth's atmosphere?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"], correctAnswer: "C", explanation: "Nitrogen makes up about 78% of Earth's atmosphere. Oxygen is second at 21%.", type: "Earth Science" },
  { question: "What is the boiling point of water at sea level?", options: ["90°C", "95°C", "100°C", "105°C"], correctAnswer: "C", explanation: "Water boils at 100°C (212°F) at standard sea-level atmospheric pressure.", type: "Chemistry" },
  { question: "How many bones are in a newborn baby's body?", options: ["206", "270", "300", "150"], correctAnswer: "B", explanation: "Newborns have about 270 bones; many fuse together as they grow, leaving adults with 206.", type: "Biology" },
  { question: "What force keeps planets in orbit around the Sun?", options: ["Magnetism", "Gravity", "Friction", "Centrifugal Force"], correctAnswer: "B", explanation: "Gravity is the attractive force between masses. The Sun's gravity keeps planets in elliptical orbits.", type: "Physics" },
  { question: "Which is the hardest natural substance on Earth?", options: ["Iron", "Quartz", "Diamond", "Ruby"], correctAnswer: "C", explanation: "Diamond rates 10 on the Mohs scale — the highest possible — making it the hardest natural material.", type: "Chemistry" },
  { question: "What does 5G stand for in telecommunications?", options: ["Fifth Generation", "Five Gigabytes", "Fast Gigabit", "Fifth Global"], correctAnswer: "A", explanation: "5G stands for Fifth Generation mobile network — the latest standard for wireless communications.", type: "Technology" },
  { question: "Which planet is known as the 'Ice Giant'?", options: ["Saturn", "Jupiter", "Neptune", "Mars"], correctAnswer: "C", explanation: "Neptune (and Uranus) are classified as Ice Giants due to their icy composition of water, ammonia, and methane.", type: "Space" },
  { question: "What is the study of fossils called?", options: ["Ecology", "Paleontology", "Archaeology", "Geology"], correctAnswer: "B", explanation: "Paleontology is the scientific study of the history of life through fossils of plants and animals.", type: "Earth Science" },
  { question: "How many megabytes make one gigabyte?", options: ["100", "512", "1024", "2048"], correctAnswer: "C", explanation: "In computing, 1 Gigabyte = 1024 Megabytes (using binary; in decimal it's 1000 MB).", type: "Technology" },
  { question: "What is the unit of electric current?", options: ["Volt", "Watt", "Ampere", "Ohm"], correctAnswer: "C", explanation: "The Ampere (A) is the SI unit of electric current, measuring the flow of electric charge.", type: "Physics" },
  { question: "Which scientist proposed the theory of evolution?", options: ["Isaac Newton", "Charles Darwin", "Albert Einstein", "Louis Pasteur"], correctAnswer: "B", explanation: "Charles Darwin proposed the theory of evolution by natural selection in 'On the Origin of Species' (1859).", type: "Biology" },
  { question: "What does GPS stand for?", options: ["Global Positioning System", "General Pathway Signal", "Ground Pulse Sensor", "Geo Position Satellite"], correctAnswer: "A", explanation: "GPS (Global Positioning System) is a satellite-based navigation system operated by the US government.", type: "Technology" },
  { question: "What is the name of the first satellite launched into space?", options: ["Explorer 1", "Sputnik 1", "Vostok 1", "Apollo 1"], correctAnswer: "B", explanation: "Sputnik 1, launched by the Soviet Union on October 4, 1957, was the first artificial satellite.", type: "Space" },
  { question: "Which organ produces insulin in the human body?", options: ["Liver", "Kidneys", "Pancreas", "Stomach"], correctAnswer: "C", explanation: "The pancreas produces insulin, a hormone that regulates blood sugar (glucose) levels.", type: "Biology" },
  { question: "What is the chemical formula for water?", options: ["HO", "H₂O₂", "H₂O", "OH₂"], correctAnswer: "C", explanation: "Water is H₂O — two hydrogen atoms bonded to one oxygen atom.", type: "Chemistry" }
];

// ─── Sports Questions ─────────────────────────────────────────────────────────

const SPORTS_QUESTIONS: QItem[] = [
  { question: "How many players are there in a cricket team?", options: ["9", "10", "11", "12"], correctAnswer: "C", explanation: "A cricket team consists of 11 players. One team bats while the other fields.", type: "Cricket" },
  { question: "Which country has won the most Cricket World Cup titles?", options: ["India", "Australia", "West Indies", "England"], correctAnswer: "B", explanation: "Australia has won the most ICC Cricket World Cup titles — 6 times (1987, 1999, 2003, 2007, 2015, 2023).", type: "Cricket" },
  { question: "In football, how long is a standard match?", options: ["80 minutes", "90 minutes", "100 minutes", "120 minutes"], correctAnswer: "B", explanation: "A standard football (soccer) match is 90 minutes — two halves of 45 minutes each.", type: "Football" },
  { question: "How many Olympic rings are there and what do they represent?", options: ["4 rings – seasons", "5 rings – continents", "6 rings – oceans", "7 rings – continents"], correctAnswer: "B", explanation: "The 5 Olympic rings represent the 5 continents of the world: Africa, America, Asia, Europe, and Oceania.", type: "Olympics" },
  { question: "Which sport is played at Wimbledon?", options: ["Cricket", "Badminton", "Tennis", "Squash"], correctAnswer: "C", explanation: "Wimbledon is the world's oldest and most prestigious tennis tournament, held in London, UK.", type: "Tennis" },
  { question: "Who holds the record for most runs in international cricket?", options: ["Ricky Ponting", "Brian Lara", "Sachin Tendulkar", "Virat Kohli"], correctAnswer: "C", explanation: "Sachin Tendulkar holds the record for most runs in international cricket with 34,357 runs across all formats.", type: "Cricket" },
  { question: "In which year did India win its first Cricket World Cup?", options: ["1975", "1979", "1983", "1987"], correctAnswer: "C", explanation: "India won its first Cricket World Cup in 1983 under Kapil Dev's captaincy, defeating West Indies in the final.", type: "Cricket" },
  { question: "What is the maximum score in a single bowling frame in bowling?", options: ["10", "20", "30", "300"], correctAnswer: "D", explanation: "A perfect game in bowling scores 300 — 12 consecutive strikes across 10 frames.", type: "Bowling" },
  { question: "How many players are on a basketball team on the court at one time?", options: ["4", "5", "6", "7"], correctAnswer: "B", explanation: "Each basketball team has 5 players on the court at a time.", type: "Basketball" },
  { question: "Which country hosts the Tour de France cycling race?", options: ["Italy", "Spain", "Belgium", "France"], correctAnswer: "D", explanation: "The Tour de France is an annual men's cycling race held primarily in France, covering about 3,500 km.", type: "Cycling" },
  { question: "Who is known as the 'God of Cricket'?", options: ["MS Dhoni", "Ricky Ponting", "Sachin Tendulkar", "Virat Kohli"], correctAnswer: "C", explanation: "Sachin Tendulkar is widely referred to as the 'God of Cricket' for his extraordinary records and longevity.", type: "Cricket" },
  { question: "In which sport would you perform a 'slam dunk'?", options: ["Volleyball", "Football", "Basketball", "Handball"], correctAnswer: "C", explanation: "A slam dunk is a type of basketball shot where a player jumps and forcefully puts the ball through the hoop.", type: "Basketball" },
  { question: "How many Grand Slam tennis tournaments are there?", options: ["2", "3", "4", "5"], correctAnswer: "C", explanation: "There are 4 Grand Slams: Australian Open, French Open (Roland Garros), Wimbledon, and US Open.", type: "Tennis" },
  { question: "What is the duration of each quarter in an NBA basketball game?", options: ["10 minutes", "12 minutes", "15 minutes", "20 minutes"], correctAnswer: "B", explanation: "Each NBA quarter is 12 minutes, making a full game 48 minutes (excluding overtime).", type: "Basketball" },
  { question: "Which Indian player won the Chess World Championship in 1972?", options: ["Viswanathan Anand", "Anand Viswanathan", "Gukesh D", "Pragg"], correctAnswer: "A", explanation: "Viswanathan Anand became India's first Chess World Champion. He won the World Chess Championship multiple times.", type: "Chess" },
  { question: "How many metres is a standard Olympic swimming pool?", options: ["25m", "50m", "100m", "75m"], correctAnswer: "B", explanation: "Olympic swimming pools are 50 metres long and 25 metres wide with 8 lanes.", type: "Swimming" },
  { question: "What sport uses a 'shuttlecock'?", options: ["Tennis", "Squash", "Badminton", "Pickleball"], correctAnswer: "C", explanation: "A shuttlecock (also called a birdie) is the projectile used in badminton.", type: "Badminton" },
  { question: "In which city were the 2024 Summer Olympics held?", options: ["Tokyo", "Paris", "Los Angeles", "London"], correctAnswer: "B", explanation: "The 2024 Summer Olympics were held in Paris, France, from July 26 to August 11, 2024.", type: "Olympics" },
  { question: "How many points is a touchdown worth in American Football?", options: ["3", "5", "6", "7"], correctAnswer: "C", explanation: "A touchdown in American Football scores 6 points, after which a team can attempt an extra point or two-point conversion.", type: "Football" },
  { question: "Which country won the FIFA World Cup 2022?", options: ["Brazil", "France", "Argentina", "Germany"], correctAnswer: "C", explanation: "Argentina won the 2022 FIFA World Cup in Qatar, defeating France in the final on penalty shootout.", type: "Football" }
];

// ─── Current Affairs & Fun Facts Questions ────────────────────────────────────

const FUN_FACTS_QUESTIONS: QItem[] = [
  { question: "Which country has the largest population in the world as of 2024?", options: ["China", "India", "USA", "Indonesia"], correctAnswer: "B", explanation: "India surpassed China in 2023 to become the world's most populous country with over 1.4 billion people.", type: "Current Affairs" },
  { question: "What is the name of the world's tallest building?", options: ["Shanghai Tower", "CN Tower", "Burj Khalifa", "One World Trade Center"], correctAnswer: "C", explanation: "The Burj Khalifa in Dubai, UAE stands at 828 metres — the tallest building in the world since 2010.", type: "World Records" },
  { question: "How many languages are officially recognised by the Indian Constitution?", options: ["14", "18", "22", "29"], correctAnswer: "C", explanation: "The 8th Schedule of the Indian Constitution recognises 22 official languages.", type: "India Facts" },
  { question: "Which animal can survive without water the longest?", options: ["Camel", "Kangaroo Rat", "Elephant", "Tortoise"], correctAnswer: "B", explanation: "The Kangaroo Rat can survive its entire life without drinking water, getting moisture from seeds it eats.", type: "Fun Facts" },
  { question: "What percentage of the Earth's surface is covered by water?", options: ["51%", "61%", "71%", "81%"], correctAnswer: "C", explanation: "About 71% of Earth's surface is covered by water — mostly the oceans.", type: "Earth Facts" },
  { question: "How fast can a cheetah run?", options: ["80 km/h", "100 km/h", "120 km/h", "140 km/h"], correctAnswer: "C", explanation: "A cheetah can reach speeds of up to 120 km/h (75 mph), making it the fastest land animal on Earth.", type: "Animal Facts" },
  { question: "Which country launched the first mission to land on the Moon's south pole?", options: ["USA", "China", "Russia", "India"], correctAnswer: "D", explanation: "India's Chandrayaan-3 made history on August 23, 2023, becoming the first spacecraft to land near the Moon's south pole.", type: "Space & India" },
  { question: "What is the most spoken language in the world?", options: ["English", "Hindi", "Mandarin Chinese", "Spanish"], correctAnswer: "C", explanation: "Mandarin Chinese has the most native speakers (~1 billion), though English has more total speakers including non-natives.", type: "Languages" },
  { question: "How many stars are on the flag of India? (Hint: there are none!)", options: ["0", "1", "3", "24"], correctAnswer: "A", explanation: "The Indian flag has no stars! It features three horizontal stripes (saffron, white, green) and the Ashoka Chakra — a 24-spoke wheel.", type: "India Facts" },
  { question: "Which is the deepest lake in the world?", options: ["Caspian Sea", "Lake Superior", "Lake Baikal", "Lake Titicaca"], correctAnswer: "C", explanation: "Lake Baikal in Russia is the world's deepest lake at 1,642 metres and holds about 20% of Earth's unfrozen fresh water.", type: "World Records" },
  { question: "How many teeth does an adult human normally have?", options: ["28", "30", "32", "34"], correctAnswer: "C", explanation: "A full set of adult human teeth consists of 32 teeth, including 4 wisdom teeth.", type: "Human Body" },
  { question: "Which country has the most tigers in the wild?", options: ["Russia", "China", "Bangladesh", "India"], correctAnswer: "D", explanation: "India is home to about 75% of the world's wild tiger population — over 3,000 tigers.", type: "India Facts" },
  { question: "What is the smallest planet in our solar system?", options: ["Mars", "Mercury", "Venus", "Pluto"], correctAnswer: "B", explanation: "Mercury is the smallest planet in our solar system. Pluto was reclassified as a dwarf planet in 2006.", type: "Space" },
  { question: "Approximately how many languages are spoken in the world?", options: ["1,000", "3,000", "7,000", "10,000"], correctAnswer: "C", explanation: "There are approximately 7,000 living languages in the world today, though many are endangered.", type: "Fun Facts" },
  { question: "Which fruit has the most Vitamin C per 100g?", options: ["Orange", "Lemon", "Kiwi", "Guava"], correctAnswer: "D", explanation: "Guava contains about 228 mg of Vitamin C per 100g — far more than oranges (53 mg) or lemons (53 mg).", type: "Health & Nutrition" },
  { question: "How long does light take to travel from the Sun to the Earth?", options: ["About 1 minute", "About 8 minutes", "About 30 minutes", "About 1 hour"], correctAnswer: "B", explanation: "Sunlight takes approximately 8 minutes and 20 seconds to travel the ~150 million km from the Sun to Earth.", type: "Space" },
  { question: "Which is the national game of India?", options: ["Cricket", "Kabaddi", "Hockey", "Football"], correctAnswer: "C", explanation: "Field Hockey is considered India's national sport. India won 8 Olympic gold medals in hockey between 1928 and 1980.", type: "India Facts" },
  { question: "What is the largest mammal in the world?", options: ["African Elephant", "Blue Whale", "Giraffe", "Hippopotamus"], correctAnswer: "B", explanation: "The Blue Whale is the largest animal ever known to exist, reaching lengths of up to 33 metres and weighing up to 200 tonnes.", type: "Animal Facts" },
  { question: "In which year was the first iPhone released?", options: ["2005", "2006", "2007", "2008"], correctAnswer: "C", explanation: "Apple's first iPhone was released on June 29, 2007, revolutionising the smartphone industry.", type: "Technology" },
  { question: "What is the Richter scale used to measure?", options: ["Wind speed", "Rainfall", "Earthquake magnitude", "Ocean depth"], correctAnswer: "C", explanation: "The Richter scale measures the magnitude (energy released) of earthquakes on a logarithmic scale.", type: "Earth Science" },
  { question: "Which is the longest wall in the world?", options: ["Hadrian's Wall", "Berlin Wall", "Great Wall of China", "Kumbhalgarh Wall"], correctAnswer: "C", explanation: "The Great Wall of China stretches over 21,000 km and is one of the greatest architectural feats in history.", type: "World Records" },
  { question: "How many colors are in a rainbow?", options: ["5", "6", "7", "8"], correctAnswer: "C", explanation: "A rainbow has 7 colours: Red, Orange, Yellow, Green, Blue, Indigo, and Violet (ROYGBIV).", type: "Fun Facts" }
];

// ─── Information Technology Questions ────────────────────────────────────────

const IT_QUESTIONS: QItem[] = [
  { question: "What does 'CPU' stand for?", options: ["Central Processing Unit", "Computer Personal Unit", "Core Processing Utility", "Central Program Uploader"], correctAnswer: "A", explanation: "CPU (Central Processing Unit) is the primary component of a computer that executes instructions.", type: "Hardware" },
  { question: "Which programming language is used for Android app development?", options: ["Swift", "Kotlin", "Ruby", "PHP"], correctAnswer: "B", explanation: "Kotlin is Google's preferred language for Android app development, officially supported since 2017.", type: "Programming" },
  { question: "What does 'HTML' stand for?", options: ["Hyper Text Markup Language", "High Transfer Markup Language", "Hyper Text Management Language", "Home Tool Markup Language"], correctAnswer: "A", explanation: "HTML (HyperText Markup Language) is the standard language for creating web pages.", type: "Web Development" },
  { question: "What is the binary representation of the decimal number 10?", options: ["1010", "1100", "0101", "1001"], correctAnswer: "A", explanation: "10 in decimal = 1×8 + 0×4 + 1×2 + 0×1 = 1010 in binary.", type: "Programming" },
  { question: "What does 'RAM' stand for?", options: ["Read Access Memory", "Random Access Memory", "Rapid Array Memory", "Read Array Module"], correctAnswer: "B", explanation: "RAM (Random Access Memory) is temporary storage that holds data the CPU is currently using.", type: "Hardware" },
  { question: "Which company developed the Python programming language?", options: ["Microsoft", "Apple", "Guido van Rossum / Python Foundation", "Google"], correctAnswer: "C", explanation: "Python was created by Guido van Rossum and first released in 1991. It is now managed by the Python Software Foundation.", type: "Programming" },
  { question: "What does 'SQL' stand for?", options: ["Structured Query Language", "Simple Question Language", "System Query Logic", "Standard Query List"], correctAnswer: "A", explanation: "SQL (Structured Query Language) is used to manage and query relational databases.", type: "Database" },
  { question: "What is the full form of 'URL'?", options: ["Uniform Resource Locator", "Universal Resource Link", "Unified Request Language", "Uniform Retrieval Location"], correctAnswer: "A", explanation: "URL (Uniform Resource Locator) is the web address used to locate resources on the internet.", type: "Web Development" },
  { question: "Which data structure works on the LIFO (Last In First Out) principle?", options: ["Queue", "Stack", "Array", "Linked List"], correctAnswer: "B", explanation: "A Stack follows LIFO — the last element added is the first one removed, like a stack of plates.", type: "Data Structures" },
  { question: "What does 'OOP' stand for in programming?", options: ["Object Oriented Programming", "Online Output Processing", "Open Operating Protocol", "Object Option Program"], correctAnswer: "A", explanation: "OOP (Object-Oriented Programming) is a paradigm based on objects containing data and methods, e.g. Java, Python, C++.", type: "Programming" },
  { question: "Which of these is NOT a programming language?", options: ["Python", "Java", "Linux", "Swift"], correctAnswer: "C", explanation: "Linux is an operating system kernel, not a programming language. Python, Java, and Swift are programming languages.", type: "Programming" },
  { question: "What does 'HTTP' stand for?", options: ["HyperText Transfer Protocol", "High Transfer Text Process", "Hyper Telnet Transfer Program", "Home Text Transfer Protocol"], correctAnswer: "A", explanation: "HTTP (HyperText Transfer Protocol) is the foundation of data communication on the World Wide Web.", type: "Networking" },
  { question: "How many bits make one byte?", options: ["4", "6", "8", "16"], correctAnswer: "C", explanation: "1 byte = 8 bits. A bit is the smallest unit of data (0 or 1), and 8 bits form one byte.", type: "Hardware" },
  { question: "What is the purpose of a 'firewall' in networking?", options: ["Speed up internet", "Monitor and control network traffic", "Store website data", "Compress files"], correctAnswer: "B", explanation: "A firewall monitors and filters incoming/outgoing network traffic based on security rules to protect systems.", type: "Networking" },
  { question: "Which company created the Java programming language?", options: ["Microsoft", "Apple", "Sun Microsystems", "IBM"], correctAnswer: "C", explanation: "Java was created by James Gosling at Sun Microsystems (now owned by Oracle) and released in 1995.", type: "Programming" },
  { question: "What is 'Cloud Computing'?", options: ["Storing data on weather satellites", "Delivering computing services over the internet", "Using solar-powered computers", "A type of RAM"], correctAnswer: "B", explanation: "Cloud computing delivers services like storage, servers, databases, and software over the internet on demand.", type: "Cloud" },
  { question: "What does 'IP' stand for in IP address?", options: ["Internet Protocol", "Internal Processor", "Input Port", "Interface Path"], correctAnswer: "A", explanation: "IP stands for Internet Protocol. An IP address is a unique identifier assigned to each device on a network.", type: "Networking" },
  { question: "Which sorting algorithm has the best average-case time complexity?", options: ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"], correctAnswer: "C", explanation: "Merge Sort has O(n log n) average-case complexity, better than Bubble Sort, Selection Sort, and Insertion Sort which are O(n²).", type: "Algorithms" },
  { question: "What does 'CSS' stand for?", options: ["Cascading Style Sheets", "Computer Style System", "Creative Style Software", "Coded Style Script"], correctAnswer: "A", explanation: "CSS (Cascading Style Sheets) is used to control the visual presentation of HTML web pages.", type: "Web Development" },
  { question: "What is the main function of an Operating System?", options: ["Browse the internet", "Manage hardware and software resources", "Write code", "Store files permanently"], correctAnswer: "B", explanation: "An Operating System (like Windows, Linux, macOS) manages hardware resources and provides services for software applications.", type: "OS" },
  { question: "Which of these is an example of open-source software?", options: ["Microsoft Office", "Adobe Photoshop", "Linux", "macOS"], correctAnswer: "C", explanation: "Linux is open-source — its source code is freely available. Microsoft Office, Photoshop, and macOS are proprietary.", type: "Software" },
  { question: "What is 'phishing' in cybersecurity?", options: ["Fishing with computers", "Tricking users into revealing sensitive info", "A type of virus", "Blocking a website"], correctAnswer: "B", explanation: "Phishing is a cyberattack where fraudulent messages (usually emails) trick users into revealing passwords or financial details.", type: "Cybersecurity" },
  { question: "Which protocol is used for sending emails?", options: ["HTTP", "FTP", "SMTP", "SSH"], correctAnswer: "C", explanation: "SMTP (Simple Mail Transfer Protocol) is the standard protocol for sending emails across the internet.", type: "Networking" },
  { question: "What does 'API' stand for?", options: ["Application Programming Interface", "Automated Program Integration", "Applied Process Input", "Automatic Protocol Interface"], correctAnswer: "A", explanation: "An API (Application Programming Interface) allows different software applications to communicate with each other.", type: "Programming" },
  { question: "Which data structure uses FIFO (First In First Out) order?", options: ["Stack", "Tree", "Queue", "Graph"], correctAnswer: "C", explanation: "A Queue follows FIFO — the first element added is the first removed, like a line at a ticket counter.", type: "Data Structures" }
];

// ─── AI Technology Questions ──────────────────────────────────────────────────

const AI_TECH_QUESTIONS: QItem[] = [
  { question: "What does 'AI' stand for?", options: ["Automated Input", "Artificial Intelligence", "Advanced Integration", "Automatic Instruction"], correctAnswer: "B", explanation: "AI (Artificial Intelligence) refers to the simulation of human intelligence in machines programmed to think and learn.", type: "AI Basics" },
  { question: "Which company developed ChatGPT?", options: ["Google", "Meta", "OpenAI", "Microsoft"], correctAnswer: "C", explanation: "ChatGPT was developed by OpenAI, an AI research company co-founded by Sam Altman and others in 2015.", type: "AI Companies" },
  { question: "What is 'Machine Learning'?", options: ["Teaching machines to repair themselves", "A subset of AI where systems learn from data", "Programming robots manually", "Using machines to teach humans"], correctAnswer: "B", explanation: "Machine Learning is a subset of AI where algorithms learn patterns from data to make predictions without being explicitly programmed.", type: "ML" },
  { question: "What is a 'Neural Network' in AI?", options: ["A computer network for scientists", "A system inspired by the human brain's structure", "A type of database", "An internet security system"], correctAnswer: "B", explanation: "Neural Networks are computing systems inspired by biological neural networks in the brain, used for pattern recognition and learning.", type: "Deep Learning" },
  { question: "Which Google AI model powers Google Search and Assistant?", options: ["GPT-4", "Gemini", "LLaMA", "BERT"], correctAnswer: "B", explanation: "Google's Gemini (formerly Bard) is their flagship AI model powering Google products including Search and Assistant.", type: "AI Models" },
  { question: "What does 'LLM' stand for in AI?", options: ["Large Language Model", "Low Level Machine", "Learned Logic Module", "Linear Learning Method"], correctAnswer: "A", explanation: "LLM (Large Language Model) refers to AI models trained on massive text datasets to understand and generate human language, e.g., GPT-4, Gemini.", type: "AI Models" },
  { question: "Which of these is an example of 'Computer Vision'?", options: ["Voice recognition", "Facial recognition", "Text translation", "Music generation"], correctAnswer: "B", explanation: "Computer Vision enables machines to interpret visual data. Facial recognition is a classic use case — identifying faces in images/videos.", type: "Computer Vision" },
  { question: "What is 'Deep Learning'?", options: ["Learning underwater", "A subset of ML using multi-layered neural networks", "Advanced internet searching", "Manual data entry"], correctAnswer: "B", explanation: "Deep Learning uses multi-layered (deep) neural networks to learn complex representations from large datasets.", type: "Deep Learning" },
  { question: "Which AI technique is used to generate realistic fake images and videos?", options: ["Regression", "GAN (Generative Adversarial Network)", "Decision Tree", "K-Means Clustering"], correctAnswer: "B", explanation: "GANs (Generative Adversarial Networks) use two competing neural networks to generate highly realistic synthetic images and videos (deepfakes).", type: "Generative AI" },
  { question: "What is 'Natural Language Processing' (NLP)?", options: ["Programming in natural settings", "AI that understands and generates human language", "A type of encryption", "Processing natural resources data"], correctAnswer: "B", explanation: "NLP is a branch of AI that enables computers to understand, interpret, and generate human language, used in chatbots, translation, and speech recognition.", type: "NLP" },
  { question: "What does 'GPT' stand for?", options: ["General Purpose Technology", "Generative Pre-trained Transformer", "Global Processing Tool", "Graphic Processing Transfer"], correctAnswer: "B", explanation: "GPT stands for Generative Pre-trained Transformer — the architecture behind OpenAI's language models like ChatGPT.", type: "AI Models" },
  { question: "Which AI application is used to recommend movies on Netflix?", options: ["Computer Vision", "Robotics", "Recommendation System", "Speech Recognition"], correctAnswer: "C", explanation: "Netflix uses AI-powered Recommendation Systems (collaborative filtering + ML) to suggest content based on your watch history.", type: "AI Applications" },
  { question: "What is 'Prompt Engineering'?", options: ["Building physical prompts", "Crafting effective inputs to get better AI outputs", "Engineering fast computers", "A coding technique"], correctAnswer: "B", explanation: "Prompt Engineering is the skill of designing effective instructions/questions for AI models to produce accurate, useful responses.", type: "Generative AI" },
  { question: "Which company developed the AI model called 'LLaMA'?", options: ["Google", "OpenAI", "Meta", "Apple"], correctAnswer: "C", explanation: "LLaMA (Large Language Model Meta AI) was developed by Meta (Facebook's parent company) as an open-source LLM.", type: "AI Companies" },
  { question: "What is 'Overfitting' in Machine Learning?", options: ["Training a model too slowly", "A model performs well on training data but poorly on new data", "Using too much computing power", "An internet connection error"], correctAnswer: "B", explanation: "Overfitting occurs when a model memorizes training data too precisely, losing the ability to generalize to unseen data.", type: "ML" },
  { question: "Which of these is a popular Python library for Machine Learning?", options: ["React", "Django", "TensorFlow", "Laravel"], correctAnswer: "C", explanation: "TensorFlow (by Google) is one of the most widely used open-source ML frameworks for building and training neural networks.", type: "AI Tools" },
  { question: "What is 'Reinforcement Learning'?", options: ["Repeating the same training data", "An AI learning by trial and error with rewards/penalties", "Learning from labelled datasets", "A type of database query"], correctAnswer: "B", explanation: "Reinforcement Learning trains AI agents through reward and punishment — the agent explores actions and learns which maximise rewards, used in game AI and robotics.", type: "ML" },
  { question: "What is an 'AI Chatbot'?", options: ["A robot that chats physically", "Software that simulates conversation using AI", "A chat application without internet", "A human customer service agent"], correctAnswer: "B", explanation: "An AI chatbot is software that uses NLP and ML to simulate human conversation, e.g., ChatGPT, Google Gemini, Apple Siri.", type: "AI Applications" },
  { question: "Which Indian city is considered a major hub for AI startups?", options: ["Delhi", "Mumbai", "Bengaluru", "Chennai"], correctAnswer: "C", explanation: "Bengaluru (Bangalore) is India's Silicon Valley and hosts the highest concentration of AI and tech startups in the country.", type: "AI & India" },
  { question: "What is 'Computer Vision' primarily used for?", options: ["Writing code automatically", "Enabling machines to interpret and analyse images/videos", "Translating languages", "Managing databases"], correctAnswer: "B", explanation: "Computer Vision enables machines to process and understand visual information from the world, used in self-driving cars, medical imaging, and security.", type: "Computer Vision" },
  { question: "What does 'API' mean in the context of AI services like ChatGPT?", options: ["Artificial Programming Interface", "Application Programming Interface", "Automated Process Integration", "Advanced Protocol Input"], correctAnswer: "B", explanation: "An API (Application Programming Interface) allows developers to integrate AI capabilities (like ChatGPT or Gemini) into their own apps.", type: "AI Tools" },
  { question: "Which AI technology is used in virtual assistants like Siri and Alexa?", options: ["Computer Vision", "Speech Recognition + NLP", "Reinforcement Learning", "GANs"], correctAnswer: "B", explanation: "Virtual assistants use Speech Recognition to convert voice to text, and NLP to understand and respond to user commands.", type: "AI Applications" },
  { question: "What is a 'Training Dataset' in Machine Learning?", options: ["A gym timetable", "The data used to teach an AI model patterns", "A test paper for students", "A type of computer memory"], correctAnswer: "B", explanation: "A training dataset is the collection of labelled examples fed to an ML model during training so it learns to recognize patterns.", type: "ML" },
  { question: "Which of these is a self-driving car company that uses AI?", options: ["Nokia", "Kodak", "Waymo", "Blockbuster"], correctAnswer: "C", explanation: "Waymo (a Google/Alphabet company) is a leader in autonomous vehicle technology, using AI, computer vision, and sensor fusion.", type: "AI Applications" },
  { question: "What year was ChatGPT publicly launched?", options: ["2020", "2021", "2022", "2023"], correctAnswer: "C", explanation: "ChatGPT was publicly launched by OpenAI in November 2022 and rapidly became the fastest-growing consumer app in history.", type: "AI History" }
];

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Procedural Mental Ability Question Generator
function generateLocalMentalAbility(_difficulty: string): Omit<Question, 'difficulty'> {
  const types = ["Alphabet Series", "Number Series", "Coding-Decoding", "Analogy", "Classification"];
  const selectedType = types[Math.floor(Math.random() * types.length)];
  
  if (selectedType === "Number Series") {
    const start = Math.floor(Math.random() * 10) + 1;
    const diff = Math.floor(Math.random() * 5) + 2;
    const seriesType = Math.floor(Math.random() * 3); // 0: Arithmetic, 1: Geometric, 2: Fibonacci-like
    
    if (seriesType === 0) {
      // 2, 5, 8, 11, 14, ?
      const sequence = [start, start + diff, start + diff * 2, start + diff * 3, start + diff * 4];
      const answer = start + diff * 5;
      const options = [answer, answer + diff, answer - diff, answer + 1].map(String);
      const shuffled = shuffleArray(options);
      const correctIndex = shuffled.indexOf(String(answer));
      const letterMap = ["A", "B", "C", "D"];
      
      return {
        question: `Find the next number in the arithmetic series: ${sequence.join(", ")}, ?`,
        type: "Number Series",
        options: shuffled,
        correctAnswer: letterMap[correctIndex] as 'A' | 'B' | 'C' | 'D',
        explanation: `This is an arithmetic progression where each term increases by ${diff}. The next term is ${sequence[4]} + ${diff} = ${answer}.`,
        category: "Mental Ability"
      };
    } else if (seriesType === 1) {
      // 2, 4, 8, 16, 32, ?
      const ratio = 2;
      const sequence = [start, start * ratio, start * ratio * ratio, start * ratio * 3, start * ratio * 4];
      const answer = start * ratio * 5;
      const options = [answer, answer + 4, answer - 4, answer * 2].map(String);
      const shuffled = shuffleArray(options);
      const correctIndex = shuffled.indexOf(String(answer));
      const letterMap = ["A", "B", "C", "D"];
      
      return {
        question: `Find the next number in the geometric series: ${sequence.join(", ")}, ?`,
        type: "Number Series",
        options: shuffled,
        correctAnswer: letterMap[correctIndex] as 'A' | 'B' | 'C' | 'D',
        explanation: `This is a geometric progression where each term is multiplied by ${ratio}. The next term is ${sequence[4]} * ${ratio} = ${answer}.`,
        category: "Mental Ability"
      };
    } else {
      // 2, 6, 12, 20, 30, ? (n^2 + n)
      const answer = 42; // 6^2 + 6 — sequence is 2,6,12,20,30 (n^2+n for n=1..5)
      const options = ["36", "40", "42", "45"];
      const shuffled = shuffleArray(options);
      const correctIndex = shuffled.indexOf(String(answer));
      const letterMap = ["A", "B", "C", "D"];
      
      return {
        question: `Complete the number pattern: 2, 6, 12, 20, 30, ?`,
        type: "Number Series",
        options: shuffled,
        correctAnswer: letterMap[correctIndex] as 'A' | 'B' | 'C' | 'D',
        explanation: `The differences between consecutive terms are increasing even numbers: +4, +6, +8, +10. Therefore, the next term is 30 + 12 = 42.`,
        category: "Mental Ability"
      };
    }
  } else if (selectedType === "Alphabet Series") {
    const seriesItems = [
      { q: "A, C, F, J, O, ?", ans: "U", opts: ["S", "T", "U", "V"], exp: "Steps increase: +2,+3,+4,+5,+6. O(15)+6 = U(21)." },
      { q: "Z, X, U, Q, L, ?", ans: "F", opts: ["F", "G", "H", "E"], exp: "Steps decrease: -2,-3,-4,-5,-6. L(12)-6 = F(6)." },
      { q: "B, D, G, K, P, ?", ans: "V", opts: ["T", "U", "V", "W"], exp: "Steps increase: +2,+3,+4,+5,+6. P(16)+6 = V(22)." },
      { q: "A, E, I, M, Q, ?", ans: "U", opts: ["S", "T", "U", "V"], exp: "Each letter advances by 4: A+4=E, E+4=I, I+4=M, M+4=Q, Q+4=U." },
      { q: "C, F, I, L, O, ?", ans: "R", opts: ["P", "Q", "R", "S"], exp: "Each letter advances by 3: C+3=F, F+3=I … O+3=R." },
      { q: "A, B, D, G, K, ?", ans: "P", opts: ["N", "O", "P", "Q"], exp: "Steps increase by 1 each time: +1,+2,+3,+4,+5. K(11)+5=P(16)." }
    ];
    const item = seriesItems[Math.floor(Math.random() * seriesItems.length)];
    const shuffled = shuffleArray(item.opts);
    const correctIndex = shuffled.indexOf(item.ans);
    const letterMap = ["A", "B", "C", "D"];

    return {
      question: `Find the missing letter in the alphabet series: ${item.q}`,
      type: "Alphabet Series",
      options: shuffled,
      correctAnswer: letterMap[correctIndex] as 'A' | 'B' | 'C' | 'D',
      explanation: item.exp,
      category: "Mental Ability"
    };
  } else if (selectedType === "Coding-Decoding") {
    const codingItems = [
      { q: "If 'CAT' is written as 'DBU', how will 'DOG' be written?", ans: "EPH", opts: ["EPH", "EOF", "FPH", "ENG"], exp: "Each letter shifts +1: D→E, O→P, G→H = EPH." },
      { q: "If 'FISH' is coded as 'GJTI', how will 'BIRD' be coded?", ans: "CJSE", opts: ["CJSE", "BJSD", "CISE", "DJSE"], exp: "Each letter shifts +1: B→C, I→J, R→S, D→E = CJSE." },
      { q: "If 'ROSE' is written as 'QNRD', how will 'LILY' be written?", ans: "KHKX", opts: ["KHKX", "MJMZ", "KIMY", "JGJX"], exp: "Each letter shifts -1: L→K, I→H, L→K, Y→X = KHKX." },
      { q: "If 'SUN' is written as 'TVP' (+1 shift), how will 'MOON' be written?", ans: "NPPO", opts: ["NPPO", "NOON", "LNNM", "OPQO"], exp: "Each letter shifts +1: M→N, O→P, O→P, N→O = NPPO." },
      { q: "If 'TABLE' means 'GZYOV' (A=Z, B=Y reversal), what does 'CHAIR' mean?", ans: "XSZHV", opts: ["XSZHV", "YSZIV", "WSZHV", "XRZHU"], exp: "Mirror cipher: C→X, H→S, A→Z, I→H, R→I... using A=Z reversal gives XSZHV." }
    ];
    const item = codingItems[Math.floor(Math.random() * codingItems.length)];
    const shuffled = shuffleArray(item.opts);
    const correctIndex = shuffled.indexOf(item.ans);
    const letterMap = ["A", "B", "C", "D"];

    return {
      question: item.q,
      type: "Coding-Decoding",
      options: shuffled,
      correctAnswer: letterMap[correctIndex] as 'A' | 'B' | 'C' | 'D',
      explanation: item.exp,
      category: "Mental Ability"
    };
  } else if (selectedType === "Analogy") {
    // Bird : Fly :: Fish : ? -> Swim
    const analogies = [
      { q: "Bird : Fly :: Fish : ?", options: ["Swim", "Crawl", "Walk", "Float"], ans: "Swim", exp: "Birds move by flying, and fish move by swimming." },
      { q: "Car : Road :: Ship : ?", options: ["Sky", "Water", "Track", "Air"], ans: "Water", exp: "Cars travel on roads, whereas ships travel on water." },
      { q: "Doctor : Hospital :: Teacher : ?", options: ["Office", "School", "Kitchen", "Market"], ans: "School", exp: "A doctor's workplace is a hospital, and a teacher's workplace is a school." }
    ];
    const item = analogies[Math.floor(Math.random() * analogies.length)];
    const shuffled = shuffleArray(item.options);
    const correctIndex = shuffled.indexOf(item.ans);
    const letterMap = ["A", "B", "C", "D"];
    
    return {
      question: `Find the matching term: ${item.q}`,
      type: "Analogy",
      options: shuffled,
      correctAnswer: letterMap[correctIndex] as 'A' | 'B' | 'C' | 'D',
      explanation: item.exp,
      category: "Mental Ability"
    };
  } else {
    // Classification (Odd word out)
    const classifications = [
      { options: ["Mango", "Apple", "Banana", "Carrot"], ans: "Carrot", exp: "Mango, Apple, and Banana are fruits, while Carrot is a root vegetable." },
      { options: ["Lion", "Tiger", "Leopard", "Cow"], ans: "Cow", exp: "Lion, Tiger, and Leopard are wild carnivores, while Cow is a domestic herbivore." },
      { options: ["Circle", "Triangle", "Square", "Sphere"], ans: "Sphere", exp: "Circle, Triangle, and Square are 2D shapes, while Sphere is a 3D solid shape." }
    ];
    const item = classifications[Math.floor(Math.random() * classifications.length)];
    const shuffled = shuffleArray(item.options);
    const correctIndex = shuffled.indexOf(item.ans);
    const letterMap = ["A", "B", "C", "D"];
    
    return {
      question: `Identify the odd item in the group: ${shuffled.join(", ")}`,
      type: "Classification",
      options: shuffled,
      correctAnswer: letterMap[correctIndex] as 'A' | 'B' | 'C' | 'D',
      explanation: item.exp,
      category: "Mental Ability"
    };
  }
}

// Procedural Mathematics Question Generator
function generateLocalMathematics(_difficulty: string): Omit<Question, 'difficulty'> {
  const topics = ["Percentage", "Average", "LCM & HCF", "Fractions"];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  const letterMap = ["A", "B", "C", "D"];
  
  if (topic === "Percentage") {
    // A% of B
    const a = [10, 20, 25, 50][Math.floor(Math.random() * 4)];
    const b = (Math.floor(Math.random() * 9) + 1) * 100; // 100 to 900
    const answer = (a * b) / 100;
    const options = [answer, answer + 10, answer - 5, answer * 1.5].map(Math.round).map(String);
    const shuffled = shuffleArray(options);
    const correctIndex = shuffled.indexOf(String(Math.round(answer)));
    
    return {
      question: `Calculate: What is ${a}% of ${b}?`,
      type: "Mathematics",
      options: shuffled,
      correctAnswer: letterMap[correctIndex] as 'A' | 'B' | 'C' | 'D',
      explanation: `${a}% of ${b} is calculated as (${a} / 100) * ${b} = ${answer}.`,
      category: "Mathematics"
    };
  } else if (topic === "Average") {
    // Average of 3 consecutive multiples
    const start = Math.floor(Math.random() * 10) + 1;
    const diff = Math.floor(Math.random() * 4) + 2;
    const nums = [start, start + diff, start + diff * 2];
    const answer = start + diff;
    const options = [answer, answer + 1, answer - 2, answer * 2].map(String);
    const shuffled = shuffleArray(options);
    const correctIndex = shuffled.indexOf(String(answer));
    
    return {
      question: `Find the average of the numbers: ${nums.join(", ")}.`,
      type: "Mathematics",
      options: shuffled,
      correctAnswer: letterMap[correctIndex] as 'A' | 'B' | 'C' | 'D',
      explanation: `The average is the sum of terms divided by count: (${nums.join(" + ")}) / 3 = ${nums.reduce((s,n) => s+n, 0)} / 3 = ${answer}.`,
      category: "Mathematics"
    };
  } else if (topic === "LCM & HCF") {
    // LCM of two small numbers
    const pair = [
      { a: 4, b: 6, lcm: 12, exp: "Multiples of 4 are 4, 8, 12, 16... and of 6 are 6, 12, 18... The smallest common multiple is 12." },
      { a: 6, b: 9, lcm: 18, exp: "Multiples of 6 are 6, 12, 18, 24... and of 9 are 9, 18, 27... The smallest common multiple is 18." },
      { a: 8, b: 12, lcm: 24, exp: "Multiples of 8 are 8, 16, 24, 32... and of 12 are 12, 24, 36... The smallest common multiple is 24." }
    ][Math.floor(Math.random() * 3)];
    
    const options = [pair.lcm, pair.lcm * 2, pair.a * pair.b, Math.max(pair.a, pair.b)].map(String);
    const shuffled = shuffleArray(options);
    const correctIndex = shuffled.indexOf(String(pair.lcm));
    
    return {
      question: `Find the Least Common Multiple (LCM) of ${pair.a} and ${pair.b}.`,
      type: "Mathematics",
      options: shuffled,
      correctAnswer: letterMap[correctIndex] as 'A' | 'B' | 'C' | 'D',
      explanation: pair.exp,
      category: "Mathematics"
    };
  } else {
    // Fractions addition: 1/2 + 1/4 = 3/4 or 1/3 + 1/6 = 1/2
    const frac = [
      { q: "1/2 + 1/4", ans: "3/4", options: ["1/2", "3/4", "2/6", "5/4"], exp: "To add fractions, find a common denominator: 1/2 + 1/4 = 2/4 + 1/4 = 3/4." },
      { q: "1/3 + 1/6", ans: "1/2", options: ["1/2", "2/9", "3/6", "4/3"], exp: "To add fractions, find a common denominator: 1/3 + 1/6 = 2/6 + 1/6 = 3/6 = 1/2." }
    ][Math.floor(Math.random() * 2)];
    
    const shuffled = shuffleArray(frac.options);
    const correctIndex = shuffled.indexOf(frac.ans);
    
    return {
      question: `Solve the fraction addition: ${frac.q}`,
      type: "Mathematics",
      options: shuffled,
      correctAnswer: letterMap[correctIndex] as 'A' | 'B' | 'C' | 'D',
      explanation: frac.exp,
      category: "Mathematics"
    };
  }
}

const PUZZLE_QUESTIONS: QItem[] = [
  // Number Sequences
  { question: "What comes next in the sequence? 2, 4, 8, 16, 32, ___", options: ["48", "56", "64", "72"], correctAnswer: "C", explanation: "Each number doubles (×2). 32 × 2 = 64.", type: "Number Sequence" },
  { question: "Find the next number in the Fibonacci sequence: 1, 1, 2, 3, 5, 8, 13, ___", options: ["18", "21", "20", "24"], correctAnswer: "B", explanation: "Fibonacci: each term = sum of the two before it. 8+13 = 21.", type: "Number Sequence" },
  { question: "What is the missing number? 1, 4, 9, 16, 25, ___, 49", options: ["30", "36", "32", "40"], correctAnswer: "B", explanation: "These are perfect squares (n²). Missing: 6² = 36.", type: "Number Sequence" },
  { question: "Complete the series: 100, 91, 82, 73, 64, ___", options: ["55", "54", "56", "53"], correctAnswer: "A", explanation: "Each term decreases by 9. 64 − 9 = 55.", type: "Number Sequence" },
  { question: "What comes next? 1, 3, 6, 10, 15, ___", options: ["18", "19", "20", "21"], correctAnswer: "D", explanation: "Triangular numbers. Differences: +2,+3,+4,+5,+6. So 15+6 = 21.", type: "Number Sequence" },
  { question: "Find the pattern and complete: 2, 6, 12, 20, 30, ___", options: ["36", "40", "42", "44"], correctAnswer: "C", explanation: "Differences increase by 2 each time: +4,+6,+8,+10,+12. So 30+12 = 42.", type: "Number Sequence" },
  // Pattern Recognition
  { question: "Which number does NOT belong? 121, 144, 196, 215, 225", options: ["121", "144", "215", "225"], correctAnswer: "C", explanation: "121=11², 144=12², 196=14², 225=15². Only 215 is not a perfect square.", type: "Pattern Recognition" },
  { question: "If 2+3=10 and 7+2=63 and 6+5=66, then 8+4=?", options: ["96", "48", "84", "112"], correctAnswer: "A", explanation: "Rule: A×(A+B). So 8×(8+4) = 8×12 = 96.", type: "Pattern Recognition" },
  { question: "ELBOW → BELOW. Using the same pattern, PAGES → ?", options: ["PEGAS", "GAPES", "GASES", "SEPAL"], correctAnswer: "B", explanation: "ELBOW is rearranged to make BELOW. PAGES rearranged gives GAPES (an anagram).", type: "Pattern Recognition" },
  // Word Riddles
  { question: "🧩 I have hands but cannot clap. What am I?", options: ["A glove", "A clock", "A mannequin", "A statue"], correctAnswer: "B", explanation: "A clock has 'hands' (hour and minute hands) but cannot physically clap.", type: "Word Riddle" },
  { question: "🧩 The more you take, the more you leave behind. What am I?", options: ["Memories", "Money", "Footsteps", "Water"], correctAnswer: "C", explanation: "Every step you take, you leave a footprint behind you.", type: "Word Riddle" },
  { question: "🧩 I speak without a mouth and hear without ears. I have no body. What am I?", options: ["A ghost", "An echo", "Music", "Silence"], correctAnswer: "B", explanation: "An echo reflects sound — no mouth or ears needed.", type: "Word Riddle" },
  { question: "🧩 What gets wetter as it dries?", options: ["A sponge", "Rain", "A towel", "A cloud"], correctAnswer: "C", explanation: "A towel gets wet itself as it dries things — it absorbs your moisture.", type: "Word Riddle" },
  { question: "🧩 I have cities but no houses, mountains but no trees, water but no fish. What am I?", options: ["A dream", "A map", "A painting", "A mirror"], correctAnswer: "B", explanation: "A map shows symbols of cities, mountains, and water — but none of the real things.", type: "Word Riddle" },
  { question: "🧩 What word becomes shorter when you add two letters to it?", options: ["Little", "Tiny", "Short", "Small"], correctAnswer: "C", explanation: "Add 'ER' to 'SHORT' and you get 'SHORTER' — a word meaning more brief!", type: "Word Riddle" },
  { question: "🧩 I go up but never come down. What am I?", options: ["A balloon", "Age", "A kite", "The sun"], correctAnswer: "B", explanation: "Your age only ever increases — it never goes down.", type: "Word Riddle" },
  { question: "🧩 I have keys but no locks, space but no rooms, you can enter but cannot go inside. What am I?", options: ["A map", "A piano", "A keyboard", "A safe"], correctAnswer: "C", explanation: "A keyboard has letter keys, a spacebar, and Enter — no physical locks or rooms.", type: "Word Riddle" },
  // Math Brain Teasers
  { question: "🧮 A farmer has 17 sheep. All but 9 die. How many sheep does he have left?", options: ["8", "9", "17", "0"], correctAnswer: "B", explanation: "'All but 9' means 9 survive. The answer is 9.", type: "Math Brain Teaser" },
  { question: "🧮 If you have 3 apples and take away 2, how many apples do YOU have?", options: ["1", "2", "3", "5"], correctAnswer: "B", explanation: "You TOOK 2 apples — so you personally have 2.", type: "Math Brain Teaser" },
  { question: "🧮 A bat and ball cost ₹110 total. The bat costs ₹100 more than the ball. What does the ball cost?", options: ["₹10", "₹5", "₹15", "₹20"], correctAnswer: "B", explanation: "Ball=x, bat=x+100. x+(x+100)=110 → 2x=10 → x=₹5.", type: "Math Brain Teaser" },
  { question: "🧮 5 cats catch 5 mice in 5 minutes. How many cats are needed to catch 100 mice in 100 minutes?", options: ["100", "50", "5", "20"], correctAnswer: "C", explanation: "Each cat catches 1 mouse per 5 min = 20 mice per 100 min. 5 cats × 20 = 100.", type: "Math Brain Teaser" },
  { question: "🧮 A doctor gives you 3 pills: take one every 30 minutes. How long until all pills are taken?", options: ["1.5 hours", "1 hour", "30 minutes", "2 hours"], correctAnswer: "B", explanation: "Take at 0, 30, 60 min — last pill at exactly 1 hour.", type: "Math Brain Teaser" },
  { question: "🧮 How many times can you subtract 5 from 25?", options: ["5 times", "Only once", "Infinite times", "Zero"], correctAnswer: "B", explanation: "After subtracting 5 from 25 once, you have 20 — not 25. So you can only subtract 5 FROM 25 once.", type: "Math Brain Teaser" },
  { question: "🧮 If today is Monday, what day will it be 100 days from today?", options: ["Monday", "Wednesday", "Friday", "Thursday"], correctAnswer: "B", explanation: "100 ÷ 7 = 14 weeks remainder 2 days. Monday + 2 days = Wednesday.", type: "Math Brain Teaser" },
  { question: "🧮 A train travels 60 km/h. How far does it travel in 90 minutes?", options: ["70 km", "80 km", "90 km", "100 km"], correctAnswer: "C", explanation: "60 km/h × 1.5 hours = 90 km.", type: "Math Brain Teaser" },
  // Logic Puzzles
  { question: "🔍 John's mother has 3 sons: Snap, Crackle, and ___?", options: ["Pop", "John", "Jack", "Tom"], correctAnswer: "B", explanation: "The question begins 'John's mother' — the third son is John himself!", type: "Logic Puzzle" },
  { question: "🔍 A rooster lays an egg on the roof. Which way does it roll?", options: ["Left", "Right", "Toward the sun", "Roosters don't lay eggs"], correctAnswer: "D", explanation: "Roosters are male — they cannot lay eggs! Only hens lay eggs.", type: "Logic Puzzle" },
  { question: "🔍 How many months have 28 days?", options: ["Only February", "6 months", "All 12 months", "7 months"], correctAnswer: "C", explanation: "Every month has at least 28 days — ALL 12 months have 28 days!", type: "Logic Puzzle" },
  { question: "🔍 A one-story house: everything is pink. What color are the stairs?", options: ["Pink", "White", "There are no stairs", "Brown"], correctAnswer: "C", explanation: "A one-story house has no stairs — there is only one floor!", type: "Logic Puzzle" },
  { question: "🔍 Before Mount Everest was discovered, what was the tallest mountain?", options: ["K2", "Kangchenjunga", "Mount Everest was still the tallest", "Denali"], correctAnswer: "C", explanation: "Everest was always the tallest — it just hadn't been discovered yet!", type: "Logic Puzzle" },
  { question: "🔍 A plane crashes on the US-Canada border. Where do they bury the survivors?", options: ["USA", "Canada", "On the border", "You don't bury survivors"], correctAnswer: "D", explanation: "SURVIVORS are alive — you do not bury living people!", type: "Logic Puzzle" },
  { question: "🔍 Two fathers and two sons eat eggs. Only 3 eggs — yet each eats exactly 1 whole egg. How?", options: ["One was shared", "One was fake", "They are grandfather, father & son", "One ate the shell"], correctAnswer: "C", explanation: "3 people: grandfather, father, son. The middle man is both a father AND a son — only 3 people total!", type: "Logic Puzzle" },
  { question: "🔍 You drop a yellow hat in the Red Sea. What happens to it?", options: ["It turns red", "It turns yellow-red", "It gets wet", "It sinks immediately"], correctAnswer: "C", explanation: "The Red Sea is still just saltwater — the hat simply gets wet!", type: "Logic Puzzle" },
  // Cipher / Code Puzzles
  { question: "🔐 If CAT = 24 (letter positions: C=3, A=1, T=20, sum=24), what does DOG equal?", options: ["24", "26", "28", "30"], correctAnswer: "B", explanation: "D=4, O=15, G=7. Sum = 4+15+7 = 26.", type: "Cipher Puzzle" },
  { question: "🔐 If FISH is coded as GJTI (each letter +1), how is BIRD coded?", options: ["CJSE", "BJSD", "CISE", "DJSE"], correctAnswer: "A", explanation: "B→C, I→J, R→S, D→E = CJSE. Each letter shifts +1.", type: "Cipher Puzzle" },
  { question: "🔐 If ROSE = 57 (sum of letter positions: R=18, O=15, S=19, E=5), what does LILY equal?", options: ["55", "58", "62", "65"], correctAnswer: "B", explanation: "L=12, I=9, L=12, Y=25. Sum = 12+9+12+25 = 58.", type: "Cipher Puzzle" },
  { question: "🔐 If MANGO is coded as OCPIQ (each letter +2), what is APPLE in the same code?", options: ["CRRNG", "CQQNG", "CRRNF", "BQQMF"], correctAnswer: "A", explanation: "A→C, P→R, P→R, L→N, E→G = CRRNG.", type: "Cipher Puzzle" },
  { question: "🔐 In a code: SUN=54 (S=19,U=21,N=14). What is STAR? (S=19,T=20,A=1,R=18)", options: ["58", "62", "66", "70"], correctAnswer: "A", explanation: "S=19, T=20, A=1, R=18. Sum = 19+20+1+18 = 58.", type: "Cipher Puzzle" },
];

export type QuestionCategory =
  | 'Mental Ability'
  | 'Figure & Design Reasoning'
  | 'Mathematics'
  | 'General Knowledge'
  | 'Science & Technology'
  | 'Sports'
  | 'Current Affairs & Fun Facts'
  | 'Information Technology'
  | 'AI Technology'
  | 'Puzzle'
  | 'Random';

function pickFromPool(pool: QItem[], category: string, difficulty: 'easy' | 'medium' | 'hard'): Question {
  const item = pool[Math.floor(Math.random() * pool.length)];
  const shuffled = shuffleArray(item.options);
  const correctIndex = shuffled.indexOf(item.options[['A','B','C','D'].indexOf(item.correctAnswer)]);
  return {
    question: item.question,
    type: item.type,
    difficulty,
    options: shuffled,
    correctAnswer: (['A','B','C','D'][correctIndex]) as 'A'|'B'|'C'|'D',
    explanation: item.explanation,
    category
  };
}

// ─── Gemini Rate Limiter & Circuit Breaker ────────────────────────────────────

let lastGeminiCall = 0;
const GEMINI_INTERVAL_MS = 2000;

// Circuit breaker: blocks Gemini calls until timestamp expires
let geminiQuotaExhaustedUntil = 0;

// 500 error backoff: after 2 consecutive 500s, pause for 5 minutes
let gemini500Count = 0;
let gemini500BackoffUntil = 0;

async function geminiRateLimit() {
  const wait = GEMINI_INTERVAL_MS - (Date.now() - lastGeminiCall);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastGeminiCall = Date.now();
}

// Figure & Design Reasoning is always local — SVG puzzles can't be AI-generated
const LOCAL_ONLY_CATEGORIES = new Set(['Figure & Design Reasoning']);

/**
 * Main function to generate a question.
 * Tries Gemini API if configured; otherwise falls back to the local generator.
 */
export async function generateQuestion(
  category: QuestionCategory,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  language: 'en' | 'hi' | 'bilingual' = 'en',
  customTopic?: string
): Promise<Question> {

  // Custom topic: bypass category system, ask Gemini specifically about this topic
  if (customTopic?.trim()) {
    const topicApiKey = process.env.GEMINI_API_KEY;
    const topicBlocked = Date.now() < geminiQuotaExhaustedUntil || Date.now() < gemini500BackoffUntil;
    if (topicApiKey?.trim() && !topicBlocked) {
      await geminiRateLimit();
      if (Date.now() > geminiQuotaExhaustedUntil && Date.now() > gemini500BackoffUntil) {
        try {
          const langNote = language === 'hi'
            ? 'Write the question and all options in Hindi only.'
            : language === 'bilingual'
            ? 'Write the question and options in both Hindi and English (bilingual format).'
            : 'Write the question and options in English.';

          const topicPrompt = `You are an expert quiz master. Generate a multiple-choice question specifically about: "${customTopic}".

Difficulty: ${difficulty === 'easy' ? 'easy — beginner level' : difficulty === 'medium' ? 'medium — standard knowledge' : 'hard — expert or enthusiast level'}
Language: ${langNote}

Rules:
- The question MUST be directly about "${customTopic}" — not a tangential related topic.
- All 4 options must be plausible (no obviously wrong distractors).
- Keep questions concise (under 25 words).
- Vary the correct answer position (not always "A").
- Must be factually accurate.

Return ONLY a valid JSON object — no markdown, no code blocks:
{
  "question": "...",
  "type": "${customTopic}",
  "options": ["option1", "option2", "option3", "option4"],
  "correctAnswer": "A",
  "explanation": "Brief explanation of why the answer is correct."
}`;

          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 8000);
          let resp: Response;
          try {
            resp = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${topicApiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: topicPrompt }] }],
                  generationConfig: { responseMimeType: 'application/json', temperature: 0.9 }
                }),
                signal: ctrl.signal
              }
            );
          } finally {
            clearTimeout(tid);
          }

          if (resp.ok) {
            const raw = await resp.text();
            let dat: any;
            try { dat = JSON.parse(raw); } catch {}
            if (dat) {
              const txt = dat.candidates?.[0]?.content?.parts?.[0]?.text;
              if (txt) {
                try {
                  const p = JSON.parse(txt.trim());
                  if (p.question && Array.isArray(p.options) && p.options.length === 4 && p.correctAnswer) {
                    gemini500Count = 0;
                    console.log(`[AI] ✅ Custom topic "${customTopic}" → "${p.question.slice(0, 60)}"`);
                    return {
                      question: p.question, type: p.type || customTopic, difficulty,
                      options: p.options, correctAnswer: p.correctAnswer as 'A' | 'B' | 'C' | 'D',
                      explanation: p.explanation || '', category: customTopic
                    };
                  }
                } catch {}
              }
            }
          } else if (resp.status === 429) {
            geminiQuotaExhaustedUntil = Date.now() + 60 * 60 * 1000;
            console.warn('[AI] 🔴 Quota exhausted during custom topic generation');
          }
        } catch (err: any) {
          if (err?.name === 'AbortError') console.warn('[AI] ⏱ Gemini timeout for custom topic');
          else console.warn('[AI] ❌ Custom topic Gemini failed:', err?.message);
        }
      }
    }
    // Gemini unavailable — fall back to GK bank so the game isn't blocked
    console.log(`[LOCAL] Custom topic fallback for "${customTopic}" — using GK bank`);
    return pickFromPool(LOCAL_GK_QUESTIONS as QItem[], customTopic, difficulty);
  }

  type ActiveCat = Exclude<QuestionCategory, 'Random'>;
  let activeCategory: ActiveCat = 'Mental Ability';

  if (category === 'Random') {
    const roll = Math.random() * 100;
    if      (roll < 20) activeCategory = 'Mental Ability';
    else if (roll < 33) activeCategory = 'Figure & Design Reasoning';
    else if (roll < 46) activeCategory = 'Mathematics';
    else if (roll < 57) activeCategory = 'General Knowledge';
    else if (roll < 68) activeCategory = 'Science & Technology';
    else if (roll < 77) activeCategory = 'Sports';
    else if (roll < 84) activeCategory = 'Information Technology';
    else if (roll < 92) activeCategory = 'AI Technology';
    else                activeCategory = 'Current Affairs & Fun Facts';
  } else {
    activeCategory = category;
  }

  // Figure & Design always uses the SVG generator — AI can't generate visual puzzles
  if (activeCategory === 'Figure & Design Reasoning') {
    const fig = generateFigureQuestion("", difficulty);
    return { ...fig, difficulty, category: 'Figure & Design Reasoning' } as Question;
  }

  // Try Gemini AI — skip local-only categories and skip if circuit breaker is active
  const apiKey = process.env.GEMINI_API_KEY;
  const geminiBlocked = Date.now() < geminiQuotaExhaustedUntil || Date.now() < gemini500BackoffUntil;
  if (apiKey && apiKey.trim() !== "" && !LOCAL_ONLY_CATEGORIES.has(activeCategory) && !geminiBlocked) {
    await geminiRateLimit();
    // Recheck after wait — a concurrent call may have tripped a breaker while we waited
    if (Date.now() > geminiQuotaExhaustedUntil && Date.now() > gemini500BackoffUntil) {
      console.log(`[AI] Requesting Gemini question — category: ${activeCategory}, difficulty: ${difficulty}`);
      try {
        const categoryGuide: Record<string, string> = {
          'Mental Ability':              'logical reasoning — number series, letter series, analogies, coding-decoding, odd-one-out',
          'Mathematics':                 'arithmetic — percentages, averages, fractions, LCM/HCF, ratios, simple algebra',
          'General Knowledge':           'world history, geography, science basics, famous inventions, Indian GK',
          'Science & Technology':        'modern science, space exploration, biology, physics, chemistry, AI, gadgets, recent discoveries',
          'Sports':                      'cricket, football, Olympics, famous athletes, sports records, rules of popular games',
          'Current Affairs & Fun Facts': 'trending world events, amazing facts, India news, record holders, nature wonders, interesting trivia',
          'Information Technology':      'programming languages, data structures, algorithms, networking, databases, cybersecurity, OS, web development, cloud computing',
          'AI Technology':               'machine learning, deep learning, neural networks, NLP, computer vision, generative AI, LLMs, ChatGPT, AI tools, AI ethics, AI companies',
          'Puzzle':                      'brain teasers — number sequences, word riddles, logic puzzles, math puzzles, cipher/code puzzles, pattern recognition, odd-one-out. Questions that require thinking, not memorized facts.',
        };
        const guide = categoryGuide[activeCategory] || activeCategory;
        const langNote = language === 'hi'
          ? 'Write the question and all options in Hindi only.'
          : language === 'bilingual'
          ? 'Write the question and options in both Hindi and English (bilingual format).'
          : 'Write the question and options in English.';

        const promptText = `You are an expert quiz master generating an engaging multiple-choice question for a student quiz battle game.

Category: ${activeCategory} (${guide})
Difficulty: ${difficulty === 'easy' ? 'easy — suitable for Class 5 students' : difficulty === 'medium' ? 'medium — suitable for Class 6-8 students' : 'hard — challenging, olympiad level'}
Language: ${langNote}

Rules:
- The question must be factually accurate and interesting.
- All 4 options must be plausible (no obviously wrong distractors).
- Vary the correct answer position (do not always make it "A").
- For Sports/Current Affairs, prefer questions about events from 2020 onwards.
- Keep questions concise (under 25 words if possible).

Return ONLY a valid JSON object — no markdown, no code blocks, no extra text:
{
  "question": "...",
  "type": "subcategory (e.g. Cricket, Space, Biology, History)",
  "options": ["option1", "option2", "option3", "option4"],
  "correctAnswer": "A",
  "explanation": "Brief explanation of why the answer is correct."
}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        let response: Response;
        try {
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { responseMimeType: 'application/json', temperature: 0.9 }
              }),
              signal: controller.signal
            }
          );
        } finally {
          clearTimeout(timeoutId);
        }

        const rawBody = await response.text();
        if (!response.ok) {
          if (response.status === 429) {
            geminiQuotaExhaustedUntil = Date.now() + 60 * 60 * 1000;
            gemini500Count = 0;
            console.warn('[AI] 🔴 Gemini quota exhausted — using local questions for 1 hour');
          } else if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 404) {
            geminiQuotaExhaustedUntil = Date.now() + 24 * 60 * 60 * 1000;
            gemini500Count = 0;
            console.warn(`[AI] 🔴 Gemini key invalid/expired (HTTP ${response.status}) — update GEMINI_API_KEY in .env`);
          } else if (response.status === 500 || response.status === 503) {
            gemini500Count++;
            if (gemini500Count >= 2) {
              gemini500BackoffUntil = Date.now() + 5 * 60 * 1000; // 5-minute pause
              gemini500Count = 0;
              console.warn(`[AI] 🟡 Gemini server error repeated — pausing AI for 5 minutes, using local questions`);
            } else {
              console.warn(`[AI] ⚠️  Gemini HTTP ${response.status} (${gemini500Count}/2) — falling back to local`);
            }
          } else {
            console.warn(`[AI] ⚠️  Gemini HTTP ${response.status} — ${rawBody.slice(0, 200)}`);
          }
        } else {
          let data: any;
          try { data = JSON.parse(rawBody); } catch { console.warn('[AI] ⚠️  Gemini body is not JSON:', rawBody.slice(0, 200)); }
          if (data) {
            const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!jsonText) {
              console.warn('[AI] ⚠️  No text in Gemini candidates:', JSON.stringify(data).slice(0, 300));
            } else {
              try {
                const parsed = JSON.parse(jsonText.trim());
                if (parsed.question && Array.isArray(parsed.options) && parsed.options.length === 4 && parsed.correctAnswer) {
                  gemini500Count = 0; // reset on success
                  console.log(`[AI] ✅ Gemini answered — "${parsed.question.slice(0, 70)}"`);
                  return {
                    question: parsed.question,
                    type: parsed.type || activeCategory,
                    difficulty,
                    options: parsed.options,
                    correctAnswer: parsed.correctAnswer as 'A' | 'B' | 'C' | 'D',
                    explanation: parsed.explanation || '',
                    category: activeCategory
                  };
                }
                console.warn('[AI] ⚠️  Parsed JSON missing fields:', JSON.stringify(parsed).slice(0, 200));
              } catch {
                console.warn('[AI] ⚠️  Failed to parse Gemini text as JSON:', jsonText.slice(0, 200));
              }
            }
          }
        }
      } catch (err: any) {
        gemini500Count++;
        if (gemini500Count >= 2) {
          gemini500BackoffUntil = Date.now() + 5 * 60 * 1000;
          gemini500Count = 0;
          console.warn('[AI] 🟡 Gemini unreachable — pausing AI for 5 minutes, using local questions');
        } else if (err?.name === 'AbortError') {
          console.warn('[AI] ⏱ Gemini timeout (5s) — falling back to local question');
        } else {
          console.warn(`[AI] ❌ Gemini call failed — using local fallback:`, err?.message);
        }
      }
    }
  }

  // Local fallback generators
  console.log(`[LOCAL] Using local question bank — category: ${activeCategory}`);
  if (activeCategory === 'Science & Technology')    return pickFromPool(SCIENCE_TECH_QUESTIONS, activeCategory, difficulty);
  if (activeCategory === 'Sports')                  return pickFromPool(SPORTS_QUESTIONS, activeCategory, difficulty);
  if (activeCategory === 'Current Affairs & Fun Facts') return pickFromPool(FUN_FACTS_QUESTIONS, activeCategory, difficulty);
  if (activeCategory === 'Information Technology')  return pickFromPool(IT_QUESTIONS, activeCategory, difficulty);
  if (activeCategory === 'AI Technology')           return pickFromPool(AI_TECH_QUESTIONS, activeCategory, difficulty);
  if (activeCategory === 'Puzzle')                  return pickFromPool(PUZZLE_QUESTIONS, 'Puzzle', difficulty);
  if (activeCategory === 'Mental Ability') {
    const q = generateLocalMentalAbility(difficulty);
    return { ...q, difficulty };
  }
  if (activeCategory === 'Mathematics') {
    const q = generateLocalMathematics(difficulty);
    return { ...q, difficulty };
  }
  // General Knowledge fallback
  return pickFromPool(LOCAL_GK_QUESTIONS as QItem[], 'General Knowledge', difficulty);
}
