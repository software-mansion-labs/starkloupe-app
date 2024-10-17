// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Sentry starts only on client if NEXT_PUBLIC_USE_SENTRY is set to 'prod'
// Also to disable Sentry on client - set 'skip-sentry-pls=true' cookie
const cookies = document.cookie.split(';');
const shouldSkipSentry = cookies.some(cookie => cookie.trim().startsWith('skip_tracking_pls=true'));
if (shouldSkipSentry) {
    console.log('Sentry is disabled on client - skip_tracking_pls=true cookie is set');
}
const isProdEnv = process.env.NEXT_PUBLIC_USE_TRACKING === 'true';
if (!shouldSkipSentry && isProdEnv) {
    Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN_URL,
        // Add optional integrations for additional features
        integrations: [
            Sentry.replayIntegration(
                {
                    maskAllText: false,
                    blockAllMedia: false,
                }
            ),
        ],
        // Define how likely Replay events are sampled.
        // This sets the sample rate to be 10%. You may want this to be 100% while
        // in development and sample at a lower rate in production
        replaysSessionSampleRate: 1.0,

        // Define how likely Replay events are sampled when an error occurs.
        replaysOnErrorSampleRate: 1.0,

        // Setting this option to true will print useful information to the console while you're setting up Sentry.
        debug: false,
    });
}
