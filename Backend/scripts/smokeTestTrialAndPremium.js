/*
  Smoke test: Trial gating and premium enforcement
  Steps:
  1) Health check
  2) Register traditional user
  3) Login to get JWT
  4) Check subscription status (expect free/active)
  5) Hit premium-protected GET /api/ai-chat/schedule (expect 403)
  6) Attempt POST /api/subscriptions/trial before tasks (expect 403)
  7) Complete trial tasks (watch ad, follow instagram, share 10)
  8) Start trial (expect 200)
  9) Hit premium-protected GET /api/ai-chat/schedule (expect 200)
*/

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';

function uniqueEmail() {
  const ts = Date.now();
  return `smoke_trial_${ts}@example.com`;
}

async function assertStatus(promise, expected, label) {
  try {
    const res = await promise;
    if (!expected.includes(res.status)) {
      throw new Error(`${label} expected status ${expected} but got ${res.status}: ${res.data && JSON.stringify(res.data)}`);
    }
    console.log(`✔ ${label} -> ${res.status}`);
    return res;
  } catch (err) {
    if (err.response) {
      const { status, data } = err.response;
      if (expected.includes(status)) {
        console.log(`✔ ${label} -> ${status}`);
        return err.response;
      }
      console.error(`✖ ${label} failed. Status ${status}. Body:`, data);
    } else {
      console.error(`✖ ${label} error:`, err.message);
    }
    throw err;
  }
}

async function main() {
  const email = uniqueEmail();
  const password = 'Test1234!';
  const displayName = 'Smoke Trial User';

  console.log('BASE_URL:', BASE_URL);

  // 1) Health
  await assertStatus(axios.get(`${BASE_URL}/api/health`), [200], 'Health check');

  // 2) Register
  const regRes = await assertStatus(
    axios.post(`${BASE_URL}/api/auth/register-traditional`, {
      email,
      password,
      displayName
    }),
    [201],
    'Register user'
  );

  // 3) Login
  const loginRes = await assertStatus(
    axios.post(`${BASE_URL}/api/auth/login-traditional`, { email, password }),
    [200],
    'Login user'
  );
  const token = loginRes.data.token;
  if (!token) throw new Error('No token returned from login');
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  // 4) Subscription status (expect free/active)
  const statusRes = await assertStatus(
    axios.get(`${BASE_URL}/api/subscriptions/status`, auth),
    [200],
    'Initial subscription status'
  );
  const sub = statusRes.data;
  if (!(sub.plan === 'free' && sub.status === 'active')) {
    throw new Error(`Expected free/active but got plan=${sub.plan} status=${sub.status}`);
  }

  // 5) Premium-protected endpoint before trial -> 403
  await assertStatus(
    axios.get(`${BASE_URL}/api/ai-chat/schedule`, auth),
    [403],
    'Premium endpoint blocked before trial'
  );

  // 6) Try start trial before tasks -> 403
  await assertStatus(
    axios.post(`${BASE_URL}/api/subscriptions/trial`, {}, auth),
    [403],
    'Start trial blocked before tasks'
  );

  // 7) Complete tasks
  await assertStatus(
    axios.post(`${BASE_URL}/api/subscriptions/trial-tasks/watch-ad`, {}, auth),
    [200],
    'Task: watch ad'
  );
  await assertStatus(
    axios.post(`${BASE_URL}/api/subscriptions/trial-tasks/follow-instagram`, {}, auth),
    [200],
    'Task: follow instagram'
  );
  await assertStatus(
    axios.post(`${BASE_URL}/api/subscriptions/trial-tasks/share`, { count: 10 }, auth),
    [200],
    'Task: share count 10'
  );

  // 8) Start trial -> 200
  const trialStart = await assertStatus(
    axios.post(`${BASE_URL}/api/subscriptions/trial`, {}, auth),
    [200],
    'Start trial after tasks'
  );
  if (!trialStart.data.trialEndDate) {
    console.warn('No trialEndDate in response; check backend consistency');
  }

  // 8.1) Verify subscription now in trial and premium features enabled
  const trialStatusRes = await assertStatus(
    axios.get(`${BASE_URL}/api/subscriptions/status`, auth),
    [200],
    'Subscription status after starting trial'
  );
  if (trialStatusRes.data.status !== 'trial') {
    throw new Error(`Expected subscription.status='trial' but got ${trialStatusRes.data.status}`);
  }
  if (!trialStatusRes.data.trialEndDate) {
    throw new Error('Expected trialEndDate to be set after starting trial');
  }
  if (!trialStatusRes.data.features || trialStatusRes.data.features.aiInsights !== true) {
    throw new Error('Expected premium features to be enabled during trial (aiInsights=true)');
  }

  // 9) Premium-protected endpoint during trial -> 200
  await assertStatus(
    axios.get(`${BASE_URL}/api/ai-chat/schedule`, auth),
    [200, 404],
    'Premium endpoint allowed during trial (200 or 404 allowed)'
  );

  console.log('\nAll checks passed. ✅');
}

main().catch((err) => {
  console.error('\nSmoke test failed ❌');
  process.exit(1);
});
