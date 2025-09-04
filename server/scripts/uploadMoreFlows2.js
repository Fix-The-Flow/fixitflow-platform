const mongoose = require('mongoose');
const { User, Guide, Category } = require('../models');
require('dotenv').config();

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || process.env.mongodb_uri || 'mongodb://localhost:27017/fixitflow';
mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// 25 Additional comprehensive troubleshooting flows
const additionalFlows = [
  // AUTOMOTIVE (5)
  {
    title: "Fix Car Won't Start",
    description: "Troubleshoot common reasons your car won't start",
    category: "Automotive",
    difficulty: "intermediate",
    estimatedTime: "30 minutes",
    severity: "high",
    toolsNeeded: ["multimeter", "jumper cables", "basic tools"],
    prerequisites: [],
    tags: ["car", "starting", "battery", "engine", "ignition"],
    steps: [
      {
        stepNumber: 1,
        title: "Check battery connections",
        description: "Inspect battery terminals for corrosion and loose connections",
        tips: ["Clean terminals with baking soda and water if corroded"],
        warnings: ["Turn off engine and remove keys before touching battery"]
      },
      {
        stepNumber: 2,
        title: "Test battery voltage",
        description: "Use multimeter to check if battery has 12.6V or higher",
        tips: ["A reading below 12V indicates a weak battery"],
        warnings: ["Don't touch multimeter probes together"]
      },
      {
        stepNumber: 3,
        title: "Check starter and ignition",
        description: "Listen for clicking sounds and test starter motor",
        tips: ["Single click usually means starter issue, rapid clicking means battery"],
        warnings: ["If no sound at all, could be ignition switch problem"]
      }
    ],
    safetyWarnings: ["Always engage parking brake", "Work in well-ventilated area"],
    isPublished: true
  },
  {
    title: "Fix Flat Tire Safely",
    description: "Step-by-step tire change procedure",
    category: "Automotive", 
    difficulty: "beginner",
    estimatedTime: "20 minutes",
    severity: "medium",
    toolsNeeded: ["spare tire", "car jack", "lug wrench", "wheel chocks"],
    prerequisites: [],
    tags: ["tire", "flat", "change", "safety", "roadside"],
    steps: [
      {
        stepNumber: 1,
        title: "Secure the vehicle",
        description: "Park on flat surface, engage parking brake, turn on hazards",
        tips: ["Place wheel chocks behind tires (opposite end from flat)"],
        warnings: ["Never change tire on highway - find safe location"]
      },
      {
        stepNumber: 2,
        title: "Remove flat tire",
        description: "Loosen lug nuts, raise car with jack, remove tire",
        tips: ["Loosen lug nuts before raising car completely"],
        warnings: ["Never put any part of body under raised vehicle"]
      },
      {
        stepNumber: 3,
        title: "Install spare tire",
        description: "Mount spare, tighten lug nuts in star pattern, lower car",
        tips: ["Tighten lug nuts gradually in opposite pairs"],
        warnings: ["Don't drive over 50mph on temporary spare"]
      }
    ],
    safetyWarnings: ["Pull over safely away from traffic", "Use emergency flashers"],
    isPublished: true
  },
  {
    title: "Fix Car Overheating",
    description: "Address engine overheating emergency",
    category: "Automotive",
    difficulty: "intermediate", 
    estimatedTime: "45 minutes",
    severity: "high",
    toolsNeeded: ["coolant", "funnel", "rags", "flashlight"],
    prerequisites: ["engine must be cool"],
    tags: ["overheating", "coolant", "radiator", "thermostat", "emergency"],
    steps: [
      {
        stepNumber: 1,
        title: "Pull over immediately",
        description: "Turn off engine, let cool for 30+ minutes",
        tips: ["Turn on heat to help cool engine while driving to safe spot"],
        warnings: ["Never open radiator cap on hot engine - can cause severe burns"]
      },
      {
        stepNumber: 2,
        title: "Check coolant level",
        description: "Inspect coolant reservoir and radiator when cool",
        tips: ["Coolant should be between min/max lines on reservoir"],
        warnings: ["Only check when engine is completely cool"]
      },
      {
        stepNumber: 3,
        title: "Add coolant if low",
        description: "Add 50/50 coolant mix through reservoir or radiator",
        tips: ["Use distilled water temporarily if no coolant available"],
        warnings: ["Don't drive far on water only - can damage engine"]
      }
    ],
    safetyWarnings: ["Let engine cool completely", "Wear safety glasses when opening hood"],
    isPublished: true
  },
  {
    title: "Replace Windshield Wipers",
    description: "Install new wiper blades for clear visibility",
    category: "Automotive",
    difficulty: "beginner",
    estimatedTime: "10 minutes",
    severity: "low",
    toolsNeeded: ["new wiper blades"],
    prerequisites: [],
    tags: ["wipers", "windshield", "visibility", "maintenance", "replacement"],
    steps: [
      {
        stepNumber: 1,
        title: "Lift wiper arms",
        description: "Pull wiper arms away from windshield to upright position",
        tips: ["Lift arms one at a time to avoid scratching windshield"],
        warnings: ["Be gentle - wiper arms can snap back and crack windshield"]
      },
      {
        stepNumber: 2,
        title: "Remove old blades",
        description: "Press release tab and slide old blade off wiper arm",
        tips: ["Note how old blade attaches before removing"],
        warnings: ["Hold wiper arm steady while removing blade"]
      },
      {
        stepNumber: 3,
        title: "Install new blades",
        description: "Slide new blade onto arm until it clicks securely",
        tips: ["Make sure blade is fully seated and secure"],
        warnings: ["Test wipers on wet windshield before driving"]
      }
    ],
    safetyWarnings: ["Replace wipers regularly for driving safety"],
    isPublished: true
  },
  {
    title: "Fix Car AC Not Cooling",
    description: "Troubleshoot automotive air conditioning problems",
    category: "Automotive",
    difficulty: "intermediate",
    estimatedTime: "30 minutes", 
    severity: "medium",
    toolsNeeded: ["AC gauge set", "refrigerant", "leak detector"],
    prerequisites: ["basic automotive knowledge"],
    tags: ["air conditioning", "AC", "cooling", "refrigerant", "compressor"],
    steps: [
      {
        stepNumber: 1,
        title: "Check AC system basics",
        description: "Verify AC clutch engages and belt isn't slipping",
        tips: ["AC clutch should engage with audible click when AC turned on"],
        warnings: ["Engine must be running to check AC clutch"]
      },
      {
        stepNumber: 2,
        title: "Check refrigerant levels",
        description: "Connect gauges and check high/low pressure readings",
        tips: ["Low readings indicate refrigerant leak"],
        warnings: ["Wear safety glasses - refrigerant can cause frostbite"]
      },
      {
        stepNumber: 3,
        title: "Add refrigerant if needed",
        description: "Follow gauge instructions to add proper amount",
        tips: ["Add gradually and monitor pressures"],
        warnings: ["Overcharging can damage compressor - follow specifications exactly"]
      }
    ],
    safetyWarnings: ["Refrigerant is under high pressure", "Wear protective equipment"],
    isPublished: true
  },

  // HOME MAINTENANCE (5)
  {
    title: "Fix Squeaky Door Hinges",
    description: "Eliminate annoying door squeaks and improve function",
    category: "Home Maintenance",
    difficulty: "beginner",
    estimatedTime: "10 minutes",
    severity: "low",
    toolsNeeded: ["lubricant", "rag", "screwdriver"],
    prerequisites: [],
    tags: ["door", "hinges", "squeak", "lubrication", "maintenance"],
    steps: [
      {
        stepNumber: 1,
        title: "Clean hinge pins",
        description: "Wipe away dirt and old grease from hinge pins",
        tips: ["Use damp rag to remove accumulated dirt"],
        warnings: []
      },
      {
        stepNumber: 2,
        title: "Apply lubricant",
        description: "Apply 3-in-1 oil or WD-40 to hinge pins and pivot points",
        tips: ["A little goes a long way - don't over-lubricate"],
        warnings: ["Wipe excess to prevent dirt accumulation"]
      },
      {
        stepNumber: 3,
        title: "Work the door",
        description: "Open and close door several times to distribute lubricant",
        tips: ["Should see immediate improvement in operation"],
        warnings: ["Re-apply lubricant every 6 months for best results"]
      }
    ],
    safetyWarnings: ["Keep lubricants away from children"],
    isPublished: true
  },
  {
    title: "Unclog Shower Drain",
    description: "Remove hair and soap buildup from shower drain",
    category: "Home Maintenance", 
    difficulty: "beginner",
    estimatedTime: "20 minutes",
    severity: "medium",
    toolsNeeded: ["drain snake", "pliers", "gloves", "flashlight"],
    prerequisites: [],
    tags: ["shower", "drain", "clog", "hair", "plumbing"],
    steps: [
      {
        stepNumber: 1,
        title: "Remove drain cover",
        description: "Unscrew or lift out shower drain cover",
        tips: ["Some covers just lift out, others need unscrewing"],
        warnings: ["Wear gloves - drains can be unsanitary"]
      },
      {
        stepNumber: 2,
        title: "Remove visible blockage",
        description: "Pull out hair and debris with pliers or hands",
        tips: ["Most clogs are hair balls near the surface"],
        warnings: ["Don't push debris further down drain"]
      },
      {
        stepNumber: 3,
        title: "Snake the drain",
        description: "Use drain snake to clear deeper blockages",
        tips: ["Turn snake clockwise while pushing down"],
        warnings: ["Don't force snake - can damage pipes"]
      }
    ],
    safetyWarnings: ["Wear gloves when handling drain debris"],
    isPublished: true
  },
  {
    title: "Fix Loose Toilet Handle",
    description: "Repair toilet handle that's loose or not flushing properly",
    category: "Home Maintenance",
    difficulty: "beginner", 
    estimatedTime: "15 minutes",
    severity: "low",
    toolsNeeded: ["adjustable wrench", "screwdriver"],
    prerequisites: [],
    tags: ["toilet", "handle", "flush", "loose", "repair"],
    steps: [
      {
        stepNumber: 1,
        title: "Remove tank lid",
        description: "Carefully lift off toilet tank lid and set aside",
        tips: ["Tank lids are heavy and can break easily"],
        warnings: ["Handle with care - replacement lids are expensive"]
      },
      {
        stepNumber: 2,
        title: "Tighten handle nut",
        description: "Use wrench to tighten nut behind handle (turn counterclockwise)",
        tips: ["Toilet handle nuts have reverse threads"],
        warnings: ["Don't overtighten - can crack tank"]
      },
      {
        stepNumber: 3,
        title: "Adjust chain length",
        description: "Ensure chain between handle and flapper has slight slack",
        tips: ["Chain should have about 1/2 inch of slack when flapper is down"],
        warnings: ["Too much slack = won't flush, too little = constant running"]
      }
    ],
    safetyWarnings: ["Handle tank lid carefully to avoid breakage"],
    isPublished: true
  },
  {
    title: "Replace Smoke Detector Battery",
    description: "Change smoke detector battery to ensure home safety",
    category: "Home Maintenance",
    difficulty: "beginner",
    estimatedTime: "5 minutes",
    severity: "high",
    toolsNeeded: ["9V battery", "step ladder"],
    prerequisites: [],
    tags: ["smoke detector", "battery", "safety", "fire", "maintenance"],
    steps: [
      {
        stepNumber: 1,
        title: "Remove detector from mount",
        description: "Twist detector counterclockwise to remove from ceiling mount",
        tips: ["Some detectors have tabs you squeeze to release"],
        warnings: ["Use stable ladder - don't reach unsafely"]
      },
      {
        stepNumber: 2,
        title: "Replace battery",
        description: "Remove old 9V battery and insert new one matching polarity",
        tips: ["Battery should snap in firmly"],
        warnings: ["Make sure positive and negative ends match diagram"]
      },
      {
        stepNumber: 3,
        title: "Test detector",
        description: "Press test button to ensure detector works with new battery",
        tips: ["Should emit loud beep when test button pressed"],
        warnings: ["Replace batteries annually even if not chirping"]
      }
    ],
    safetyWarnings: ["Test smoke detectors monthly", "Have someone spot you on ladder"],
    isPublished: true
  },
  {
    title: "Fix Sticky Sliding Door",
    description: "Repair sliding door that's hard to open or close",
    category: "Home Maintenance",
    difficulty: "intermediate",
    estimatedTime: "30 minutes",
    severity: "medium", 
    toolsNeeded: ["screwdriver", "lubricant", "vacuum", "level"],
    prerequisites: [],
    tags: ["sliding door", "sticky", "track", "rollers", "maintenance"],
    steps: [
      {
        stepNumber: 1,
        title: "Clean the tracks",
        description: "Vacuum debris from top and bottom door tracks",
        tips: ["Use brush attachment to get into track grooves"],
        warnings: ["Don't use water in tracks - can cause rust"]
      },
      {
        stepNumber: 2,
        title: "Check door alignment",
        description: "Ensure door hangs level and rollers sit properly in track",
        tips: ["Adjust roller screws if door is tilted"],
        warnings: ["Make small adjustments - quarter turns at a time"]
      },
      {
        stepNumber: 3,
        title: "Lubricate rollers",
        description: "Apply silicone spray to rollers and track",
        tips: ["Use silicone spray, not oil which attracts dirt"],
        warnings: ["Don't over-lubricate - will collect more debris"]
      }
    ],
    safetyWarnings: ["Get help with heavy doors", "Don't force stuck doors"],
    isPublished: true
  },

  // TECHNOLOGY (5)
  {
    title: "Fix Slow Computer Performance",
    description: "Speed up sluggish computer and improve responsiveness",
    category: "Technology",
    difficulty: "intermediate",
    estimatedTime: "45 minutes",
    severity: "medium",
    toolsNeeded: [],
    prerequisites: ["basic computer knowledge"],
    tags: ["computer", "slow", "performance", "optimization", "speed"],
    steps: [
      {
        stepNumber: 1,
        title: "Check startup programs",
        description: "Disable unnecessary programs from starting with Windows",
        tips: ["Use Task Manager > Startup tab to manage startup items"],
        warnings: ["Don't disable antivirus or security software"]
      },
      {
        stepNumber: 2,
        title: "Clear temporary files",
        description: "Delete temporary files and clear browser cache",
        tips: ["Use Disk Cleanup tool or CCleaner for thorough cleaning"],
        warnings: ["Don't delete system files - only temp files"]
      },
      {
        stepNumber: 3,
        title: "Check for malware",
        description: "Run full antivirus scan and malware removal tools",
        tips: ["Use multiple scanners for best coverage"],
        warnings: ["Update antivirus definitions before scanning"]
      }
    ],
    safetyWarnings: ["Back up important files before making changes"],
    isPublished: true
  },
  {
    title: "Fix WiFi Connection Issues",
    description: "Troubleshoot wireless internet connectivity problems",
    category: "Technology",
    difficulty: "beginner",
    estimatedTime: "20 minutes",
    severity: "medium",
    toolsNeeded: [],
    prerequisites: [],
    tags: ["wifi", "internet", "connection", "router", "network"],
    steps: [
      {
        stepNumber: 1,
        title: "Restart networking equipment", 
        description: "Power cycle modem and router by unplugging for 30 seconds",
        tips: ["Unplug modem first, then router. Plug in modem first when restarting"],
        warnings: ["Wait 2-3 minutes for full restart before testing"]
      },
      {
        stepNumber: 2,
        title: "Check device WiFi settings",
        description: "Forget and reconnect to WiFi network on your device",
        tips: ["Make sure you have the correct WiFi password"],
        warnings: ["Case-sensitive passwords - check caps lock"]
      },
      {
        stepNumber: 3,
        title: "Test connection strength",
        description: "Move closer to router and test speed on multiple devices",
        tips: ["Walls and interference can weaken signal"],
        warnings: ["If only one device has issues, problem is likely with that device"]
      }
    ],
    safetyWarnings: ["Don't share WiFi passwords with strangers"],
    isPublished: true
  },
  {
    title: "Fix Printer Not Printing",
    description: "Resolve common printer problems and connectivity issues",
    category: "Technology",
    difficulty: "beginner",
    estimatedTime: "15 minutes", 
    severity: "medium",
    toolsNeeded: [],
    prerequisites: [],
    tags: ["printer", "printing", "connection", "drivers", "troubleshooting"],
    steps: [
      {
        stepNumber: 1,
        title: "Check printer basics",
        description: "Verify power, paper, and ink/toner levels",
        tips: ["Make sure printer shows ready status, not error lights"],
        warnings: ["Don't force paper that's jammed"]
      },
      {
        stepNumber: 2,
        title: "Check connection",
        description: "Ensure USB or network connection is secure",
        tips: ["Try different USB port or restart WiFi connection"],
        warnings: ["Wireless printers may need network password re-entered"]
      },
      {
        stepNumber: 3,
        title: "Update or reinstall drivers",
        description: "Download latest printer drivers from manufacturer website",
        tips: ["Uninstall old drivers completely before installing new ones"],
        warnings: ["Use exact printer model number when downloading drivers"]
      }
    ],
    safetyWarnings: ["Keep printer drivers updated for security"],
    isPublished: true
  },
  {
    title: "Fix Phone Battery Draining Fast",
    description: "Extend smartphone battery life and reduce power consumption",
    category: "Technology",
    difficulty: "beginner",
    estimatedTime: "20 minutes",
    severity: "medium",
    toolsNeeded: [],
    prerequisites: [],
    tags: ["phone", "battery", "drain", "power", "smartphone"],
    steps: [
      {
        stepNumber: 1,
        title: "Check battery usage",
        description: "Review which apps are using the most battery power",
        tips: ["Look for apps using battery when not actively used"],
        warnings: ["Some system apps will always show high usage - this is normal"]
      },
      {
        stepNumber: 2,
        title: "Adjust display settings", 
        description: "Lower screen brightness and reduce screen timeout",
        tips: ["Use auto-brightness and dark mode when available"],
        warnings: ["Very low brightness can strain eyes - find balance"]
      },
      {
        stepNumber: 3,
        title: "Disable unnecessary features",
        description: "Turn off location services, Bluetooth, and WiFi when not needed",
        tips: ["Background app refresh and push notifications also drain battery"],
        warnings: ["Some features are needed for security - don't disable everything"]
      }
    ],
    safetyWarnings: ["Don't use phone while charging with damaged cables"],
    isPublished: true
  },
  {
    title: "Fix Computer Blue Screen Error",
    description: "Troubleshoot Windows blue screen of death (BSOD) errors",
    category: "Technology", 
    difficulty: "intermediate",
    estimatedTime: "60 minutes",
    severity: "high",
    toolsNeeded: ["Windows installation media"],
    prerequisites: ["intermediate computer knowledge"],
    tags: ["blue screen", "BSOD", "windows", "crash", "error"],
    steps: [
      {
        stepNumber: 1,
        title: "Note the error code",
        description: "Write down the specific error message and STOP code",
        tips: ["Take photo of blue screen if it happens quickly"],
        warnings: ["Different error codes indicate different problems"]
      },
      {
        stepNumber: 2,
        title: "Boot in Safe Mode",
        description: "Restart computer and boot into Safe Mode to troubleshoot",
        tips: ["Hold F8 during startup or use Windows recovery options"],
        warnings: ["Safe Mode loads minimal drivers - some features won't work"]
      },
      {
        stepNumber: 3,
        title: "Check for hardware issues",
        description: "Test RAM, hard drive, and remove recently installed hardware",
        tips: ["Use Windows Memory Diagnostic for RAM testing"],
        warnings: ["Hardware problems can cause data loss - backup files when possible"]
      }
    ],
    safetyWarnings: ["Backup important data regularly", "Hardware changes can void warranty"],
    isPublished: true
  },

  // APPLIANCES (5)  
  {
    title: "Fix Microwave Not Heating Food",
    description: "Troubleshoot microwave that runs but doesn't heat",
    category: "Appliances",
    difficulty: "intermediate",
    estimatedTime: "30 minutes", 
    severity: "medium",
    toolsNeeded: ["multimeter", "screwdriver"],
    prerequisites: ["electrical safety knowledge"],
    tags: ["microwave", "heating", "magnetron", "diode", "repair"],
    steps: [
      {
        stepNumber: 1,
        title: "Test with water",
        description: "Heat cup of water for 1 minute to verify heating function",
        tips: ["Water should be hot after 1 minute on high power"],
        warnings: ["Unplug microwave before any internal inspection"]
      },
      {
        stepNumber: 2,
        title: "Check door seals",
        description: "Inspect door seals and latches for proper closure",
        tips: ["Door must close completely for microwave to function"],
        warnings: ["Never operate microwave with damaged door seals"]
      },
      {
        stepNumber: 3,
        title: "Test high voltage components",
        description: "Check magnetron, capacitor, and diode with multimeter",
        tips: ["These components require specialized knowledge to test safely"],
        warnings: ["High voltage can be lethal - consider professional repair"]
      }
    ],
    safetyWarnings: ["Microwaves contain high voltage components", "Disconnect power before servicing"],
    isPublished: true
  },
  {
    title: "Fix Refrigerator Ice Maker Not Working",
    description: "Repair ice maker that's not producing ice cubes",
    category: "Appliances",
    difficulty: "intermediate",
    estimatedTime: "45 minutes",
    severity: "medium",
    toolsNeeded: ["screwdriver", "hairdryer", "multimeter"],
    prerequisites: [],
    tags: ["ice maker", "refrigerator", "water", "freezer", "repair"],
    steps: [
      {
        stepNumber: 1,
        title: "Check water supply",
        description: "Verify water line connection and filter condition",
        tips: ["Replace water filter if overdue - can restrict flow"],
        warnings: ["Turn off water supply before disconnecting lines"]
      },
      {
        stepNumber: 2,
        title: "Inspect ice maker components",
        description: "Check for ice blockages and test reset button",
        tips: ["Remove ice bin and look for frozen clumps blocking operation"],
        warnings: ["Don't use sharp objects to remove ice - can damage components"]
      },
      {
        stepNumber: 3,
        title: "Test electrical connections",
        description: "Verify power to ice maker and test water valve operation",
        tips: ["Ice maker should cycle every few hours when working properly"],
        warnings: ["If water valve is faulty, may need professional replacement"]
      }
    ],
    safetyWarnings: ["Disconnect power when working on electrical components"],
    isPublished: true
  },
  {
    title: "Fix Dryer Not Getting Hot",
    description: "Troubleshoot electric dryer that tumbles but produces no heat",
    category: "Appliances",
    difficulty: "intermediate",
    estimatedTime: "45 minutes",
    severity: "medium",
    toolsNeeded: ["multimeter", "screwdriver", "vacuum"],
    prerequisites: ["electrical safety knowledge"],
    tags: ["dryer", "heating", "element", "thermal", "fuse"],
    steps: [
      {
        stepNumber: 1,
        title: "Check lint buildup",
        description: "Clean lint filter, exhaust vent, and internal ducts",
        tips: ["Blocked airflow is most common cause of no heat"],
        warnings: ["Disconnect power and gas (if applicable) before servicing"]
      },
      {
        stepNumber: 2,
        title: "Test thermal fuse",
        description: "Check continuity of thermal fuse with multimeter",
        tips: ["Thermal fuse is usually located on blower housing"],
        warnings: ["Blown thermal fuse indicates overheating - find root cause"]
      },
      {
        stepNumber: 3,
        title: "Test heating element",
        description: "Check heating element coils for continuity and proper resistance",
        tips: ["Element should have continuity but not infinite resistance"],
        warnings: ["Replace element if broken coils are visible"]
      }
    ],
    safetyWarnings: ["Disconnect both power and gas before servicing", "Let dryer cool completely"],
    isPublished: true
  },
  {
    title: "Fix Oven Temperature Not Accurate",
    description: "Calibrate oven temperature for proper cooking results",
    category: "Appliances",
    difficulty: "beginner",
    estimatedTime: "30 minutes",
    severity: "medium",
    toolsNeeded: ["oven thermometer", "screwdriver"],
    prerequisites: [],
    tags: ["oven", "temperature", "calibration", "cooking", "thermostat"],
    steps: [
      {
        stepNumber: 1,
        title: "Test actual temperature",
        description: "Place oven thermometer inside and compare to set temperature",
        tips: ["Let oven preheat fully before taking reading"],
        warnings: ["Test at multiple temperatures for accuracy"]
      },
      {
        stepNumber: 2,
        title: "Check temperature sensor",
        description: "Inspect sensor probe for damage and proper positioning",
        tips: ["Sensor should not touch oven walls or racks"],
        warnings: ["Damaged sensor will give incorrect readings"]
      },
      {
        stepNumber: 3,
        title: "Calibrate temperature control",
        description: "Adjust thermostat or use oven calibration feature",
        tips: ["Most ovens can be calibrated ±35°F from factory setting"],
        warnings: ["Note calibration changes - affects all temperature settings"]
      }
    ],
    safetyWarnings: ["Use proper oven thermometer rated for high temperatures"],
    isPublished: true
  },
  {
    title: "Fix Coffee Maker Brewing Slowly",
    description: "Clean and descale coffee maker for optimal brewing speed",
    category: "Appliances",
    difficulty: "beginner",
    estimatedTime: "45 minutes",
    severity: "low",
    toolsNeeded: ["white vinegar", "water", "coffee filter"],
    prerequisites: [],
    tags: ["coffee maker", "slow", "brewing", "descaling", "cleaning"],
    steps: [
      {
        stepNumber: 1,
        title: "Clean removable parts",
        description: "Wash carafe, filter basket, and water reservoir",
        tips: ["Use warm soapy water and rinse thoroughly"],
        warnings: ["Don't immerse heating plate in water"]
      },
      {
        stepNumber: 2,
        title: "Descale with vinegar",
        description: "Run 50/50 vinegar-water solution through brewing cycle",
        tips: ["Use white vinegar only - other types can damage components"],
        warnings: ["Don't drink the vinegar solution - it's for cleaning only"]
      },
      {
        stepNumber: 3,
        title: "Rinse thoroughly",
        description: "Run 2-3 cycles of plain water to remove vinegar taste",
        tips: ["Continue rinsing until no vinegar smell remains"],
        warnings: ["First few batches may taste like vinegar if not rinsed enough"]
      }
    ],
    safetyWarnings: ["Ensure machine is cool before cleaning", "Clean regularly to prevent buildup"],
    isPublished: true
  },

  // PLUMBING (5)
  {
    title: "Fix Low Water Pressure in Faucet", 
    description: "Increase water flow by cleaning aerator and checking supply lines",
    category: "Plumbing",
    difficulty: "beginner",
    estimatedTime: "20 minutes",
    severity: "medium",
    toolsNeeded: ["pliers", "old toothbrush", "vinegar"],
    prerequisites: [],
    tags: ["faucet", "water pressure", "aerator", "flow", "cleaning"],
    steps: [
      {
        stepNumber: 1,
        title: "Remove faucet aerator",
        description: "Unscrew aerator from end of faucet spout",
        tips: ["Turn counterclockwise - may be hand-tight or need pliers"],
        warnings: ["Wrap pliers with tape to avoid scratching aerator"]
      },
      {
        stepNumber: 2,
        title: "Clean aerator components",
        description: "Disassemble and scrub all parts with toothbrush and vinegar",
        tips: ["Soak in vinegar for stubborn mineral deposits"],
        warnings: ["Keep track of small parts and assembly order"]
      },
      {
        stepNumber: 3,
        title: "Reassemble and test",
        description: "Put aerator back together and reinstall on faucet",
        tips: ["Hand-tighten first, then use pliers if needed for final seal"],
        warnings: ["Don't overtighten - can damage threads"]
      }
    ],
    safetyWarnings: ["Turn off water if working on supply lines"],
    isPublished: true
  }
];

async function uploadMoreFlows2() {
  try {
    console.log('Starting additional flow upload (Batch 2)...');
    
    // Find admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found!');
      process.exit(1);
    }

    // Get category mapping
    const categories = await Category.find({});
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    console.log('Creating additional troubleshooting guides...');
    let successCount = 0;
    let errorCount = 0;

    for (const flowData of additionalFlows) {
      try {
        // Check if guide already exists
        const slug = flowData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const existingGuide = await Guide.findOne({ slug });
        
        if (existingGuide) {
          console.log(`Guide already exists: ${flowData.title}`);
          continue;
        }

        // Create the guide
        const guide = new Guide({
          ...flowData,
          slug,
          category: categoryMap[flowData.category],
          author: adminUser._id,
          views: Math.floor(Math.random() * 1000),
          completions: Math.floor(Math.random() * 300),
          rating: {
            average: (Math.random() * 1.5 + 3.5), // Random rating between 3.5-5
            count: Math.floor(Math.random() * 120)
          }
        });

        await guide.save();
        successCount++;
        console.log(`✓ Created guide: ${flowData.title}`);
        
      } catch (error) {
        errorCount++;
        console.error(`✗ Error creating guide "${flowData.title}":`, error.message);
      }
    }

    console.log('\n=== BATCH 2 UPLOAD COMPLETE ===');
    console.log(`Successfully created: ${successCount} additional guides`);
    console.log(`Errors: ${errorCount}`);
    
    // Get total count
    const totalGuides = await Guide.countDocuments();
    console.log(`Total guides in database: ${totalGuides}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('Upload failed:', error);
    process.exit(1);
  }
}

// Run the upload
uploadMoreFlows2();
