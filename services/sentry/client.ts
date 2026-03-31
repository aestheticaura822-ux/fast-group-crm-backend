import * as Sentry from '@sentry/node'
import { ProfilingIntegration } from '@sentry/profiling-node'

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      new ProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  })
}

export const captureError = (error: Error, context?: any) => {
  Sentry.withScope(scope => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setExtra(key, context[key])
      })
    }
    Sentry.captureException(error)
  })
}

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level)
}

export const setUser = (user: { id: string; email: string; role: string }) => {
  Sentry.setUser(user)
}

export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value)
}