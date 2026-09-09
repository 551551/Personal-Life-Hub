import { z } from 'zod'

// Must execute before shared schemas are instantiated: Zod captures jitless then.
// Keep this platform-specific configuration out of the web application's entry.
z.config({ jitless: true })
