// src/assets/gui/stats.js

import * as THREE from 'three';

// Store stats for each customer by id
const customerStats = new Map();

export function initCustomerStats(customer, id, items) {
  customerStats.set(id, {
    timeInStore: 0,
    money: 20 + Math.random() * 80, // $20–$100
    itemsNeeded: items.length,
    items,
    mood: 100,
    lastMood: 100,
    lastUpdate: performance.now()
  });
}

export function updateCustomerStats(id, delta, mood) {
  const stats = customerStats.get(id);
  if (!stats) return;
  stats.timeInStore += delta;
  stats.lastMood = stats.mood;
  stats.mood = mood;
}

export function getCustomerStats(id) {
  return customerStats.get(id);
}

// Simple HTML overlay for stats display
let statsDiv = null;
let statsToggleBtn = null;
let statsVisible = false;
export function renderStatsOverlay(customers) {
  if (!statsDiv) {
    statsDiv = document.createElement('div');
    statsDiv.style.position = 'fixed';
    statsDiv.style.top = '50px';
    statsDiv.style.right = '10px';
    statsDiv.style.background = 'rgba(0,0,0,0.7)';
    statsDiv.style.color = '#fff';
    statsDiv.style.padding = '10px';
    statsDiv.style.fontFamily = 'monospace';
    statsDiv.style.zIndex = 1000;
    statsDiv.style.maxHeight = '90vh';
    statsDiv.style.overflowY = 'auto';
    document.body.appendChild(statsDiv);
  }
  if (!statsToggleBtn) {
    statsToggleBtn = document.createElement('button');
    statsToggleBtn.textContent = 'Hide Stats';
    statsToggleBtn.style.position = 'fixed';
    statsToggleBtn.style.top = '10px';
    statsToggleBtn.style.right = '10px';
    statsToggleBtn.style.zIndex = '1001';
    statsToggleBtn.style.padding = '6px 16px';
    statsToggleBtn.style.background = '#222';
    statsToggleBtn.style.color = '#fff';
    statsToggleBtn.style.border = 'none';
    statsToggleBtn.style.borderRadius = '8px';
    statsToggleBtn.style.fontSize = '1em';
    statsToggleBtn.style.cursor = 'pointer';
    statsToggleBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
    statsToggleBtn.addEventListener('click', () => {
      statsVisible = !statsVisible;
      statsDiv.style.display = statsVisible ? 'block' : 'none';
      statsToggleBtn.textContent = statsVisible ? 'Hide Stats' : 'Show Stats';
    });
    document.body.appendChild(statsToggleBtn);
    // Add Git link below
    const gitLink = document.createElement('a');
    gitLink.href = 'https://github.com/Photon1c/grocerystoresim';
    gitLink.target = '_blank';
    gitLink.textContent = 'Git';
    gitLink.style.position = 'fixed';
    gitLink.style.top = '46px';
    gitLink.style.right = '18px';
    gitLink.style.zIndex = '1001';
    gitLink.style.fontSize = '0.98em';
    gitLink.style.color = '#1976d2';
    gitLink.style.background = 'none';
    gitLink.style.border = 'none';
    gitLink.style.textDecoration = 'underline';
    gitLink.style.cursor = 'pointer';
    gitLink.style.fontFamily = 'system-ui, sans-serif';
    gitLink.style.fontWeight = 'bold';
    document.body.appendChild(gitLink);
  }
  if (!statsVisible) {
    statsDiv.style.display = 'none';
    statsToggleBtn.textContent = 'Show Stats';
    return;
  } else {
    statsDiv.style.display = 'block';
    statsToggleBtn.textContent = 'Hide Stats';
  }
  let html = `<b>Customer Stats</b><br/>`;
  customers.forEach((agent, i) => {
    const stats = customerStats.get(i);
    if (!stats) return;
    const collected = agent.itemsCollected ? agent.itemsCollected.length : 0;
    let shoppingListSummary = '';
    if (agent && agent.shoppingList) {
      shoppingListSummary = agent.shoppingList.map(item => `${item.name} (Aisle ${item.aisle})`).join(', ');
    } else if (stats.items) {
      shoppingListSummary = stats.items.map(item => (item.name ? `${item.name} (Aisle ${item.aisle})` : item)).join(', ');
    }
    html += `#${i+1}: Time: ${stats.timeInStore.toFixed(1)}s, $${stats.money.toFixed(2)}, Items: ${collected}/${stats.itemsNeeded}, Mood: <span style=\"color:${stats.mood > 70 ? '#4caf50' : stats.mood > 40 ? '#ffb300' : '#e53935'}\">${Math.round(stats.mood)}</span> ${(stats.mood < 40 ? '😠' : stats.mood < 70 ? '😐' : '😊')}<br/><span style='font-size:0.95em;color:#bbb;'>${shoppingListSummary}</span><br/>`;
  });
  statsDiv.innerHTML = html;
}

let cardDiv = null;
let selectedCustomerId = null;

export function enableCustomerClickStats(customers, camera, renderer) {
  // Set up raycaster and mouse event
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  renderer.domElement.addEventListener('click', (event) => {
    // Calculate mouse position in normalized device coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const meshes = customers.map(a => a.mesh);
    const intersects = raycaster.intersectObjects(meshes, false);
    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      const id = customers.findIndex(a => a.mesh === mesh);
      if (id !== -1) {
        selectedCustomerId = id;
        showStatsCard(id);
      }
    } else {
      hideStatsCard();
    }
  });
}

function showStatsCard(id) {
  if (!cardDiv) {
    cardDiv = document.createElement('div');
    cardDiv.style.position = 'fixed';
    cardDiv.style.left = '50%';
    cardDiv.style.top = '20%';
    cardDiv.style.transform = 'translate(-50%, 0)';
    cardDiv.style.background = 'rgba(30,30,40,0.95)';
    cardDiv.style.color = '#fff';
    cardDiv.style.padding = '24px 32px';
    cardDiv.style.borderRadius = '16px';
    cardDiv.style.boxShadow = '0 8px 32px rgba(0,0,0,0.25)';
    cardDiv.style.fontFamily = 'system-ui, sans-serif';
    cardDiv.style.fontSize = '1.1em';
    cardDiv.style.zIndex = 2000;
    cardDiv.style.minWidth = '260px';
    cardDiv.style.textAlign = 'left';
    document.body.appendChild(cardDiv);
  }
  updateStatsCard(id);
  cardDiv.style.display = 'block';
}

function hideStatsCard() {
  if (cardDiv) cardDiv.style.display = 'none';
  selectedCustomerId = null;
}

export function updateStatsCardRealtime() {
  if (selectedCustomerId !== null) {
    updateStatsCard(selectedCustomerId);
  }
}

function updateStatsCard(id) {
  const stats = getCustomerStats(id);
  if (!stats) return;
  const agent = window.customers ? window.customers[id] : null;
  let shoppingListHtml = '';
  if (agent && agent.shoppingList) {
    for (let i = 0; i < agent.shoppingList.length; i++) {
      const item = agent.shoppingList[i];
      const collected = agent.itemsCollected && agent.itemsCollected.find(col => col.name === item.name);
      shoppingListHtml += `<li style='${collected ? 'text-decoration:line-through;color:#aaa;' : ''}'>${item.name} <span style="color:#888;font-size:0.9em;">(Aisle ${item.aisle})</span></li>`;
    }
  } else if (stats.items) {
    shoppingListHtml = stats.items.map(item => {
      if (item.name && item.aisle) {
        return `<li>${item.name} <span style=\"color:#888;font-size:0.9em;\">(Aisle ${item.aisle})</span></li>`;
      } else {
        return `<li>${item}</li>`;
      }
    }).join('');
  }
  cardDiv.innerHTML = `
    <div style="font-weight:bold;font-size:1.2em;margin-bottom:8px;">Customer #${id+1}</div>
    <div><b>Time in Store:</b> ${stats.timeInStore.toFixed(1)}s</div>
    <div><b>Money:</b> $${stats.money.toFixed(2)}</div>
    <div><b>Items Collected:</b> ${agent && agent.itemsCollected ? agent.itemsCollected.length : 0} / ${stats.itemsNeeded}</div>
    <div><b>Shopping List:</b> <ul style='margin:4px 0 8px 18px;padding:0;'>${shoppingListHtml}</ul></div>
    <div><b>Mood:</b> <span style="color:${stats.mood > 70 ? '#4caf50' : stats.mood > 40 ? '#ffb300' : '#e53935'}">${Math.round(stats.mood)}</span> ${(stats.mood < 40 ? '😠' : stats.mood < 70 ? '😐' : '😊')}</div>
    <div style="margin-top:12px;font-size:0.95em;color:#aaa;">Click outside the card to close.</div>
  `;
}

// Optionally, hide card on outside click
window.addEventListener('mousedown', (e) => {
  if (cardDiv && cardDiv.style.display === 'block' && !cardDiv.contains(e.target)) {
    hideStatsCard();
  }
});
