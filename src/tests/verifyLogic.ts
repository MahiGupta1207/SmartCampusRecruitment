import { dataService } from '../services/dataService';
import { INITIAL_STUDENTS, INITIAL_JOBS } from '../data/mockData';

console.log('--- RUNNING CAMPUSHIRE AUTOMATED LOGIC VERIFICATION ---');

// 1. Eligibility Check Verification
const studentHigh = INITIAL_STUDENTS[0]; // Priya Sharma: CGPA 9.15, CSE, 0 backlogs
const studentLow = INITIAL_STUDENTS[4];  // Sneha Reddy: CGPA 7.20, Mech, 1 backlog
const jobSDE = INITIAL_JOBS[0];         // Google: Min CGPA 8.0, 0 backlogs, CSE/IT/ECE

const elHigh = dataService.checkEligibility(studentHigh, jobSDE);
console.log('Test 1: High CGPA candidate eligibility for SDE role:');
console.log('Expected: true, Got:', elHigh.isEligible);
if (!elHigh.isEligible) throw new Error('Test 1 Failed');

const elLow = dataService.checkEligibility(studentLow, jobSDE);
console.log('Test 2: Low CGPA candidate eligibility for SDE role:');
console.log('Expected: false, Got:', elLow.isEligible);
console.log('Reasons correctly caught:', elLow.reasons);
if (elLow.isEligible) throw new Error('Test 2 Failed');

// 2. Duplicate Application Prevention Test
console.log('\n--- VERIFYING APPLICANT DUPLICATE DETECTION ---');
const canApplyAgain = async () => {
  const result1 = await dataService.applyToJob(studentHigh, jobSDE);
  console.log('First application result:', result1.success);
  const result2 = await dataService.applyToJob(studentHigh, jobSDE);
  console.log('Duplicate application attempt result:');
  console.log('Expected: false, Got:', result2.success);
  console.log('Duplicate message:', result2.message);
  if (result2.success) throw new Error('Duplicate application prevention failed');
};

canApplyAgain().then(async () => {
  // 3. Analytics Engine Verification
  console.log('\n--- VERIFYING ANALYTICS & PLACEMENT CALCULATIONS ---');
  const analytics = await dataService.getAnalytics();
  console.log('Total students:', analytics.totalStudents);
  console.log('Placement rate (%):', analytics.overallPlacementRate);
  console.log('Highest Package (LPA):', analytics.highestPackageLPA);
  console.log('Branch stats count:', analytics.branchStats.length);
  if (analytics.overallPlacementRate <= 0 || analytics.highestPackageLPA <= 0) {
    throw new Error('Analytics calculation failed');
  }

  // 4. CSV Generator Verification
  console.log('\n--- VERIFYING CSV REPORT GENERATOR ---');
  const students = await dataService.getStudents();
  const csv = dataService.generatePlacementsCSV(students);
  console.log('CSV Header sample:', csv.split('\n')[0]);
  console.log('CSV Lines generated:', csv.split('\n').length);
  if (!csv.includes('Full Name') || csv.split('\n').length < 2) {
    throw new Error('CSV Generation failed');
  }

  // 5. Complete Application -> Offer Issuance -> Acceptance/Decline Workflow Test
  console.log('\n--- VERIFYING APPLICATION & OFFER WORKFLOW ---');
  const testApp = await dataService.applyToJob(studentHigh, INITIAL_JOBS[1]);
  if (!testApp.success || !testApp.application) {
    throw new Error('Failed to create test application for offer workflow: ' + testApp.message);
  }
  const appId = testApp.application.id;

  const shortlisted = await dataService.updateApplicationStatus(appId, 'Shortlisted', 'Cleared OA');
  if (!shortlisted || shortlisted.status !== 'Shortlisted') {
    throw new Error('Shortlist transition failed');
  }

  const selected = await dataService.updateApplicationStatus(appId, 'Selected', 'Cleared final round');
  if (!selected || selected.status !== 'Selected') {
    throw new Error('Select transition failed');
  }

  const offerRes = await dataService.issueOffer(appId, {
    packageLpa: 28,
    offerDate: '2026-12-01',
    details: 'Bangalore office, joining July 2027',
  });
  if (!offerRes.success || offerRes.application?.offer_status !== 'Pending') {
    throw new Error('Offer issuance failed: ' + offerRes.message);
  }

  const acceptRes = await dataService.respondToOffer(appId, 'Accepted');
  if (!acceptRes.success || acceptRes.application?.offer_status !== 'Accepted') {
    throw new Error('Offer acceptance failed: ' + acceptRes.message);
  }

  const updatedAnalytics = await dataService.getAnalytics();
  console.log('Offers issued:', updatedAnalytics.offersIssued, 'Accepted:', updatedAnalytics.offersAccepted);
  if (updatedAnalytics.offersAccepted < 1) {
    throw new Error('Analytics did not reflect accepted offer');
  }

  console.log('\n✅ ALL 5 CORE DOMAIN TEST SUITES PASSED FLAWLESSLY!\n');
}).catch((err) => {
  console.error('Logic verification failed:', err);
  process.exit(1);
});
