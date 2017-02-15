/**
 * Accessing modules
 * @module accessing
 */

'use strict'

let d = (module) => module && module.default || module

module.exports = {
  get ActorAccessBundle () { return d(require('./actor_access_bundle')) },
  get actorAccessModule () { return d(require('./actor_access_module')) },
  get ActorAccess () { return d(require('./actor_access')) }
}
