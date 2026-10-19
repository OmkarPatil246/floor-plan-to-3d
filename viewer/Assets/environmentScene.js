/**
 * environmentScene.js — Module re-export and scene integration helper
 * 
 * Re-exports OutdoorEnvironment from environment.js to ensure backward compatibility
 * with any imports targeting environmentScene.js.
 */

export { OutdoorEnvironment } from './environment.js';
import { OutdoorEnvironment } from './environment.js';
export default OutdoorEnvironment;
