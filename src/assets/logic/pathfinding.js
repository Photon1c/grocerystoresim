// src/assets/logic/pathfinding.js
import * as THREE from 'three';

// Check if a position collides with any obstacle (AABB)
export function checkCollision(position, obstacles, radius = 0.5) {
  const sphere = new THREE.Sphere(new THREE.Vector3(position.x, position.y, position.z), radius);
  for (const box of obstacles) {
    if (box.intersectsSphere(sphere)) {
      return true;
    }
  }
  return false;
}

// Stub: pathfinding (to be implemented)
export function findPath(start, end, obstacles) {
  // Return an array of waypoints from start to end
  // To be implemented
  return [start, end];
} 