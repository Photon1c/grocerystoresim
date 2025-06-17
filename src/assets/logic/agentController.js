import { updateCustomerAgents } from '../agents/customer_agents.js';
import { updateWorkerAgents } from '../agents/worker_agents.js';
// In the future, import worker update logic as needed

export function updateAllAgents({ customers, workers }, delta, scene, time) {
  updateCustomerAgents(customers, delta, scene);
  updateWorkerAgents(workers, delta, time);
  // Add worker update logic here if/when needed
} 