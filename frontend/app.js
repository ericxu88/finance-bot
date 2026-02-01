/**
 * Compass — Financial Intelligence Frontend
 * API integration and UI logic
 * 
 * Version: 2.0 - Fixed SSE parsing and response handling
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE = 'http://localhost:3000';
let currentConversationId = null;

// Analysis mode: 'fast' = single AI call, 'detailed' = multi-agent analysis
let analysisMode = 'fast';

// ============================================================================
// REQUEST STATE MANAGEMENT
// ============================================================================

let isProcessing = false;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // Minimum 1 second between requests
const MAX_MESSAGE_LENGTH = 1000; // Maximum characters per message

/**
 * Set the processing state and update UI accordingly
 */
function setProcessingState(processing) {
  isProcessing = processing;
  
  const input = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const suggestions = document.getElementById('chat-suggestions');
  
  if (input) {
    input.disabled = processing;
    input.placeholder = processing 
      ? 'Waiting for response...' 
      : 'Ask about saving, investing, budgeting...';
  }
  
  if (sendBtn) {
    sendBtn.disabled = processing;
    sendBtn.classList.toggle('loading', processing);
  }
  
  // Disable suggestion buttons while processing
  if (suggestions) {
    suggestions.querySelectorAll('.suggestion').forEach(btn => {
      btn.disabled = processing;
    });
  }
}

/**
 * Check if we can make a new request (rate limiting)
 */
function canMakeRequest() {
  if (isProcessing) {
    return { allowed: false, reason: 'A request is already in progress' };
  }
  
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = Math.ceil((MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000);
    return { allowed: false, reason: `Please wait ${waitTime} second(s) before sending another message` };
  }
  
  return { allowed: true };
}

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/**
 * Sanitize user input to prevent XSS and other issues
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Limit length
  if (sanitized.length > MAX_MESSAGE_LENGTH) {
    sanitized = sanitized.substring(0, MAX_MESSAGE_LENGTH);
  }
  
  // Remove control characters (except newlines)
  sanitized = sanitized.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized;
}

/**
 * Escape HTML to prevent XSS when displaying user content
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Validate message before sending
 */
function validateMessage(message) {
  if (!message || message.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` };
  }
  
  // Check for suspicious patterns (basic protection)
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(message)) {
      return { valid: false, error: 'Invalid characters in message' };
    }
  }
  
  return { valid: true };
}

// ============================================================================
// VIEW MANAGEMENT
// ============================================================================

function switchView(viewName) {
  // Update nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewName);
  });
  
  // Update views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.toggle('active', view.id === `view-${viewName}`);
  });
  
  // Load data for specific views
  if (viewName === 'dashboard') {
    loadDashboard();
  } else if (viewName === 'goals') {
    loadGoals();
  } else if (viewName === 'budget') {
    loadBudget();
  } else if (viewName === 'compare') {
    // Reset comparison view state
    document.getElementById('compare-results').style.display = 'none';
    document.getElementById('compare-loading').style.display = 'none';
  }
}

// Set up nav click handlers
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    switchView(item.dataset.view);
  });
});

// ============================================================================
// API HELPERS
// ============================================================================

async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ============================================================================
// DASHBOARD
// ============================================================================

async function loadDashboard() {
  try {
    // Load sample user data
    const [goalSummary, budgetAnalysis, reminder] = await Promise.all([
      fetchAPI('/goals/summary/sample'),
      fetchAPI('/budget/analysis/sample'),
      fetchAPI('/investments/reminders/sample'),
    ]);
    
    // Update assets (from goal summary context)
    updateAssetsDisplay();
    
    // Combine API goals with locally stored goals for dashboard
    const localGoalSummaries = userGoals.map(g => {
      const progress = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
      const deadline = new Date(g.deadline);
      const now = new Date();
      const monthsRemaining = Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24 * 30)));
      
      return {
        goalId: g.id,
        goalName: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        progress,
        monthsRemaining,
        isLocal: true,
      };
    });
    
    const allGoals = [...(goalSummary || []), ...localGoalSummaries];
    updateGoalsList(allGoals);
    
    // Update budget ring
    updateBudgetRing(budgetAnalysis);
    
    // Update reminder
    updateReminder(reminder);
    
  } catch (error) {
    console.error('Failed to load dashboard:', error);
  }
}

function updateAssetsDisplay() {
  // Using sample data values
  document.getElementById('total-assets').textContent = '$16,000';
  document.getElementById('checking-balance').textContent = '$3,000';
  document.getElementById('savings-balance').textContent = '$8,000';
  document.getElementById('investments-balance').textContent = '$5,000';
  document.getElementById('monthly-surplus').textContent = '$2,250';
}

function updateGoalsList(goals) {
  const container = document.getElementById('goals-list');
  if (!goals || goals.length === 0) {
    container.innerHTML = '<p class="card-detail">No goals found</p>';
    return;
  }
  
  const icons = {
    'Emergency Fund': '🛡️',
    'House Down Payment': '🏠',
    'Vacation': '✈️',
    default: '🎯'
  };
  
  const iconClasses = {
    'Emergency Fund': 'emergency',
    'House Down Payment': 'house',
    'Vacation': 'vacation'
  };
  
  container.innerHTML = goals.slice(0, 3).map(goal => {
    const progress = Math.min(100, goal.progress);
    const progressClass = progress < 25 ? 'low' : progress < 75 ? 'medium' : 'high';
    const icon = icons[goal.goalName] || icons.default;
    const iconClass = iconClasses[goal.goalName] || '';
    const escapedName = escapeHtml(goal.goalName);
    
    return `
      <div class="goal-item">
        <div class="goal-icon ${iconClass}">${icon}</div>
        <div class="goal-info">
          <div class="goal-name">${escapedName}</div>
          <div class="goal-progress-bar">
            <div class="goal-progress-fill ${progressClass}" style="width: ${progress}%"></div>
          </div>
        </div>
        <div class="goal-amount">${formatCurrency(goal.currentAmount)} / ${formatCurrency(goal.targetAmount)}</div>
      </div>
    `;
  }).join('');
}

function updateBudgetRing(response) {
  // Backend returns { analysis: { totalBudget, totalSpent, ... } }
  const analysis = response.analysis || response;
  const totalBudget = analysis.totalBudget || 750;
  const totalSpent = analysis.totalSpent || 0;
  const percentUsed = Math.min(100, (totalSpent / totalBudget) * 100);
  
  // Update ring progress
  const circumference = 251.2;
  const offset = circumference - (percentUsed / 100) * circumference;
  const progressRing = document.getElementById('budget-progress');
  if (progressRing) {
    progressRing.style.strokeDashoffset = offset;
  }
  
  // Update text
  document.getElementById('budget-percent').textContent = `${Math.round(percentUsed)}%`;
  document.getElementById('budget-spent').textContent = formatCurrency(totalSpent);
  document.getElementById('budget-total').textContent = formatCurrency(totalBudget);
  
  // Update badge
  const badge = document.getElementById('budget-badge');
  if (percentUsed > 100) {
    badge.textContent = 'Over Budget';
    badge.className = 'card-badge negative';
  } else if (percentUsed > 80) {
    badge.textContent = 'Warning';
    badge.className = 'card-badge warning';
  } else {
    badge.textContent = 'On Track';
    badge.className = 'card-badge positive';
  }
}

function updateReminder(reminder) {
  const messageEl = document.getElementById('reminder-message');
  
  if (reminder && reminder.shouldRemind && reminder.message) {
    messageEl.textContent = reminder.message;
  } else {
    messageEl.textContent = "You're on track! No investment actions needed right now.";
  }
}

function refreshDashboard() {
  loadDashboard();
}

// ============================================================================
// GOALS VIEW
// ============================================================================

async function loadGoals() {
  try {
    const apiGoals = await fetchAPI('/goals/summary/sample');
    const container = document.getElementById('goals-detail-list');
    
    // Combine API goals with locally stored goals
    const localGoalSummaries = userGoals.map(g => {
      const progress = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
      const deadline = new Date(g.deadline);
      const now = new Date();
      const monthsRemaining = Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24 * 30)));
      const remaining = g.targetAmount - g.currentAmount;
      const monthlyNeeded = monthsRemaining > 0 ? remaining / monthsRemaining : remaining;
      
      let status = 'on_track';
      if (progress >= 100) status = 'completed';
      else if (monthsRemaining === 0) status = 'at_risk';
      else if (monthlyNeeded > 1000) status = 'behind';
      
      return {
        goalId: g.id,
        goalName: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        progress,
        monthsRemaining,
        monthlyNeeded,
        status,
        isLocal: true, // Mark as locally stored
      };
    });
    
    const allGoals = [...(apiGoals || []), ...localGoalSummaries];
    
    if (allGoals.length === 0) {
      container.innerHTML = '<p class="empty-state">No goals yet. Click "Add Goal" to create your first financial goal!</p>';
      return;
    }
    
    container.innerHTML = allGoals.map(goal => {
      const progress = Math.min(100, goal.progress);
      const escapedName = escapeHtml(goal.goalName);
      
      return `
        <div class="goal-card ${goal.isLocal ? 'goal-local' : ''}">
          <div class="goal-card-header">
            <div>
              <h3 class="goal-card-title">${escapedName}</h3>
              <p class="goal-card-deadline">
                ${goal.monthsRemaining > 0 
                  ? `${goal.monthsRemaining} months remaining` 
                  : 'Deadline passed'}
              </p>
            </div>
            <div class="goal-card-actions">
              <span class="card-badge ${getStatusClass(goal.status)}">${formatStatus(goal.status)}</span>
              ${goal.isLocal ? `<button class="btn-icon" onclick="deleteGoal('${goal.goalId}')" title="Delete goal">🗑</button>` : ''}
            </div>
          </div>
          
          <div class="goal-card-progress">
            <div class="goal-card-bar">
              <div class="goal-card-fill" style="width: ${progress}%"></div>
            </div>
            <div class="goal-card-amounts">
              <span class="goal-card-current">${formatCurrency(goal.currentAmount)}</span>
              <span class="goal-card-target">${formatCurrency(goal.targetAmount)}</span>
            </div>
          </div>
          
          <div class="goal-card-stats">
            <div class="goal-stat">
              <div class="goal-stat-value">${Math.round(progress)}%</div>
              <div class="goal-stat-label">Progress</div>
            </div>
            <div class="goal-stat">
              <div class="goal-stat-value">${formatCurrency(goal.monthlyNeeded)}</div>
              <div class="goal-stat-label">Monthly Needed</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Failed to load goals:', error);
  }
}

function getStatusClass(status) {
  const classes = {
    'on_track': 'positive',
    'behind': 'warning',
    'at_risk': 'negative',
    'completed': 'positive'
  };
  return classes[status] || 'neutral';
}

function formatStatus(status) {
  const labels = {
    'on_track': 'On Track',
    'behind': 'Behind',
    'at_risk': 'At Risk',
    'completed': 'Completed'
  };
  return labels[status] || status;
}

// ============================================================================
// BUDGET VIEW
// ============================================================================

async function loadBudget() {
  try {
    const response = await fetchAPI('/budget/analysis/sample');
    const container = document.getElementById('budget-categories');
    
    // Backend returns { analysis: { categories: [...], ... }, message: "...", metadata: {...} }
    const categories = response.analysis?.categories || [];
    
    if (categories.length === 0) {
      container.innerHTML = '<p>No budget categories found</p>';
      return;
    }
    
    container.innerHTML = categories.map(cat => {
      const percent = Math.min(100, cat.percentUsed);
      const escapedName = escapeHtml(cat.name);
      const remaining = cat.monthlyBudget - cat.currentSpent;
      
      return `
        <div class="budget-card">
          <div class="budget-card-header">
            <h3 class="budget-card-title">${escapedName}</h3>
            <span class="card-badge ${getStatusClass(cat.status === 'over' ? 'at_risk' : cat.status === 'warning' ? 'behind' : 'on_track')}">
              ${cat.status === 'over' ? 'Over' : cat.status === 'warning' ? 'Warning' : 'Good'}
            </span>
          </div>
          
          <div class="budget-card-bar">
            <div class="budget-card-fill ${cat.status}" style="width: ${percent}%"></div>
          </div>
          
          <div class="budget-card-amounts">
            <span>${formatCurrency(cat.currentSpent)} spent</span>
            <span>${formatCurrency(Math.max(0, remaining))} left</span>
          </div>
          
          ${cat.subcategories && cat.subcategories.length > 0 ? `
            <div class="budget-subcategories">
              ${cat.subcategories.map(sub => `
                <div class="budget-subcategory">
                  <span>${escapeHtml(sub.name)}</span>
                  <div class="budget-subcategory-bar">
                    <div class="budget-subcategory-fill" style="width: ${Math.min(100, sub.percentUsed)}%"></div>
                  </div>
                  <span>${formatCurrency(sub.currentSpent)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
    
    // Also load underspending and upcoming expenses data
    await Promise.all([
      loadUnderspending(),
      loadUpcomingExpenses(),
    ]);
    
  } catch (error) {
    console.error('Failed to load budget:', error);
  }
}

async function loadUnderspending() {
  try {
    const response = await fetchAPI('/budget/underspending/sample');
    const analysis = response.analysis;
    
    const section = document.getElementById('underspending-section');
    const summaryEl = document.getElementById('underspending-summary');
    const categoriesEl = document.getElementById('underspending-categories');
    const recommendationEl = document.getElementById('underspending-recommendation');
    
    if (!analysis.hasUnderspending) {
      section.style.display = 'none';
      return;
    }
    
    section.style.display = 'block';
    summaryEl.textContent = analysis.summary;
    
    // Render underspending categories
    categoriesEl.innerHTML = analysis.categories.map(cat => `
      <div class="underspending-category">
        <div class="underspending-category-info">
          <span class="underspending-category-name">${escapeHtml(cat.categoryName)}</span>
          <span class="underspending-category-detail">
            ${cat.percentUsed.toFixed(0)}% used of ${formatCurrency(cat.monthlyBudget)} budget
          </span>
        </div>
        <span class="underspending-category-amount">+${formatCurrency(cat.surplusAmount)}</span>
      </div>
    `).join('');
    
    // Render top recommendation
    if (analysis.topRecommendation) {
      const rec = analysis.topRecommendation;
      recommendationEl.innerHTML = `
        <div class="underspending-recommendation-text">
          <strong>${rec.description}</strong>
          <span>${rec.reasoning}</span>
        </div>
        <button class="btn btn-primary btn-sm" onclick="applyUnderspendingSuggestion('${rec.type}', ${rec.amount})">
          Apply
        </button>
      `;
    } else {
      recommendationEl.innerHTML = '';
    }
    
  } catch (error) {
    console.error('Failed to load underspending:', error);
    document.getElementById('underspending-section').style.display = 'none';
  }
}

function applyUnderspendingSuggestion(type, amount) {
  // Navigate to chat with a pre-filled suggestion
  switchView('chat');
  const input = document.getElementById('message-input');
  if (input) {
    input.value = `I want to ${type} $${amount.toLocaleString()}`;
    input.focus();
  }
}

async function loadUpcomingExpenses() {
  try {
    const response = await fetchAPI('/budget/upcoming/sample');
    const analysis = response.analysis;
    
    const section = document.getElementById('upcoming-expenses-section');
    const summaryEl = document.getElementById('upcoming-summary');
    const listEl = document.getElementById('upcoming-list');
    
    if (!analysis.hasUpcoming) {
      section.style.display = 'none';
      return;
    }
    
    section.style.display = 'block';
    summaryEl.textContent = analysis.summary;
    
    // Render upcoming expenses list
    listEl.innerHTML = analysis.expenses.slice(0, 5).map(exp => {
      const dueDate = new Date(exp.dueDate);
      const formattedDate = dueDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      const dueDateClass = exp.urgency === 'immediate' ? 'urgent' : '';
      const itemClass = exp.urgency === 'immediate' ? 'immediate' : exp.urgency === 'soon' ? 'soon' : '';
      
      return `
        <div class="upcoming-item ${itemClass}">
          <div class="upcoming-item-info">
            <span class="upcoming-item-name">${escapeHtml(exp.name)}</span>
            <span class="upcoming-item-date ${dueDateClass}">
              ${exp.daysUntilDue <= 0 ? 'Overdue!' : exp.daysUntilDue === 1 ? 'Due tomorrow' : `Due ${formattedDate}`}
              ${exp.daysUntilDue > 1 ? ` (${exp.daysUntilDue} days)` : ''}
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-sm);">
            ${exp.urgency === 'immediate' ? '<span class="upcoming-badge immediate">Urgent</span>' : ''}
            ${exp.isRecurring ? '<span class="upcoming-badge recurring">Recurring</span>' : ''}
            <span class="upcoming-item-amount">${formatCurrency(exp.amount)}</span>
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Failed to load upcoming expenses:', error);
    document.getElementById('upcoming-expenses-section').style.display = 'none';
  }
}

// ============================================================================
// CHAT
// ============================================================================

async function sendMessage(event) {
  event.preventDefault();
  
  // Check rate limiting
  const requestCheck = canMakeRequest();
  if (!requestCheck.allowed) {
    showToast(requestCheck.reason, 'warning');
    return;
  }
  
  const input = document.getElementById('message-input');
  const rawMessage = input.value;
  
  // Sanitize input
  const message = sanitizeInput(rawMessage);
  
  // Validate message
  const validation = validateMessage(message);
  if (!validation.valid) {
    showToast(validation.error, 'error');
    return;
  }
  
  // Clear input immediately
  input.value = '';
  
  // Update request time
  lastRequestTime = Date.now();
  
  // Set processing state (disables input/button)
  setProcessingState(true);
  
  // Add user message to chat (escaped for display)
  addMessage('user', escapeHtml(message));
  
  // Hide suggestions after first message
  document.getElementById('chat-suggestions').style.display = 'none';
  
  // Show reasoning indicator
  const reasoningId = showReasoningIndicator();
  
  try {
    // Use streaming endpoint
    await streamChat(message, reasoningId);
  } catch (error) {
    removeReasoningIndicator(reasoningId);
    addMessage('assistant', "I'm having trouble connecting to the server. Please make sure the API is running on port 3000.");
  } finally {
    // Always re-enable input
    setProcessingState(false);
  }
}

function sendSuggestion(text) {
  // Check if we can make a request first
  const requestCheck = canMakeRequest();
  if (!requestCheck.allowed) {
    showToast(requestCheck.reason, 'warning');
    return;
  }
  
  document.getElementById('message-input').value = text;
  sendMessage(new Event('submit'));
}

function openAdvisor(prompt) {
  switchView('chat');
  if (prompt) {
    setTimeout(() => {
      // Check if we can make a request
      const requestCheck = canMakeRequest();
      if (!requestCheck.allowed) {
        // Just show the prompt in the input, don't auto-send
        document.getElementById('message-input').value = prompt;
        return;
      }
      
      document.getElementById('message-input').value = prompt;
      sendMessage(new Event('submit'));
    }, 300);
  }
}

/**
 * Toggle between fast and detailed analysis modes
 */
function toggleAnalysisMode() {
  analysisMode = analysisMode === 'fast' ? 'detailed' : 'fast';
  updateModeToggleUI();
  
  const modeLabel = analysisMode === 'fast' ? 'Quick Analysis' : 'Deep Analysis';
  showToast(`Switched to ${modeLabel} mode`, 'info');
}

function updateModeToggleUI() {
  const toggle = document.getElementById('mode-toggle');
  if (toggle) {
    toggle.classList.toggle('detailed', analysisMode === 'detailed');
    const label = toggle.querySelector('.mode-label');
    if (label) {
      label.textContent = analysisMode === 'fast' ? 'Quick' : 'Deep';
    }
  }
}

async function streamChat(message, reasoningId) {
  const body = {
    message,
    mode: analysisMode  // Use selected mode instead of hardcoded 'fast'
  };
  
  if (currentConversationId) {
    body.conversationId = currentConversationId;
  }
  
  try {
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let messageEl = null;
    let hasReceivedContent = false;
    let currentEventType = null;
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      // Append new data to buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines
      const lines = buffer.split('\n');
      // Keep the last potentially incomplete line in buffer
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        // Parse SSE format: "event: eventName" and "data: {json}"
        if (line.startsWith('event: ')) {
          currentEventType = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          
          if (dataStr === '[DONE]') {
            continue;
          }
          
          try {
            const data = JSON.parse(dataStr);
            
            // Remove reasoning indicator on first meaningful event
            if (reasoningId && !hasReceivedContent && (currentEventType === 'complete' || currentEventType === 'intent')) {
              removeReasoningIndicator(reasoningId);
              reasoningId = null;
              hasReceivedContent = true;
            }
            
            // Handle different event types from the backend
            if (currentEventType === 'status') {
              // Status updates - could update the reasoning indicator text
              console.log('Status:', data.message);
            } else if (currentEventType === 'intent') {
              console.log('Intent parsed:', data.type, 'confidence:', data.confidence);
            } else if (currentEventType === 'analysis') {
              console.log('Analysis available');
            } else if (currentEventType === 'complete') {
              // Final response - display it
              if (reasoningId) {
                removeReasoningIndicator(reasoningId);
                reasoningId = null;
              }
              
              if (data.conversationId) {
                currentConversationId = data.conversationId;
              }
              
              // Display the reply
              if (data.reply) {
                if (!messageEl) {
                  messageEl = addMessage('assistant', '', true);
                }
                updateMessageContent(messageEl, data.reply);
              }
            } else if (currentEventType === 'error') {
              if (reasoningId) {
                removeReasoningIndicator(reasoningId);
                reasoningId = null;
              }
              if (!messageEl) {
                messageEl = addMessage('assistant', '', true);
              }
              updateMessageContent(messageEl, `Error: ${data.message || 'Unknown error'}`);
            }
          } catch (e) {
            // Not JSON, might be partial data
            console.warn('Failed to parse SSE data:', dataStr);
          }
        }
        // Empty line marks end of an event in SSE
        else if (line === '') {
          currentEventType = null;
        }
      }
    }
    
    // If we never received content, remove the reasoning indicator and show error
    if (reasoningId) {
      removeReasoningIndicator(reasoningId);
    }
    
    // If no message was displayed, show a fallback
    if (!hasReceivedContent && !messageEl) {
      addMessage('assistant', "I received your message but couldn't generate a response. Please try again.");
    }
    
  } catch (error) {
    console.error('Stream error:', error);
    if (reasoningId) {
      removeReasoningIndicator(reasoningId);
    }
    // Fall back to non-streaming
    await sendChatFallback(message);
  }
}

async function sendChatFallback(message) {
  const reasoningId = showReasoningIndicator();
  
  try {
    const body = {
      message,
      mode: analysisMode  // Use selected mode
    };
    
    if (currentConversationId) {
      body.conversationId = currentConversationId;
    }
    
    const response = await fetchAPI('/chat', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    removeReasoningIndicator(reasoningId);
    
    if (response.conversationId) {
      currentConversationId = response.conversationId;
    }
    
    // Backend returns { reply: "...", conversationId: "...", ... }
    addMessage('assistant', response.reply || 'No response received');
    
  } catch (error) {
    console.error('Chat fallback error:', error);
    removeReasoningIndicator(reasoningId);
    addMessage('assistant', "I couldn't process that request. Please try again.");
  }
}

function addMessage(role, content, returnElement = false) {
  const container = document.getElementById('chat-messages');
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  
  const avatar = role === 'assistant' ? '◈' : 'S';
  
  // Content is already escaped for user messages
  const displayContent = role === 'user' ? content : formatMessageContent(content);
  
  messageDiv.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-content">${displayContent}</div>
  `;
  
  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
  
  if (returnElement) {
    return messageDiv;
  }
}

function updateMessageContent(messageEl, content) {
  const contentEl = messageEl.querySelector('.message-content');
  if (contentEl) {
    contentEl.innerHTML = formatMessageContent(content);
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
  }
}

function formatMessageContent(content) {
  if (!content) return '';
  
  // Convert markdown-like formatting (content from assistant is trusted)
  let formatted = content
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Code
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    // Lists (simple)
    .replace(/^- (.*)/gm, '<li>$1</li>');
  
  // Wrap in paragraph if not already structured
  if (!formatted.startsWith('<')) {
    formatted = `<p>${formatted}</p>`;
  }
  
  // Wrap consecutive li elements in ul
  formatted = formatted.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');
  
  return formatted;
}

/**
 * Show reasoning/thinking indicator while AI processes
 */
function showReasoningIndicator() {
  const container = document.getElementById('chat-messages');
  const id = 'reasoning-' + Date.now();
  
  const reasoningDiv = document.createElement('div');
  reasoningDiv.id = id;
  reasoningDiv.className = 'message assistant reasoning';
  reasoningDiv.innerHTML = `
    <div class="message-avatar">◈</div>
    <div class="message-content">
      <div class="reasoning-indicator">
        <div class="reasoning-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <div class="reasoning-text">
          <span class="reasoning-title">Analyzing your request</span>
          <span class="reasoning-detail">Evaluating financial implications...</span>
        </div>
      </div>
    </div>
  `;
  
  container.appendChild(reasoningDiv);
  container.scrollTop = container.scrollHeight;
  
  // Cycle through different reasoning messages
  const messages = [
    { title: 'Analyzing your request', detail: 'Evaluating financial implications...' },
    { title: 'Running simulations', detail: 'Comparing different scenarios...' },
    { title: 'Checking constraints', detail: 'Verifying against your guardrails...' },
    { title: 'Preparing response', detail: 'Formatting recommendations...' },
  ];
  
  let messageIndex = 0;
  const intervalId = setInterval(() => {
    messageIndex = (messageIndex + 1) % messages.length;
    const titleEl = reasoningDiv.querySelector('.reasoning-title');
    const detailEl = reasoningDiv.querySelector('.reasoning-detail');
    if (titleEl && detailEl) {
      titleEl.textContent = messages[messageIndex].title;
      detailEl.textContent = messages[messageIndex].detail;
    }
  }, 2000);
  
  // Store interval ID for cleanup
  reasoningDiv.dataset.intervalId = intervalId;
  
  return id;
}

function removeReasoningIndicator(id) {
  const reasoning = document.getElementById(id);
  if (reasoning) {
    // Clear the interval
    const intervalId = reasoning.dataset.intervalId;
    if (intervalId) {
      clearInterval(parseInt(intervalId));
    }
    reasoning.remove();
  }
}

// Legacy function for backwards compatibility
function showTyping() {
  return showReasoningIndicator();
}

function removeTyping(id) {
  removeReasoningIndicator(id);
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================

function showToast(message, type = 'info') {
  // Remove existing toasts
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================================================
// UTILITIES
// ============================================================================

function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================================================
// GOAL MANAGEMENT
// ============================================================================

// Local storage for user-created goals (since we don't have a database)
let userGoals = JSON.parse(localStorage.getItem('userGoals') || '[]');

function showAddGoalModal() {
  const modal = document.getElementById('add-goal-modal');
  modal.style.display = 'flex';
  
  // Set default deadline to 1 year from now
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  document.getElementById('goal-deadline').value = oneYearFromNow.toISOString().split('T')[0];
  
  // Focus the name input
  setTimeout(() => document.getElementById('goal-name').focus(), 100);
}

function hideAddGoalModal() {
  const modal = document.getElementById('add-goal-modal');
  modal.style.display = 'none';
  document.getElementById('add-goal-form').reset();
}

async function createGoal(event) {
  event.preventDefault();
  
  const name = document.getElementById('goal-name').value.trim();
  const targetAmount = parseFloat(document.getElementById('goal-amount').value);
  const currentAmount = parseFloat(document.getElementById('goal-current').value) || 0;
  const deadline = document.getElementById('goal-deadline').value;
  const priority = parseInt(document.getElementById('goal-priority').value) || 5;
  
  if (!name || !targetAmount || !deadline) {
    showToast('Please fill in all required fields', 'error');
    return;
  }
  
  const newGoal = {
    id: `goal_${Date.now()}`,
    name,
    targetAmount,
    currentAmount,
    deadline,
    priority,
    createdAt: new Date().toISOString(),
  };
  
  try {
    // Try to save to backend (if endpoint exists)
    const response = await fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGoal),
    });
    
    if (response.ok) {
      const savedGoal = await response.json();
      showToast(`Goal "${name}" created successfully!`, 'success');
    } else {
      // If backend doesn't support it yet, save locally
      saveGoalLocally(newGoal);
    }
  } catch (error) {
    // Backend not available or endpoint doesn't exist, save locally
    saveGoalLocally(newGoal);
  }
  
  hideAddGoalModal();
  loadGoals();
}

function saveGoalLocally(goal) {
  userGoals.push(goal);
  localStorage.setItem('userGoals', JSON.stringify(userGoals));
  showToast(`Goal "${goal.name}" saved locally`, 'success');
}

function deleteGoal(goalId) {
  if (!confirm('Are you sure you want to delete this goal?')) return;
  
  userGoals = userGoals.filter(g => g.id !== goalId);
  localStorage.setItem('userGoals', JSON.stringify(userGoals));
  showToast('Goal deleted', 'info');
  loadGoals();
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// ============================================================================
// COMPARISON VIEW
// ============================================================================

async function runPresetComparison(preset) {
  let options;
  
  switch (preset) {
    case 'save-vs-invest':
      options = [
        { type: 'save', amount: 500 },
        { type: 'invest', amount: 500 }
      ];
      break;
    case 'small-vs-large':
      options = [
        { type: 'invest', amount: 300 },
        { type: 'invest', amount: 700 }
      ];
      break;
    case 'goals':
      options = [
        { type: 'save', amount: 400, goalId: 'vacation' },
        { type: 'invest', amount: 400, goalId: 'house' }
      ];
      break;
    default:
      return;
  }
  
  await runComparison(options);
}

async function runCustomComparison(event) {
  event.preventDefault();
  
  const action1 = document.getElementById('compare-action-1').value;
  const amount1 = parseInt(document.getElementById('compare-amount-1').value);
  const action2 = document.getElementById('compare-action-2').value;
  const amount2 = parseInt(document.getElementById('compare-amount-2').value);
  
  if (!amount1 || !amount2) {
    showToast('Please enter valid amounts for both options', 'error');
    return;
  }
  
  const options = [
    { type: action1, amount: amount1 },
    { type: action2, amount: amount2 }
  ];
  
  await runComparison(options);
}

async function runComparison(options) {
  // Show loading
  document.getElementById('compare-loading').style.display = 'flex';
  document.getElementById('compare-results').style.display = 'none';
  
  try {
    const response = await fetchAPI('/compare', {
      method: 'POST',
      body: JSON.stringify({
        actions: options,
        user: getSampleUserProfile()
      })
    });
    
    displayComparisonResults(response);
  } catch (error) {
    console.error('Comparison failed:', error);
    showToast('Failed to compare options. Please try again.', 'error');
  } finally {
    document.getElementById('compare-loading').style.display = 'none';
  }
}

function displayComparisonResults(results) {
  const cardsContainer = document.getElementById('compare-cards');
  const recommendationBox = document.getElementById('compare-recommendation');
  const resultsSection = document.getElementById('compare-results');
  
  // Find the recommended option (highest score or shouldProceed)
  let recommendedIndex = 0;
  if (results.comparisons) {
    results.comparisons.forEach((comp, idx) => {
      if (comp.analysis?.shouldProceed && !results.comparisons[recommendedIndex].analysis?.shouldProceed) {
        recommendedIndex = idx;
      }
    });
  }
  
  // Build comparison cards
  const comparisons = results.comparisons || [];
  cardsContainer.innerHTML = comparisons.map((comp, idx) => {
    const isRecommended = idx === recommendedIndex;
    const simulation = comp.simulation || {};
    const analysis = comp.analysis || {};
    const scenario = simulation.scenarioIfDo || {};
    const action = simulation.action || comp.action || {};
    
    // Calculate metrics
    const accountsAfter = scenario.accountsAfter || {};
    const goalImpacts = scenario.goalImpacts || [];
    
    return `
      <div class="compare-card ${isRecommended ? 'recommended' : ''}">
        <div class="compare-card-header">
          <span class="compare-card-title">
            ${capitalizeFirst(action.type || 'Action')} $${(action.amount || 0).toLocaleString()}
          </span>
          <span class="compare-card-badge ${isRecommended ? 'recommended' : 'alternative'}">
            ${isRecommended ? 'Recommended' : 'Alternative'}
          </span>
        </div>
        <div class="compare-card-body">
          <div class="compare-metric">
            <span class="compare-metric-label">Checking After</span>
            <span class="compare-metric-value">${formatCurrency(accountsAfter.checking)}</span>
          </div>
          <div class="compare-metric">
            <span class="compare-metric-label">Savings After</span>
            <span class="compare-metric-value">${formatCurrency(accountsAfter.savings)}</span>
          </div>
          <div class="compare-metric">
            <span class="compare-metric-label">Liquidity Impact</span>
            <span class="compare-metric-value ${getLiquidityClass(scenario.liquidityImpact)}">
              ${scenario.liquidityImpact || 'No change'}
            </span>
          </div>
          <div class="compare-metric">
            <span class="compare-metric-label">Confidence</span>
            <span class="compare-metric-value">${capitalizeFirst(analysis.overallConfidence || 'medium')}</span>
          </div>
          
          ${goalImpacts.length > 0 ? `
            <div class="compare-goals">
              <h4>Goal Impact</h4>
              ${goalImpacts.map(g => `
                <div class="compare-goal-item">
                  <span class="compare-goal-name">${escapeHtml(g.goalName)}</span>
                  <span class="compare-goal-impact positive">
                    ${g.progressChangePct > 0 ? '+' : ''}${g.progressChangePct.toFixed(1)}%
                  </span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  // Build recommendation
  const recommendedComp = comparisons[recommendedIndex];
  const recommendedAction = recommendedComp?.simulation?.action || recommendedComp?.action || {};
  
  recommendationBox.innerHTML = `
    <h4>💡 Analysis</h4>
    <p>
      Based on your current financial situation, 
      <strong>${capitalizeFirst(recommendedAction.type || 'the first option')}ing $${(recommendedAction.amount || 0).toLocaleString()}</strong>
      ${recommendedComp?.analysis?.finalRecommendation || 'is the recommended choice for your financial goals.'}
    </p>
  `;
  
  // Show results
  resultsSection.style.display = 'block';
}

function getLiquidityClass(impact) {
  if (!impact) return 'neutral';
  const lower = impact.toLowerCase();
  if (lower.includes('fully liquid') || lower.includes('improves') || lower.includes('increases')) {
    return 'positive';
  }
  if (lower.includes('reduced') || lower.includes('decreases') || lower.includes('less')) {
    return 'negative';
  }
  return 'neutral';
}

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getSampleUserProfile() {
  // Return a sample user profile for comparison requests
  return {
    id: 'user-sarah',
    name: 'Sarah',
    monthlyIncome: 5000,
    accounts: {
      checking: 3000,
      savings: 8000,
      investments: {
        taxable: { balance: 5000, allocation: { stocks: 0.7, bonds: 0.2, cash: 0.1 } },
        rothIRA: { balance: 0, allocation: { stocks: 0.8, bonds: 0.2, cash: 0 } },
        traditional401k: { balance: 0, allocation: { stocks: 0.6, bonds: 0.3, cash: 0.1 } }
      }
    },
    fixedExpenses: [
      { id: 'rent', name: 'Rent', amount: 1500, frequency: 'monthly' },
      { id: 'utilities', name: 'Utilities', amount: 150, frequency: 'monthly' },
      { id: 'car', name: 'Car Payment', amount: 350, frequency: 'monthly' }
    ],
    spendingCategories: [
      { id: 'groceries', name: 'Groceries', monthlyBudget: 400, currentSpent: 250 },
      { id: 'dining', name: 'Dining Out', monthlyBudget: 200, currentSpent: 120 },
      { id: 'entertainment', name: 'Entertainment', monthlyBudget: 150, currentSpent: 80 }
    ],
    goals: [
      { id: 'emergency', name: 'Emergency Fund', targetAmount: 15000, currentAmount: 8000, deadline: '2025-06-01', priority: 1 },
      { id: 'vacation', name: 'Vacation', targetAmount: 3000, currentAmount: 1200, deadline: '2024-12-01', priority: 2 },
      { id: 'house', name: 'House Down Payment', targetAmount: 60000, currentAmount: 5000, deadline: '2027-01-01', priority: 3 }
    ],
    preferences: {
      riskTolerance: 'moderate',
      liquidityPreference: 'medium',
      guardrails: [
        { id: 'min-checking', rule: 'Never let checking drop below $1,000', type: 'min_balance', accountId: 'checking', threshold: 1000 }
      ],
      investmentPreferences: {
        autoInvestEnabled: false,
        reminderFrequency: 'monthly',
        lastReminderDate: '2024-01-01'
      }
    },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: new Date().toISOString()
  };
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Load dashboard on start
  loadDashboard();
  
  // Set up time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const h1 = document.querySelector('.view-dashboard h1');
  if (h1) {
    h1.textContent = `${greeting}, Sarah`;
  }
  
  // Set up keyboard shortcut (Enter to send, Shift+Enter for newline)
  const messageInput = document.getElementById('message-input');
  if (messageInput) {
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const form = document.querySelector('.chat-input');
        if (form && !isProcessing) {
          sendMessage(new Event('submit'));
        }
      }
    });
  }
});
