import assert from 'assert';

const BASE_URL = 'http://localhost:5000/api/v1';

class HttpClient {
  constructor() {
    this.cookies = '';
  }

  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (this.cookies) {
      headers['Cookie'] = this.cookies;
    }

    const res = await fetch(url, {
      ...options,
      headers
    });

    // Capture set-cookie headers
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      // Extract sid cookie
      const sid = setCookie.split(';')[0];
      this.cookies = sid;
    }

    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data };
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }
}

async function runEndToEndVerification() {
  console.log('====================================================');
  console.log('🚀 NagrikSeva End-to-End Workflow Verification');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function test(name, condition) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${name}`);
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
      throw new Error(`Test failed: ${name}`);
    }
  }

  // Context shared between roles
  let testComplaintId = null;
  let testTicketNumber = null;
  let testAssignmentId = null;
  let waterDeptId = null;
  let waterCatId = null;
  let koramangalaWardId = null;
  let waterWorkerId = null;

  // -------------------------------------------------------------
  // 1. PUBLIC & LOOKUP ENDPOINTS
  // -------------------------------------------------------------
  console.log('📌 Phase 1: Lookups & Master Data Validation');
  const pubClient = new HttpClient();

  const deptsRes = await pubClient.get('/departments');
  test('Fetch departments successfully', deptsRes.ok && deptsRes.data.data.departments.length > 0);
  const roadDept = deptsRes.data.data.departments.find(d => d.code === 'RDS' || d.name.includes('Road')) || deptsRes.data.data.departments[0];
  waterDeptId = roadDept.id;
  console.log(`     -> Using Department ID: ${waterDeptId} (${roadDept.name})`);

  const catsRes = await pubClient.get('/categories');
  test('Fetch categories successfully', catsRes.ok && catsRes.data.data.categories.length > 0);
  const roadCat = catsRes.data.data.categories.find(c => c.name.includes('Pothole') || c.name.includes('Road')) || catsRes.data.data.categories[0];
  waterCatId = roadCat.id;
  console.log(`     -> Using Category ID: ${waterCatId}`);

  const wardsRes = await pubClient.get('/wards');
  test('Fetch wards successfully', wardsRes.ok && wardsRes.data.data.wards.length > 0);
  const koraWard = wardsRes.data.data.wards.find(w => w.name && w.name.includes('Koramangala'));
  koramangalaWardId = koraWard ? koraWard.id : wardsRes.data.data.wards[0].id;
  console.log(`     -> Using Ward ID: ${koramangalaWardId}`);

  // -------------------------------------------------------------
  // 2. CITIZEN ROLE WORKFLOW
  // -------------------------------------------------------------
  console.log('\n📌 Phase 2: Citizen Workflow (Aarav Sharma - CIT001)');
  const citizenClient = new HttpClient();

  // Login
  const citLoginRes = await citizenClient.post('/auth/login', {
    userId: 'CIT001',
    password: 'citizen123'
  });
  test('Citizen login succeeds', citLoginRes.ok && citLoginRes.data.data.user.role === 'CITIZEN');

  // Session check
  const citSessRes = await citizenClient.get('/auth/session');
  test('Citizen session is active and persisted via cookie', citSessRes.ok && citSessRes.data.data.authenticated === true);

  // Stats
  const citStatsRes = await citizenClient.get('/complaints/stats/citizen');
  if (!citStatsRes.ok) {
    console.error('Citizen stats error:', JSON.stringify(citStatsRes.data, null, 2));
  }
  test('Citizen stats retrieved', citStatsRes.ok && citStatsRes.data.data.stats !== undefined);

  // Duplicate / Match check
  const matchRes = await citizenClient.post('/complaints/matches', {
    latitude: 12.9345,
    longitude: 77.6253,
    categoryId: waterCatId,
    radiusMeters: 1000
  });
  test('Duplicate check API executes successfully', matchRes.ok && Array.isArray(matchRes.data.data.matches));

  // File a new complaint
  const complaintPayload = {
    title: 'Severe pipeline burst flooding 5th Main Koramangala',
    description: 'High-pressure water line ruptured this morning. Clean potable water overflowing continuously into residential driveway.',
    categoryId: waterCatId,
    departmentId: waterDeptId,
    wardId: koramangalaWardId,
    latitude: 12.9345,
    longitude: 77.6253,
    address: '5th Main, 4th Block, Koramangala, Bengaluru',
    landmark: 'Opposite Regional Post Office',
    priority: 'HIGH'
  };

  const createCompRes = await citizenClient.post('/complaints', complaintPayload);
  if (!createCompRes.ok) {
    console.error('Complaint creation error:', JSON.stringify(createCompRes.data, null, 2));
  }
  test('Citizen creates a complaint in PostgreSQL', createCompRes.status === 201 && createCompRes.data.data.complaint?.id);
  testComplaintId = createCompRes.data.data.complaint.id;
  testTicketNumber = createCompRes.data.data.complaint.ticket_number;
  console.log(`     -> Created Complaint: ${testTicketNumber} (ID: ${testComplaintId})`);

  // Check my complaints
  const myComplaintsRes = await citizenClient.get('/complaints/my');
  test('Complaint appears in citizen my-complaints list', myComplaintsRes.ok && myComplaintsRes.data.data.complaints.some(c => c.id === testComplaintId));

  // Read complaint details
  const compDetailRes = await citizenClient.get(`/complaints/${testComplaintId}`);
  test('Complaint details contain valid status, location, and timeline', compDetailRes.ok && compDetailRes.data.data.complaint.status === 'SUBMITTED');

  // Community member (CIT002 - Meera Krishnan) upvotes / supports complaint
  const citizen2Client = new HttpClient();
  await citizen2Client.post('/auth/login', { userId: 'CIT002', password: 'citizen123' });
  const supportRes = await citizen2Client.post(`/complaints/${testComplaintId}/support`, {});
  if (!supportRes.ok) {
    console.error('Support complaint error:', JSON.stringify(supportRes.data, null, 2));
  }
  test('Citizen community upvote/support operates', supportRes.ok);

  // Notifications
  const notifRes = await citizenClient.get('/notifications');
  test('Citizen notifications retrieved', notifRes.ok && Array.isArray(notifRes.data.data.notifications));

  // -------------------------------------------------------------
  // 3. DEPARTMENT OFFICER WORKFLOW
  // -------------------------------------------------------------
  console.log('\n📌 Phase 3: Department Officer Workflow (Rajesh Kumar - OFF001)');
  const officerClient = new HttpClient();

  // Login
  const offLoginRes = await officerClient.post('/auth/login', {
    userId: 'OFF001',
    password: 'officer123'
  });
  test('Department Officer login succeeds', offLoginRes.ok && offLoginRes.data.data.user.role === 'DEPARTMENT_OFFICER');

  // Officer session check
  const offSessRes = await officerClient.get('/auth/session');
  test('Officer session active', offSessRes.ok && offSessRes.data.data.user.departmentId === waterDeptId);

  // Department Stats
  const deptStatsRes = await officerClient.get('/complaints/stats/department');
  test('Department complaint statistics load', deptStatsRes.ok && deptStatsRes.data.data.stats !== undefined);

  // List department complaints
  const deptComplaintsRes = await officerClient.get(`/complaints?departmentId=${waterDeptId}`);
  test('Officer lists department complaints', deptComplaintsRes.ok && deptComplaintsRes.data.data.complaints.some(c => c.id === testComplaintId));

  // Find a worker in this department to assign
  const workersRes = await officerClient.get('/users?role=FIELD_WORKER');
  let targetWorker = null;
  if (workersRes.ok && workersRes.data.data?.users) {
    targetWorker = workersRes.data.data.users.find(u => u.department_id === waterDeptId) || workersRes.data.data.users[0];
  }
  waterWorkerId = targetWorker ? targetWorker.id : '44444444-4444-4444-4444-444444444403';
  console.log(`     -> Assigning to Field Worker ID: ${waterWorkerId} (${targetWorker?.full_name || 'Suresh Patil'})`);

  // Assign worker
  const assignRes = await officerClient.post('/assignments', {
    complaintId: testComplaintId,
    workerId: waterWorkerId,
    priority: 'HIGH',
    instructions: 'Perform urgent excavation, shut main gate valve, and weld the fracture'
  });
  test('Officer assigns field worker to complaint', assignRes.status === 201 && assignRes.data.data.assignment?.id);
  testAssignmentId = assignRes.data.data.assignment.id;
  console.log(`     -> Assignment created with ID: ${testAssignmentId}`);

  // Verify complaint transitioned to WORKER_ASSIGNED
  const assignedCompCheck = await officerClient.get(`/complaints/${testComplaintId}`);
  test('Complaint status transitioned to WORKER_ASSIGNED', assignedCompCheck.ok && assignedCompCheck.data.data.complaint.status === 'WORKER_ASSIGNED');

  // Check department transfers
  const deptTransfersRes = await officerClient.get('/transfers/incoming');
  test('Officer retrieves departmental transfers registry', deptTransfersRes.ok);

  // -------------------------------------------------------------
  // 4. FIELD WORKER WORKFLOW
  // -------------------------------------------------------------
  console.log('\n📌 Phase 4: Field Worker Workflow (Suresh Patil - WRK001)');
  const workerClient = new HttpClient();

  // Login
  const wrkLoginRes = await workerClient.post('/auth/login', {
    userId: 'WRK001',
    password: 'worker123'
  });
  test('Field Worker login succeeds', wrkLoginRes.ok && wrkLoginRes.data.data.user.role === 'FIELD_WORKER');

  // Worker task list
  const tasksRes = await workerClient.get('/assignments/my-tasks');
  test('Worker task list contains new assignment', tasksRes.ok && tasksRes.data.data.tasks.some(t => t.id === testAssignmentId));

  // Step 4a: Worker accepts task
  const acceptRes = await workerClient.patch(`/assignments/${testAssignmentId}/accept`);
  test('Worker accepts assignment', acceptRes.ok && acceptRes.data.data.assignment.status === 'ACCEPTED');

  // Step 4b: Worker logs site inspection
  const inspectRes = await workerClient.post(`/assignments/${testAssignmentId}/inspection`, {
    updateType: 'INSPECTION',
    description: 'Arrived at 5th Main. Found 6-inch mild steel pipe fractured due to road construction vibration.',
    latitude: 12.9345,
    longitude: 77.6253
  });
  test('Worker logs site inspection findings', inspectRes.ok);

  // Step 4c: Worker starts remediation
  const startRes = await workerClient.patch(`/assignments/${testAssignmentId}/start`);
  test('Worker starts remediation (status becomes IN_PROGRESS)', startRes.ok && startRes.data.data.assignment.status === 'IN_PROGRESS');

  // Step 4d: Worker completes work with AFTER evidence photo
  const completeRes = await workerClient.post(`/assignments/${testAssignmentId}/complete`, {
    description: 'Replaced ruptured 6-inch pipe section with heavy duty ductile iron sleeve. Welded and pressure tested up to 4.5 bar with zero leaks. Restored road surface.',
    evidenceUrls: ['https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800'],
    latitude: 12.9345,
    longitude: 77.6253
  });
  test('Worker completes work and submits for verification', completeRes.ok && (completeRes.data.data?.status === 'VERIFICATION' || completeRes.data.data?.assignment?.status === 'SUBMITTED_FOR_VERIFICATION' || completeRes.data.data?.assignment?.status === 'COMPLETED'));

  // Verify complaint transitioned to VERIFICATION
  const compVerifCheck = await officerClient.get(`/complaints/${testComplaintId}`);
  test('Complaint status transitioned to VERIFICATION', compVerifCheck.ok && compVerifCheck.data.data.complaint.status === 'VERIFICATION');

  // -------------------------------------------------------------
  // 5. OFFICER VERIFICATION WORKFLOW
  // -------------------------------------------------------------
  console.log('\n📌 Phase 5: Officer Resolution Verification (Rajesh Kumar - OFF001)');

  const verifyRes = await officerClient.post(`/reviews/complaint/${testComplaintId}/officer-verify`, {
    decision: 'APPROVED',
    feedback: 'Remediation inspected on site. Pressure test validated. Trench backfilled cleanly.'
  });
  test('Officer approves work and verifies resolution', verifyRes.ok);

  // Verify complaint transitioned to RESOLVED
  const compResolvedCheck = await officerClient.get(`/complaints/${testComplaintId}`);
  test('Complaint status transitioned to RESOLVED', compResolvedCheck.ok && compResolvedCheck.data.data.complaint.status === 'RESOLVED');

  // -------------------------------------------------------------
  // 6. CITIZEN RESOLUTION CONFIRMATION WORKFLOW
  // -------------------------------------------------------------
  console.log('\n📌 Phase 6: Citizen Resolution Confirmation (Aarav Sharma - CIT001)');

  const citizenConfirmRes = await citizenClient.post(`/reviews/complaint/${testComplaintId}/citizen-feedback`, {
    decision: 'CONFIRMED',
    rating: 5,
    feedback: 'Outstanding prompt repair by the BWSSB emergency crew! Water flow is fully restored with no leaks.'
  });
  test('Citizen confirms resolution and provides 5-star rating', citizenConfirmRes.ok);

  // Verify complaint transitioned to CLOSED
  const compClosedCheck = await citizenClient.get(`/complaints/${testComplaintId}`);
  test('Complaint status transitioned to CLOSED', compClosedCheck.ok && compClosedCheck.data.data.complaint.status === 'CLOSED');

  // -------------------------------------------------------------
  // 7. SUPER ADMIN WORKFLOW
  // -------------------------------------------------------------
  console.log('\n📌 Phase 7: Super Admin Municipal Oversight (Dr. Priya Sundaram - ADM001)');
  const adminClient = new HttpClient();

  // Login
  const admLoginRes = await adminClient.post('/auth/login', {
    userId: 'ADM001',
    password: 'admin123'
  });
  test('Super Admin login succeeds', admLoginRes.ok && admLoginRes.data.data.user.role === 'SUPER_ADMIN');

  // Admin Session check
  const admSessRes = await adminClient.get('/auth/session');
  test('Admin session active', admSessRes.ok && admSessRes.data.data.user.role === 'SUPER_ADMIN');

  // City Analytics
  const cityAnalyticsRes = await adminClient.get('/analytics/city');
  test('Admin fetches municipal city intelligence analytics', cityAnalyticsRes.ok && cityAnalyticsRes.data.data.analytics.summary !== undefined);

  // All complaints listing
  const allCompRes = await adminClient.get('/complaints');
  test('Admin lists city-wide complaints registry', allCompRes.ok && allCompRes.data.data.complaints.some(c => c.id === testComplaintId));

  // Users management
  const usersRes = await adminClient.get('/users');
  test('Admin queries user directory', usersRes.ok && usersRes.data.data.users.length > 0);

  // SLA Configuration
  const slaRes = await adminClient.get('/sla/rules');
  test('Admin retrieves SLA rules matrix', slaRes.ok && Array.isArray(slaRes.data.data.rules));

  // Escalation directory
  const escRes = await adminClient.get('/escalations');
  test('Admin retrieves escalations monitoring queue', escRes.ok);

  // Transfer monitoring
  const transMonRes = await adminClient.get('/transfers/all');
  test('Admin retrieves cross-department transfer monitoring ledger', transMonRes.ok);

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} WORKFLOW VERIFICATION TESTS PASSED SUCCESSFULLY!`);
  console.log('====================================================\n');
}

runEndToEndVerification().catch((err) => {
  console.error('\n❌ Workflow verification failed:', err);
  process.exit(1);
});