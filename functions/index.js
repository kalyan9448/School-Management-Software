/**
 * Firebase Cloud Functions entry point.
 * Exports the Express app as a 2nd-gen HTTPS Cloud Function.
 *
 * Region: asia-south1 (Mumbai) for lowest latency in India.
 * Timeout: 120 seconds (handles complex auth flows + Firestore queries).
 * Memory: 256 MiB (sufficient for an Express API).
 */

const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const app = require('./src/app');

// Set global defaults for all functions in this project
setGlobalOptions({
    region: 'asia-south1',
    timeoutSeconds: 120,
    memory: '256MiB',
    // Uncomment the line below to keep 1 instance always warm (eliminates cold starts, ~$5/month):
    // minInstances: 1,
});

// Export the Express app as a Cloud Function named "api"
// This will be accessible at: https://api-<hash>-<region>.a.run.app
exports.api = onRequest(
    {
        cors: true, // Let Express handle CORS for more control
    },
    app,
);
