/**
 * Concurrent Booking Test Script
 * 
 * Simulates multiple concurrent booking requests to the same slot
 * to test the concurrency control mechanism.
 * 
 * Requirements: Node.js 18+ (for built-in fetch API)
 * 
 * Usage: node scripts/concurrentBookingTest.js <slotId>
 * Example: node scripts/concurrentBookingTest.js 1
 * 
 * Environment variable: API_URL (defaults to http://localhost:4000)
 * Example: API_URL=http://localhost:3000 node scripts/concurrentBookingTest.js 1
 */

// Check Node.js version (fetch requires Node 18+)
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 18) {
  console.error('Error: This script requires Node.js 18 or higher');
  console.error(`Current version: ${nodeVersion}`);
  console.error('Please upgrade Node.js or use a polyfill for fetch');
  process.exit(1);
}

const BASE_URL = process.env.API_URL || 'http://localhost:4000';

// Get slotId from command line arguments
const slotId = process.argv[2];

if (!slotId) {
  console.error('Error: slotId is required');
  console.log('Usage: node scripts/concurrentBookingTest.js <slotId>');
  console.log('Example: node scripts/concurrentBookingTest.js 1');
  process.exit(1);
}

// Patient names for the concurrent requests
const patientNames = [
  'Alice Johnson',
  'Bob Smith',
  'Charlie Brown',
  'Diana Prince',
  'Eve Wilson'
];

/**
 * Make a POST request to create a booking
 * @param {string} slotId - The slot ID to book
 * @param {string} patientName - The patient name
 * @returns {Promise<Object>} Response data with timing information
 */
async function createBooking(slotId, patientName) {
  const startTime = Date.now();
  const url = `${BASE_URL}/api/slots/${slotId}/bookings`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patientName: patientName
      })
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const data = await response.json();
    
    return {
      patientName,
      status: response.status,
      duration: `${duration}ms`,
      success: response.ok,
      data: data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      patientName,
      status: 'ERROR',
      duration: `${duration}ms`,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Run the concurrent booking test
 */
async function runTest() {
  console.log('='.repeat(60));
  console.log('Concurrent Booking Test');
  console.log('='.repeat(60));
  console.log(`Testing slot ID: ${slotId}`);
  console.log(`API URL: ${BASE_URL}`);
  console.log(`Number of concurrent requests: ${patientNames.length}`);
  console.log(`Patient names: ${patientNames.join(', ')}`);
  console.log('='.repeat(60));
  console.log('');

  const testStartTime = Date.now();

  // Create an array of promises for concurrent requests
  const requests = patientNames.map((patientName, index) => {
    console.log(`[${index + 1}] Firing request for: ${patientName}`);
    return createBooking(slotId, patientName);
  });

  // Wait for all requests to complete
  console.log('\nWaiting for all requests to complete...\n');
  const results = await Promise.all(requests);

  const testEndTime = Date.now();
  const totalDuration = testEndTime - testStartTime;

  // Print results
  console.log('='.repeat(60));
  console.log('Results');
  console.log('='.repeat(60));
  
  results.forEach((result, index) => {
    console.log(`\n[${index + 1}] ${result.patientName}:`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Duration: ${result.duration}`);
    console.log(`  Success: ${result.success ? '✓' : '✗'}`);
    
    if (result.data) {
      if (result.data.error) {
        console.log(`  Error: ${result.data.error}`);
      } else {
        console.log(`  Booking ID: ${result.data.id || 'N/A'}`);
        console.log(`  Booking Status: ${result.data.status || 'N/A'}`);
      }
    } else if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    console.log(`  Timestamp: ${result.timestamp}`);
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Total test duration: ${totalDuration}ms`);
  console.log(`Successful bookings: ${results.filter(r => r.success && r.status === 201).length}`);
  console.log(`Failed bookings: ${results.filter(r => !r.success || r.status !== 201).length}`);
  console.log(`409 Conflict (slot already booked): ${results.filter(r => r.status === 409).length}`);
  console.log(`Other errors: ${results.filter(r => r.status !== 201 && r.status !== 409 && r.success).length}`);
  
  // Expected behavior: Only one booking should succeed (201), others should get 409
  const successfulBookings = results.filter(r => r.success && r.status === 201);
  if (successfulBookings.length === 1) {
    console.log('\n✓ Test PASSED: Exactly one booking succeeded (concurrency control working)');
  } else if (successfulBookings.length === 0) {
    console.log('\n⚠ Test WARNING: No bookings succeeded (may indicate an issue)');
  } else {
    console.log(`\n✗ Test FAILED: ${successfulBookings.length} bookings succeeded (concurrency control may not be working correctly)`);
  }
  
  console.log('='.repeat(60));
}

// Run the test
runTest().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
});

