/**
 * Accessing modules
 * @module accessing
 */

'use strict'

const d = (module) => module && module.default || module

const ActorAccessBundle = d(require('./actor_access_bundle'))
const actorAccessModule = d(require('./actor_access_module'))
const ActorAccess = d(require('./actor_access'))

module.exports = {
  ActorAccessBundle,
  actorAccessModule,
  ActorAccess
}
