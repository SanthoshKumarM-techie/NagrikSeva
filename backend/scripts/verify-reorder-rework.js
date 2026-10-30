const API_BASE = 'http://localhost:5000/api/v1';

async function createClient(userId, password) {
  let cookieHeader = '';

  const request = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      cookieHeader = setCookie.split(';')[0];
    }

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json.message || `HTTP ${res.status}`);
      err.data = json;
      err.status = res.status;
      throw err;
    }
    return json;
  };

  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ userId, password })
  });

  return { request, user: loginRes.data.user };
}

async function runTest() {
  console.log('--- TESTING OFFICER REWORK & WORK ORDER REASSIGNMENT ---');

  // 1. Logins
  const citizen = await createClient('CIT001', 'citizen123');
  const officer = await createClient('OFF001', 'officer123');
  const worker1 = await createClient('WRK001', 'worker123');

  // Fetch departments & categories
  const deptsRes = await officer.request('/departments');
  const roadDept = deptsRes.data.departments.find(d => d.code === 'RDS' || d.name.includes('Road')) || deptsRes.data.departments[0];
  const catsRes = await officer.request('/categories');
  const potholeCat = catsRes.data.categories.find(c => c.name.includes('Pothole') || c.name.includes('Road')) || catsRes.data.categories[0];
  const wardsRes = await officer.request('/wards');
  const ward = wardsRes.data.wards[0];

  // 2. Citizen creates complaint
  const createRes = await citizen.request('/complaints', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Major Pothole Test For Rework',
      description: 'Dangerous road crater needing immediate repair and quality inspection.',
      categoryId: potholeCat.id,
      departmentId: roadDept.id,
      wardId: ward.id,
      address: '12th Main Indiranagar, Bengaluru',
      streetLocation: '12th Main Indiranagar, Bengaluru',
      latitude: 12.9716,
      longitude: 77.5946,
      priority: 'HIGH'
    })
  });
  const complaint = createRes.data.complaint;
  console.log(`[1] Created complaint: ${complaint.ticket_number} (ID: ${complaint.id})`);

  // 3. Officer assigns Worker 1
  const assign1 = await officer.request('/assignments', {
    method: 'POST',
    body: JSON.stringify({
      complaintId: complaint.id,
      workerId: worker1.user.id,
      assignmentNotes: 'Initial deployment for surface grading'
    })
  });
  console.log(`[2] Officer assigned Worker 1: Assignment ID: ${assign1.data.assignment.id}`);

  // 4. Worker 1 accepts, inspects, starts, and completes work
  await worker1.request(`/assignments/${assign1.data.assignment.id}/accept`, { method: 'PATCH' });
  await worker1.request(`/assignments/${assign1.data.assignment.id}/inspection`, {
    method: 'POST',
    body: JSON.stringify({ notes: 'Inspection completed, cordoned off lane.' })
  });
  await worker1.request(`/assignments/${assign1.data.assignment.id}/start`, { method: 'PATCH' });
  await worker1.request(`/assignments/${assign1.data.assignment.id}/complete`, {
    method: 'POST',
    body: JSON.stringify({
      description: 'Asphalt filled and rolled.',
      evidenceUrls: ['https://example.com/after-1.jpg']
    })
  });

  // Verify complaint is in VERIFICATION
  let compCheck = (await officer.request(`/complaints/${complaint.id}`)).data.complaint;
  if (compCheck.current_status !== 'VERIFICATION') {
    throw new Error(`Expected VERIFICATION, got ${compCheck.current_status}`);
  }
  console.log(`[3] Worker 1 completed work -> Complaint in VERIFICATION`);

  // 5. Officer inspects and REJECTS (Orders Rework)
  console.log('[4] Officer rejecting resolution and ordering rework...');
  const verifyRejectRes = await officer.request(`/reviews/complaint/${complaint.id}/officer-verify`, {
    method: 'POST',
    body: JSON.stringify({
      decision: 'REWORK_REQUIRED',
      reviewNotes: 'Surface has uneven depression; requires additional hot-mix compaction.',
      reworkInstructions: 'Surface has uneven depression; requires additional hot-mix compaction.'
    })
  });
  console.log(`    Officer verification response decision: ${verifyRejectRes.data.review.decision}`);

  // 6. Check that complaint is back in WORK_IN_PROGRESS and worker assignment is IN_PROGRESS
  compCheck = (await officer.request(`/complaints/${complaint.id}`)).data.complaint;
  console.log(`[5] Complaint status after rework rejection: ${compCheck.current_status}`);
  if (compCheck.current_status !== 'WORK_IN_PROGRESS') {
    throw new Error(`Expected WORK_IN_PROGRESS, got ${compCheck.current_status}`);
  }

  const workerTasks = (await worker1.request('/assignments/my-tasks')).data.tasks;
  const activeTask = workerTasks.find(t => t.complaint_id === complaint.id);
  console.log(`[6] Worker assignment status: ${activeTask?.status}`);
  if (activeTask?.status !== 'IN_PROGRESS') {
    throw new Error(`Expected worker task to be IN_PROGRESS, got ${activeTask?.status}`);
  }

  // 7. Officer Reorders / Reassigns to worker with new instructions using ticket number BLR-...
  console.log('[7] Officer reassigning / reordering work order using ticket number...');
  const reassignRes = await officer.request('/assignments', {
    method: 'POST',
    body: JSON.stringify({
      complaintId: complaint.ticket_number, // Using ticket number BLR-...
      workerId: worker1.user.id,
      assignmentNotes: 'Reallocated with urgent hot-mix compaction instruction'
    })
  });
  console.log(`    Reassignment created: ID ${reassignRes.data.assignment.id}`);

  compCheck = (await officer.request(`/complaints/${complaint.ticket_number}`)).data.complaint;
  console.log(`[8] Complaint status after reassignment: ${compCheck.current_status}`);
  if (compCheck.current_status !== 'WORKER_ASSIGNED') {
    throw new Error(`Expected WORKER_ASSIGNED, got ${compCheck.current_status}`);
  }

  console.log('\n======================================================');
  console.log('🎉 SUCCESS! Officer rework order and work order reassignment flow verified with 100% precision!');
  console.log('======================================================\n');
}

runTest().catch(err => {
  console.error('Test failed:', err?.data || err.message);
  process.exit(1);
});
