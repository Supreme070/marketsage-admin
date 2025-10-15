import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Performance Monitoring
  tracesSampleRate: 0.2,

  // Edge runtime
  beforeSend(event) {
    if (event.request) {
      delete event.request.cookies;
    }
    return event;
  },

  // Set admin context
  initialScope: {
    tags: {
      app: 'admin-portal',
      runtime: 'edge',
    },
  },
});
