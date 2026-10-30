import { COMPLAINT_STATUS, PRIORITIES } from '../utils/constants';

export const INITIAL_COMPLAINTS = [
  {
    id: 'BLR-2025-0101',
    title: 'Severe crater-like potholes on 100 Feet Road',
    category: 'Roads & Infrastructure',
    departmentId: 'DEP-RDS',
    department: 'Roads & Infrastructure',
    citizenId: 'CIT001',
    citizenName: 'Aarav Sharma',
    citizenPhone: '+91 98450 12345',
    location: 'Indiranagar 100 Feet Rd, near 12th Main junction, Ward 80',
    ward: 'Ward 80 - Hoysala Nagar',
    coordinates: { lat: 12.9719, lng: 77.6412 },
    description: 'Two massive potholes in the center of the lane right before the signal. Several two-wheelers have skidded in the rain. Water is accumulating, making them invisible at night.',
    priority: PRIORITIES.HIGH,
    status: COMPLAINT_STATUS.WORK_IN_PROGRESS,
    submittedAt: '2025-02-26T09:30:00Z',
    slaDeadline: '2025-03-01T09:30:00Z',
    supporters: ['CIT001', 'CIT002', 'CIT003', 'CIT004', 'CIT005'],
    supporterCount: 28,
    assignedWorkerId: 'WRK001',
    assignedWorkerName: 'Ramesh Nayak',
    evidence: [
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop&q=80'
    ],
    resolutionEvidence: {
      beforePhotos: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80'],
      afterPhotos: [],
      completionNotes: 'Crew dispatched with cold-mix asphalt. Initial leveling completed, final hot compaction scheduled.',
      completedAt: null
    },
    transfers: [],
    timeline: [
      {
        id: 'tl-1',
        status: COMPLAINT_STATUS.SUBMITTED,
        title: 'Complaint Registered',
        description: 'Citizen Aarav Sharma registered the complaint with photographic evidence.',
        timestamp: '2025-02-26T09:30:00Z',
        author: 'Aarav Sharma',
        role: 'Citizen'
      },
      {
        id: 'tl-2',
        status: COMPLAINT_STATUS.ACKNOWLEDGED,
        title: 'Officer Acknowledged',
        description: 'Assigned priority High based on road classification and hazard level.',
        timestamp: '2025-02-26T11:15:00Z',
        author: 'Rajesh Kulkarni',
        role: 'Department Officer'
      },
      {
        id: 'tl-3',
        status: COMPLAINT_STATUS.WORKER_ASSIGNED,
        title: 'Field Worker Assigned',
        description: 'Assigned to Senior Road Maintenance Lead Ramesh Nayak.',
        timestamp: '2025-02-26T14:00:00Z',
        author: 'Rajesh Kulkarni',
        role: 'Department Officer'
      },
      {
        id: 'tl-4',
        status: COMPLAINT_STATUS.WORK_IN_PROGRESS,
        title: 'Inspection Completed & Repair Commenced',
        description: 'Worker inspected site with barricades. Sub-base aggregate laid down.',
        timestamp: '2025-02-27T08:30:00Z',
        author: 'Ramesh Nayak',
        role: 'Field Worker'
      }
    ],
    escalation: null
  },
  {
    id: 'BLR-2025-0102',
    title: 'Major main line water pipe burst and road flooding',
    category: 'Water Supply',
    departmentId: 'DEP-WTR',
    department: 'Water Supply',
    citizenId: 'CIT002',
    citizenName: 'Meera Krishnan',
    citizenPhone: '+91 98451 98765',
    location: 'Koramangala 4th Block, 80 Feet Road, opposite Sony Signal',
    ward: 'Ward 151 - Koramangala',
    coordinates: { lat: 12.9345, lng: 77.6253 },
    description: 'Clear potable water gushing onto the asphalt from BWSSB underground feeder line since 5:00 AM. Traffic is backed up, thousands of liters wasted.',
    priority: PRIORITIES.CRITICAL,
    status: COMPLAINT_STATUS.INSPECTION,
    submittedAt: '2025-02-27T06:10:00Z',
    slaDeadline: '2025-02-28T06:10:00Z',
    supporters: ['CIT002', 'CIT001'],
    supporterCount: 42,
    assignedWorkerId: 'WRK003',
    assignedWorkerName: 'Santosh Kumar',
    evidence: [
      'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=600&auto=format&fit=crop&q=80'
    ],
    resolutionEvidence: {
      beforePhotos: ['https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=600&auto=format&fit=crop&q=80'],
      afterPhotos: [],
      completionNotes: '',
      completedAt: null
    },
    transfers: [],
    timeline: [
      {
        id: 'tl-10',
        status: COMPLAINT_STATUS.SUBMITTED,
        title: 'Complaint Logged',
        description: 'Emergency water leakage reported by citizen Meera Krishnan.',
        timestamp: '2025-02-27T06:10:00Z',
        author: 'Meera Krishnan',
        role: 'Citizen'
      },
      {
        id: 'tl-11',
        status: COMPLAINT_STATUS.ACKNOWLEDGED,
        title: 'Acknowledged as Critical Priority',
        description: 'Valve shut-off team alerted.',
        timestamp: '2025-02-27T06:45:00Z',
        author: 'Sunita Deshmukh',
        role: 'Department Officer'
      },
      {
        id: 'tl-12',
        status: COMPLAINT_STATUS.INSPECTION,
        title: 'On-site Pressure Isolation',
        description: 'Santosh Kumar arrived at location with emergency clamp fittings.',
        timestamp: '2025-02-27T07:30:00Z',
        author: 'Santosh Kumar',
        role: 'Field Worker'
      }
    ],
    escalation: null
  },
  {
    id: 'BLR-2025-0103',
    title: 'Illegal garbage dumping on vacant plot near school',
    category: 'Sanitation & Solid Waste',
    departmentId: 'DEP-SAN',
    department: 'Sanitation & Solid Waste',
    citizenId: 'CIT001',
    citizenName: 'Aarav Sharma',
    citizenPhone: '+91 98450 12345',
    location: 'HSR Layout Sector 2, 19th Main, near National Public School',
    ward: 'Ward 174 - HSR Layout',
    coordinates: { lat: 12.9116, lng: 77.6389 },
    description: 'Black spot created over the past week with commercial plastic waste and food debris rotting. Stray dogs and foul smell affecting schoolchildren.',
    priority: PRIORITIES.MEDIUM,
    status: COMPLAINT_STATUS.VERIFICATION,
    submittedAt: '2025-02-24T10:00:00Z',
    slaDeadline: '2025-02-25T10:00:00Z',
    supporters: ['CIT001', 'CIT003'],
    supporterCount: 15,
    assignedWorkerId: 'WRK005',
    assignedWorkerName: 'Suresh Babu',
    evidence: [
      'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80'
    ],
    resolutionEvidence: {
      beforePhotos: ['https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80'],
      afterPhotos: ['https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80'],
      completionNotes: 'Waste cleared using hydraulic compactor truck. Lime powder bleaching applied to prevent vector breeding. Warning sign erected.',
      completedAt: '2025-02-26T16:00:00Z'
    },
    transfers: [],
    timeline: [
      {
        id: 'tl-20',
        status: COMPLAINT_STATUS.SUBMITTED,
        title: 'Complaint Registered',
        description: 'Reported by Aarav Sharma.',
        timestamp: '2025-02-24T10:00:00Z',
        author: 'Aarav Sharma',
        role: 'Citizen'
      },
      {
        id: 'tl-21',
        status: COMPLAINT_STATUS.WORKER_ASSIGNED,
        title: 'Assigned to SWM Crew',
        description: 'Assigned to Suresh Babu with Compactor #14.',
        timestamp: '2025-02-24T13:30:00Z',
        author: 'Anand Murthy',
        role: 'Department Officer'
      },
      {
        id: 'tl-22',
        status: COMPLAINT_STATUS.VERIFICATION,
        title: 'Work Completed & Awaiting Verification',
        description: 'Crew cleared 2.4 tonnes of garbage. Submitted before & after proof.',
        timestamp: '2025-02-26T16:00:00Z',
        author: 'Suresh Babu',
        role: 'Field Worker'
      }
    ],
    escalation: null
  },
  {
    id: 'BLR-2025-0104',
    title: 'Footpath collapsed & paving stones removed due to trenching',
    category: 'Roads & Infrastructure',
    departmentId: 'DEP-RDS',
    department: 'Roads & Infrastructure',
    citizenId: 'CIT001',
    citizenName: 'Aarav Sharma',
    citizenPhone: '+91 98450 12345',
    location: 'Jayanagar 4th Block, 9th Main, opposite Post Office',
    ward: 'Ward 153 - Jayanagar',
    coordinates: { lat: 12.9299, lng: 77.5824 },
    description: 'Originally reported to BWSSB Water Supply assuming water pipe damage, but inspection showed unauthorized optical fiber trenching destroyed BBMP concrete pedestrian walkway.',
    priority: PRIORITIES.HIGH,
    status: COMPLAINT_STATUS.TRANSFERRED,
    submittedAt: '2025-02-25T14:20:00Z',
    slaDeadline: '2025-02-28T14:20:00Z',
    supporters: ['CIT001'],
    supporterCount: 19,
    assignedWorkerId: null,
    assignedWorkerName: null,
    evidence: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600&auto=format&fit=crop&q=80'
    ],
    resolutionEvidence: null,
    transfers: [
      {
        id: 'tr-01',
        fromDepartmentId: 'DEP-WTR',
        fromDepartmentName: 'Water Supply',
        toDepartmentId: 'DEP-RDS',
        toDepartmentName: 'Roads & Infrastructure',
        transferredBy: 'Sunita Deshmukh',
        reason: 'No water pipe burst or BWSSB asset damage detected. Pavement caved in due to third-party telecommunication duct digging. Pertains directly to BBMP Road Infrastructure division.',
        timestamp: '2025-02-26T11:00:00Z'
      }
    ],
    timeline: [
      {
        id: 'tl-30',
        status: COMPLAINT_STATUS.SUBMITTED,
        title: 'Submitted to Water Supply',
        description: 'Citizen suspected underground water erosion.',
        timestamp: '2025-02-25T14:20:00Z',
        author: 'Aarav Sharma',
        role: 'Citizen'
      },
      {
        id: 'tl-31',
        status: COMPLAINT_STATUS.TRANSFERRED,
        title: 'Inter-Department Transfer Executed',
        description: 'Transferred by BWSSB Officer Sunita Deshmukh to Roads & Infrastructure with reason: Road trenching damage.',
        timestamp: '2025-02-26T11:00:00Z',
        author: 'Sunita Deshmukh',
        role: 'Department Officer'
      }
    ],
    escalation: null
  },
  {
    id: 'BLR-2025-0105',
    title: 'Series of 8 streetlights dark for one week on residential stretch',
    category: 'Street Lighting',
    departmentId: 'DEP-LGT',
    department: 'Street Lighting',
    citizenId: 'CIT003',
    citizenName: 'Vikramaditya Roy',
    citizenPhone: '+91 97400 33211',
    location: 'Whitefield, Inner Circle Road, Near Whitefield Club',
    ward: 'Ward 84 - Hagadur',
    coordinates: { lat: 12.9698, lng: 77.7499 },
    description: 'Entire 400m stretch is pitch black after 6:30 PM. Women commuters feel unsafe walking from metro station to apartments.',
    priority: PRIORITIES.HIGH,
    status: COMPLAINT_STATUS.RESOLVED,
    submittedAt: '2025-02-22T19:00:00Z',
    slaDeadline: '2025-02-24T19:00:00Z',
    supporters: ['CIT003', 'CIT002', 'CIT001'],
    supporterCount: 31,
    assignedWorkerId: 'WRK004',
    assignedWorkerName: 'Manjunath Reddy',
    evidence: [
      'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80'
    ],
    resolutionEvidence: {
      beforePhotos: ['https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80'],
      afterPhotos: ['https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=600&auto=format&fit=crop&q=80'],
      completionNotes: 'Replaced faulty automatic astronomical timer switch and burnt miniature circuit breaker in BESCOM feeder pillar #8B. All 8 LED luminaires tested operational.',
      completedAt: '2025-02-24T14:30:00Z'
    },
    transfers: [],
    timeline: [
      {
        id: 'tl-40',
        status: COMPLAINT_STATUS.SUBMITTED,
        title: 'Reported by Citizen',
        description: 'Dark stretch reported on Inner Circle Road.',
        timestamp: '2025-02-22T19:00:00Z',
        author: 'Vikramaditya Roy',
        role: 'Citizen'
      },
      {
        id: 'tl-41',
        status: COMPLAINT_STATUS.WORKER_ASSIGNED,
        title: 'Assigned to Lighting Technician',
        description: 'Assigned to Manjunath Reddy.',
        timestamp: '2025-02-23T09:15:00Z',
        author: 'Deepak Varma',
        role: 'Department Officer'
      },
      {
        id: 'tl-42',
        status: COMPLAINT_STATUS.RESOLVED,
        title: 'Repairs Completed & Tested',
        description: 'Timer replaced. Street lighting fully restored.',
        timestamp: '2025-02-24T14:30:00Z',
        author: 'Manjunath Reddy',
        role: 'Field Worker'
      }
    ],
    escalation: null
  },
  {
    id: 'BLR-2025-0106',
    title: 'Open stormwater drain slab missing — serious pedestrian fall hazard',
    category: 'Drainage & Sewage',
    departmentId: 'DEP-DRN',
    department: 'Drainage & Sewage',
    citizenId: 'CIT001',
    citizenName: 'Aarav Sharma',
    citizenPhone: '+91 98450 12345',
    location: 'Malleshwaram 8th Cross, near Margosa Road Junction',
    ward: 'Ward 45 - Malleshwaram',
    coordinates: { lat: 13.0033, lng: 77.5701 },
    description: 'Reinforced concrete slab over the 4-foot deep stormwater drain broke when a delivery van climbed onto it. Open pit with no warning barricade.',
    priority: PRIORITIES.CRITICAL,
    status: COMPLAINT_STATUS.DISPUTED,
    submittedAt: '2025-02-20T11:00:00Z',
    slaDeadline: '2025-02-22T11:00:00Z',
    supporters: ['CIT001'],
    supporterCount: 8,
    assignedWorkerId: 'WRK006',
    assignedWorkerName: 'Ganesh Murugan',
    evidence: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600&auto=format&fit=crop&q=80'
    ],
    resolutionEvidence: {
      beforePhotos: ['https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600&auto=format&fit=crop&q=80'],
      afterPhotos: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80'],
      completionNotes: 'Placed temporary wooden plywood cover and tape.',
      completedAt: '2025-02-23T16:00:00Z'
    },
    transfers: [],
    timeline: [
      {
        id: 'tl-50',
        status: COMPLAINT_STATUS.SUBMITTED,
        title: 'Logged',
        description: 'Reported missing drain slab.',
        timestamp: '2025-02-20T11:00:00Z',
        author: 'Aarav Sharma',
        role: 'Citizen'
      },
      {
        id: 'tl-51',
        status: COMPLAINT_STATUS.RESOLVED,
        title: 'Marked Resolved by Worker',
        description: 'Temporary wooden plank placed.',
        timestamp: '2025-02-23T16:00:00Z',
        author: 'Ganesh Murugan',
        role: 'Field Worker'
      },
      {
        id: 'tl-52',
        status: COMPLAINT_STATUS.DISPUTED,
        title: 'Resolution Disputed by Citizen',
        description: 'Citizen rejected closure: "A thin wooden plywood is not a permanent RCC heavy-duty slab. Pedestrians will fall through if stepped on."',
        timestamp: '2025-02-24T09:30:00Z',
        author: 'Aarav Sharma',
        role: 'Citizen'
      }
    ],
    escalation: {
      level: 2,
      title: 'Department Supervisor',
      overdueHours: 36,
      escalatedAt: '2025-02-25T10:00:00Z'
    }
  },
  {
    id: 'BLR-2025-0107',
    title: 'Mosquito menace & stagnant water in abandoned excavation site',
    category: 'Public Health',
    departmentId: 'DEP-HLT',
    department: 'Public Health',
    citizenId: 'CIT002',
    citizenName: 'Meera Krishnan',
    citizenPhone: '+91 98451 98765',
    location: 'Electronic City Phase 1, Neeladri Road, behind Wipro gate 5',
    ward: 'Ward 192 - Begur',
    coordinates: { lat: 12.8452, lng: 77.6602 },
    description: 'Basement dug for a commercial building has been filled with 3 feet of green stagnant water for 2 months. Extreme dengue outbreak risk for nearby residents.',
    priority: PRIORITIES.MEDIUM,
    status: COMPLAINT_STATUS.DEPARTMENT_REVIEW,
    submittedAt: '2025-02-26T17:40:00Z',
    slaDeadline: '2025-02-28T17:40:00Z',
    supporters: ['CIT002'],
    supporterCount: 22,
    assignedWorkerId: null,
    assignedWorkerName: null,
    evidence: [
      'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=600&auto=format&fit=crop&q=80'
    ],
    resolutionEvidence: null,
    transfers: [],
    timeline: [
      {
        id: 'tl-60',
        status: COMPLAINT_STATUS.SUBMITTED,
        title: 'Complaint Registered',
        description: 'Citizen report of stagnant water and mosquito breeding.',
        timestamp: '2025-02-26T17:40:00Z',
        author: 'Meera Krishnan',
        role: 'Citizen'
      },
      {
        id: 'tl-61',
        status: COMPLAINT_STATUS.DEPARTMENT_REVIEW,
        title: 'Under Review by Health Officer',
        description: 'Notice being prepared for the private land owner while thermal fogging team is alerted.',
        timestamp: '2025-02-27T10:00:00Z',
        author: 'Dr. Mohan Babu',
        role: 'Department Officer'
      }
    ],
    escalation: null
  },
  {
    id: 'BLR-2025-0108',
    title: 'Severely damaged culvert threatening bridge collapse',
    category: 'Roads & Infrastructure',
    departmentId: 'DEP-RDS',
    department: 'Roads & Infrastructure',
    citizenId: 'CIT003',
    citizenName: 'Vikramaditya Roy',
    citizenPhone: '+91 97400 33211',
    location: 'Marathahalli Bridge Junction, Old Airport Road',
    ward: 'Ward 85 - Doddanekkundi',
    coordinates: { lat: 12.9562, lng: 77.7011 },
    description: 'Structural wingwall of bridge culvert has eroded completely. Foundation beams exposed to scouring. Heavy BMTC buses cross continuously.',
    priority: PRIORITIES.CRITICAL,
    status: COMPLAINT_STATUS.DEPARTMENT_REVIEW,
    submittedAt: '2025-02-23T08:00:00Z',
    slaDeadline: '2025-02-25T08:00:00Z',
    supporters: ['CIT003', 'CIT001'],
    supporterCount: 54,
    assignedWorkerId: null,
    assignedWorkerName: null,
    evidence: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600&auto=format&fit=crop&q=80'
    ],
    resolutionEvidence: null,
    transfers: [],
    timeline: [
      {
        id: 'tl-70',
        status: COMPLAINT_STATUS.SUBMITTED,
        title: 'Critical Report Submitted',
        description: 'Citizen flagged bridge integrity risk.',
        timestamp: '2025-02-23T08:00:00Z',
        author: 'Vikramaditya Roy',
        role: 'Citizen'
      }
    ],
    escalation: {
      level: 3,
      title: 'Municipal Administrator',
      overdueHours: 74,
      escalatedAt: '2025-02-26T10:00:00Z',
      officer: 'Rajesh Kulkarni'
    }
  },
  {
    id: 'BLR-2025-0109',
    title: 'Overflowing sewage manhole on main market road',
    category: 'Drainage & Sewage',
    departmentId: 'DEP-DRN',
    department: 'Drainage & Sewage',
    citizenId: 'CIT001',
    citizenName: 'Aarav Sharma',
    citizenPhone: '+91 98450 12345',
    location: 'BTM Layout 2nd Stage, 7th Main, Near Udupi Garden',
    ward: 'Ward 176 - BTM Layout',
    coordinates: { lat: 12.9166, lng: 77.6101 },
    description: 'Black sewage water bubbling out of the manhole onto the food street. Strong stench and contamination hazard.',
    priority: PRIORITIES.HIGH,
    status: COMPLAINT_STATUS.WORKER_ASSIGNED,
    submittedAt: '2025-02-27T07:15:00Z',
    slaDeadline: '2025-02-28T19:15:00Z',
    supporters: ['CIT001', 'CIT002'],
    supporterCount: 18,
    assignedWorkerId: 'WRK006',
    assignedWorkerName: 'Ganesh Murugan',
    evidence: [
      'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=600&auto=format&fit=crop&q=80'
    ],
    resolutionEvidence: null,
    transfers: [],
    timeline: [
      {
        id: 'tl-80',
        status: COMPLAINT_STATUS.SUBMITTED,
        title: 'Sewage Overflow Logged',
        description: 'Reported by citizen Aarav Sharma.',
        timestamp: '2025-02-27T07:15:00Z',
        author: 'Aarav Sharma',
        role: 'Citizen'
      },
      {
        id: 'tl-81',
        status: COMPLAINT_STATUS.WORKER_ASSIGNED,
        title: 'Desilting Suction Unit Dispatched',
        description: 'Super-sucker vehicle assigned to worker Ganesh Murugan.',
        timestamp: '2025-02-27T09:00:00Z',
        author: 'Kavitha Shenoy',
        role: 'Department Officer'
      }
    ],
    escalation: null
  },
  {
    id: 'BLR-2025-0110',
    title: 'Damaged steel traffic guardrails on flyover descent',
    category: 'Roads & Infrastructure',
    departmentId: 'DEP-RDS',
    department: 'Roads & Infrastructure',
    citizenId: 'CIT002',
    citizenName: 'Meera Krishnan',
    citizenPhone: '+91 98451 98765',
    location: 'Richmond Circle Flyover, Descent towards Residency Road',
    ward: 'Ward 111 - Shantala Nagar',
    coordinates: { lat: 12.9644, lng: 77.5962 },
    description: 'Following a vehicular collision yesterday, 15 meters of crash barrier is bent outwards. Sharp metal edges projecting towards traffic lane.',
    priority: PRIORITIES.HIGH,
    status: COMPLAINT_STATUS.ACKNOWLEDGED,
    submittedAt: '2025-02-27T08:30:00Z',
    slaDeadline: '2025-03-01T08:30:00Z',
    supporters: ['CIT002'],
    supporterCount: 12,
    assignedWorkerId: null,
    assignedWorkerName: null,
    evidence: [
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80'
    ],
    resolutionEvidence: null,
    transfers: [],
    timeline: [
      {
        id: 'tl-90',
        status: COMPLAINT_STATUS.SUBMITTED,
        title: 'Guardrail Damage Reported',
        description: 'Crash barrier hazard logged.',
        timestamp: '2025-02-27T08:30:00Z',
        author: 'Meera Krishnan',
        role: 'Citizen'
      },
      {
        id: 'tl-91',
        status: COMPLAINT_STATUS.ACKNOWLEDGED,
        title: 'Acknowledged by Infrastructure Cell',
        description: 'Replacement crash barrier requisition initiated.',
        timestamp: '2025-02-27T10:15:00Z',
        author: 'Rajesh Kulkarni',
        role: 'Department Officer'
      }
    ],
    escalation: null
  },
  {
    id: 'BLR-2025-0111',
    title: 'Flickering high-mast lighting pole near metro concourse',
    category: 'Street Lighting',
    departmentId: 'DEP-LGT',
    department: 'Street Lighting',
    citizenId: 'CIT001',
    citizenName: 'Aarav Sharma',
    citizenPhone: '+91 98450 12345',
    location: 'MG Road Metro Station entrance, Church Street junction',
    ward: 'Ward 110 - Sampangirama Nagar',
    coordinates: { lat: 12.9756, lng: 77.6066 },
    description: 'High-mast LED floodlight bank strobes intermittently creating epileptic hazard and blinding night drivers.',
    priority: PRIORITIES.MEDIUM,
    status: COMPLAINT_STATUS.SUBMITTED,
    submittedAt: '2025-02-27T11:00:00Z',
    slaDeadline: '2025-03-01T11:00:00Z',
    supporters: ['CIT001'],
    supporterCount: 7,
    assignedWorkerId: null,
    assignedWorkerName: null,
    evidence: [
      'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80'
    ],
    resolutionEvidence: null,
    transfers: [],
    timeline: [
      {
        id: 'tl-100',
        status: COMPLAINT_STATUS.SUBMITTED,
        title: 'New Complaint Registered',
        description: 'Strobe light reported at Metro plaza.',
        timestamp: '2025-02-27T11:00:00Z',
        author: 'Aarav Sharma',
        role: 'Citizen'
      }
    ],
    escalation: null
  },
  {
    id: 'BLR-2025-0112',
    title: 'Illegal slaughterhouse waste dumping in open roadside ditch',
    category: 'Sanitation & Solid Waste',
    departmentId: 'DEP-SAN',
    department: 'Sanitation & Solid Waste',
    citizenId: 'CIT003',
    citizenName: 'Vikramaditya Roy',
    citizenPhone: '+91 97400 33211',
    location: 'Shivajinagar, Broadway Road, near Beef Market lane',
    ward: 'Ward 92 - Shivajinagar',
    coordinates: { lat: 12.9867, lng: 77.6033 },
    description: 'Animal entrails and organic refuse dumped every midnight causing unbearable air pollution and vulture gatherings.',
    priority: PRIORITIES.HIGH,
    status: COMPLAINT_STATUS.WORK_IN_PROGRESS,
    submittedAt: '2025-02-26T06:00:00Z',
    slaDeadline: '2025-02-27T06:00:00Z',
    supporters: ['CIT003'],
    supporterCount: 29,
    assignedWorkerId: 'WRK005',
    assignedWorkerName: 'Suresh Babu',
    evidence: [
      'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80'
    ],
    resolutionEvidence: null,
    transfers: [],
    timeline: [
      {
        id: 'tl-110',
        status: COMPLAINT_STATUS.SUBMITTED,
        title: 'Complaint Logged',
        description: 'Sanitary violation reported.',
        timestamp: '2025-02-26T06:00:00Z',
        author: 'Vikramaditya Roy',
        role: 'Citizen'
      },
      {
        id: 'tl-111',
        status: COMPLAINT_STATUS.WORK_IN_PROGRESS,
        title: 'Sanitation Marshals Dispatched',
        description: 'Marshals investigating origin and coordinating immediate decontamination.',
        timestamp: '2025-02-26T12:00:00Z',
        author: 'Anand Murthy',
        role: 'Department Officer'
      }
    ],
    escalation: null
  },
  {
    id: 'BLR-2025-0113',
    title: 'Contaminated muddy drinking water received from municipal tap',
    category: 'Water Supply',
    departmentId: 'DEP-WTR',
    department: 'Water Supply',
    citizenId: 'CIT001',
    citizenName: 'Aarav Sharma',
    citizenPhone: '+91 98450 12345',
    location: 'Rajajinagar 1st Block, 12th Main, Ward 10',
    ward: 'Ward 10 - Rajajinagar',
    coordinates: { lat: 12.9982, lng: 77.5530 },
    description: 'Brown discolored water smelling of sewage coming from BWSSB supply for the past 2 supply cycles. Suspect sewer water mixing in old cast iron pipes.',
    priority: PRIORITIES.CRITICAL,
    status: COMPLAINT_STATUS.RESOLVED,
    submittedAt: '2025-02-21T08:00:00Z',
    slaDeadline: '2025-02-23T08:00:00Z',
    supporters: ['CIT001', 'CIT002'],
    supporterCount: 45,
    assignedWorkerId: 'WRK003',
    assignedWorkerName: 'Santosh Kumar',
    evidence: [
      'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=600&auto=format&fit=crop&q=80'
    ],
    resolutionEvidence: {
      beforePhotos: ['https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=600&auto=format&fit=crop&q=80'],
      afterPhotos: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80'],
      completionNotes: 'Isolated cross-connection leak near underground valve chamber #4. Replaced damaged 100mm section with HDPE pipe. Chlorine test verified safe at 0.5 ppm.',
      completedAt: '2025-02-23T11:00:00Z'
    },
    transfers: [],
    timeline: [
      {
        id: 'tl-120',
        status: COMPLAINT_STATUS.SUBMITTED,
        title: 'Logged',
        description: 'Contamination reported.',
        timestamp: '2025-02-21T08:00:00Z',
        author: 'Aarav Sharma',
        role: 'Citizen'
      },
      {
        id: 'tl-121',
        status: COMPLAINT_STATUS.RESOLVED,
        title: 'Repairs Completed',
        description: 'HDPE pipe replacement verified and water tests cleared.',
        timestamp: '2025-02-23T11:00:00Z',
        author: 'Santosh Kumar',
        role: 'Field Worker'
      },
      {
        id: 'tl-122',
        status: COMPLAINT_STATUS.CLOSED,
        title: 'Citizen Confirmed Resolution',
        description: 'Citizen verified clean clear water flow.',
        timestamp: '2025-02-23T18:00:00Z',
        author: 'Aarav Sharma',
        role: 'Citizen'
      }
    ],
    escalation: null
  },
  {
    id: 'BLR-2025-0114',
    title: 'Aggressive pack of stray dogs chasing two-wheelers',
    category: 'Public Health',
    departmentId: 'DEP-HLT',
    department: 'Public Health',
    citizenId: 'CIT002',
    citizenName: 'Meera Krishnan',
    citizenPhone: '+91 98451 98765',
    location: 'Yelahanka New Town, 4th Phase, near Mother Dairy Circle',
    ward: 'Ward 4 - Yelahanka Satellite Town',
    coordinates: { lat: 13.1007, lng: 77.5963 },
    description: 'Pack of 7 dogs chasing delivery executives and evening cyclists. Two bites reported in the neighborhood this week.',
    priority: PRIORITIES.HIGH,
    status: COMPLAINT_STATUS.ACKNOWLEDGED,
    submittedAt: '2025-02-26T20:00:00Z',
    slaDeadline: '2025-02-28T08:00:00Z',
    supporters: ['CIT002', 'CIT003'],
    supporterCount: 26,
    assignedWorkerId: null,
    assignedWorkerName: null,
    evidence: [
      'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80'
    ],
    resolutionEvidence: null,
    transfers: [],
    timeline: [
      {
        id: 'tl-130',
        status: COMPLAINT_STATUS.SUBMITTED,
        title: 'Reported',
        description: 'Dog menace complaint submitted.',
        timestamp: '2025-02-26T20:00:00Z',
        author: 'Meera Krishnan',
        role: 'Citizen'
      },
      {
        id: 'tl-131',
        status: COMPLAINT_STATUS.ACKNOWLEDGED,
        title: 'Animal Husbandry Wing Alerted',
        description: 'Veterinary capture van scheduled for ABC vaccination program.',
        timestamp: '2025-02-27T09:15:00Z',
        author: 'Dr. Mohan Babu',
        role: 'Department Officer'
      }
    ],
    escalation: null
  },
  {
    id: 'BLR-2025-0115',
    title: 'Broken granite steps and loose railings at public park entrance',
    category: 'Roads & Infrastructure',
    departmentId: 'DEP-RDS',
    department: 'Roads & Infrastructure',
    citizenId: 'CIT001',
    citizenName: 'Aarav Sharma',
    citizenPhone: '+91 98450 12345',
    location: 'Kuvempu Park, BTM 1st Stage, 100 Feet Ring Road',
    ward: 'Ward 176 - BTM Layout',
    coordinates: { lat: 12.9150, lng: 77.6150 },
    description: 'Granite steps cracked with exposed iron rebar. Elderly morning walkers have stumbled repeatedly.',
    priority: PRIORITIES.LOW,
    status: COMPLAINT_STATUS.DEPARTMENT_REVIEW,
    submittedAt: '2025-02-25T16:00:00Z',
    slaDeadline: '2025-03-01T16:00:00Z',
    supporters: ['CIT001'],
    supporterCount: 5,
    assignedWorkerId: null,
    assignedWorkerName: null,
    evidence: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600&auto=format&fit=crop&q=80'
    ],
    resolutionEvidence: null,
    transfers: [],
    timeline: [
      {
        id: 'tl-140',
        status: COMPLAINT_STATUS.SUBMITTED,
        title: 'Complaint Logged',
        description: 'Citizen report of damaged steps.',
        timestamp: '2025-02-25T16:00:00Z',
        author: 'Aarav Sharma',
        role: 'Citizen'
      }
    ],
    escalation: null
  }
];

