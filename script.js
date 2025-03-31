// Supabase configuration and initialization
const SUPABASE_URL = "https://lemcswschudgjuwmmyou.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbWNzd3NjaHVkZ2p1d21teW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMzc5NDgsImV4cCI6MjA1ODYxMzk0OH0.NE3suOS5G1cxLEgbqE9P0krSkd5_ZRga-6MZPnpBM8Q";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/***** App Data *****/
let template = []; // Loaded from Template Builder (or saved in cloud)
let logs = [];     // Array of log entry objects
let cloudDocId = null;  // Single row ID in Supabase
let currentUserId = null;

/***** Feedback & Confirm Helpers *****/
function showFeedback(message, type = 'success', duration = 1500) {
  const feedbackModal = document.getElementById('feedbackModal');
  const feedbackMessage = document.getElementById('feedbackMessage');
  const feedbackIcon = document.getElementById('feedbackIcon');

  feedbackMessage.textContent = message;
  if (type === 'success') {
    feedbackIcon.className = 'fas fa-check-circle text-5xl text-green-400 mb-4';
  } else if (type === 'error') {
    feedbackIcon.className = 'fas fa-exclamation-triangle text-5xl text-red-400 mb-4';
  } else if (type === 'info') {
    feedbackIcon.className = 'fas fa-info-circle text-5xl text-blue-400 mb-4';
  } else if (type === 'deleted') {
    feedbackIcon.className = 'fas fa-trash-alt text-5xl text-red-400 mb-4';
  } else if (type === 'download') {
    feedbackIcon.className = 'fas fa-download text-5xl text-purple-400 mb-4';
  }
  feedbackModal.classList.remove('hidden');
  setTimeout(() => feedbackModal.classList.add('hidden'), duration);
}

function confirmLogDeletion(logIndex) {
  const deleteConfirmModal = document.getElementById('deleteConfirmModal');
  deleteConfirmModal.classList.remove('hidden');

  const confirmBtn = document.getElementById('confirmDeleteBtn');
  const cancelBtn = document.getElementById('cancelDeleteBtn');

  confirmBtn.onclick = null;
  cancelBtn.onclick = null;

  confirmBtn.onclick = () => {
    performLogDeletion(logIndex);
    deleteConfirmModal.classList.add('hidden');
  };

  cancelBtn.onclick = () => {
    deleteConfirmModal.classList.add('hidden');
  };
}

function performLogDeletion(logIndex) {
  logs.splice(logIndex, 1);
  saveCloudData();
  renderLogEntries();
  showFeedback('Log Deleted Successfully!', 'deleted');
}

/***** Auth State Management *****/
async function checkAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  const wasJustRedirected = sessionStorage.getItem('redirectLogin');

  if (session) {
    currentUserId = session.user.id;
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    loadCloudData();
    if (wasJustRedirected) {
      showFeedback('Successfully Signed In!', 'success');
      sessionStorage.removeItem('redirectLogin');
    }
  } else {
    document.getElementById('authContainer').classList.remove('hidden');
    document.getElementById('appContainer').classList.add('hidden');
  }
}
supabaseClient.auth.onAuthStateChange((event, session) => { checkAuth(); });

/***** Auth Functions *****/
document.getElementById('loginButton').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) alert(error.message);
  else showFeedback('Successfully Signed In!', 'success');
});

document.getElementById('signupButton').addEventListener('click', async () => {
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const { error } = await supabaseClient.auth.signUp({ email, password });
  if (error) alert(error.message);
  else {
    alert("A confirmation link has been sent to your email. Please confirm your account and then log in.");
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
  }
});
document.getElementById('showSignup').addEventListener('click', () => {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('signupForm').classList.remove('hidden');
});
document.getElementById('showLogin').addEventListener('click', () => {
  document.getElementById('signupForm').classList.add('hidden');
  document.getElementById('loginForm').classList.remove('hidden');
});
document.getElementById('logoutButton').addEventListener('click', async () => {
  const logoutModal = document.getElementById('logoutModal');
  logoutModal.classList.remove('hidden');
  await new Promise(resolve => setTimeout(resolve, 800));
  await supabaseClient.auth.signOut();
  logoutModal.classList.add('hidden');
  checkAuth();
});
document.getElementById('googleSignInButton')?.addEventListener('click', async () => {
  sessionStorage.setItem('redirectLogin', true);
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: 'https://aanandaggarwal.github.io/logtrack/' }
  });
  if (error) alert(error.message);
});
document.getElementById('forgotPasswordLink')?.addEventListener('click', async () => {
  const email = prompt("Please enter your email for password reset:");
  if (email) {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.href });
    if (error) alert(error.message);
    else alert("Password reset email sent! Please check your inbox.");
  }
});

/***** Cloud Data Functions *****/
async function loadCloudData() {
  if (!currentUserId) return;
  const { data, error } = await supabaseClient
    .from('logtrack')
    .select('*')
    .eq('user_id', currentUserId)
    .maybeSingle();
  if (error) {
    console.error("Error fetching cloud data:", error);
    return;
  }
  if (data) {
    template = data.template || [];
    logs = data.logs || [];
    cloudDocId = data.id;
    renderTemplateTracks();
    renderLogEntries();
    document.getElementById('tutorial').classList.add('hidden');
  } else {
    console.log("No cloud data found; start by creating a new template.");
  }
}

async function saveCloudData() {
  const dataToSave = { template, logs, user_id: currentUserId };
  if (cloudDocId) {
    const { error } = await supabaseClient
      .from('logtrack')
      .update(dataToSave, { returning: 'minimal' })
      .eq('id', cloudDocId);
    if (error) console.error("Error updating cloud data:", error);
  } else {
    const { data: insertedData, error } = await supabaseClient
      .from('logtrack')
      .insert([dataToSave], { returning: 'representation' });
    if (error) console.error("Error saving cloud data:", error);
    else if (insertedData && insertedData[0]) cloudDocId = insertedData[0].id;
  }
}

/***** Template Builder Functions *****/
function updateTemplateFromDOM() {
  const templateTracks = document.getElementById('templateTracks');
  template = Array.from(templateTracks.querySelectorAll('.track-container')).map((trackDiv, trackIndex) => {
    const trackLabelInput = trackDiv.querySelector(`input[data-track-index="${trackIndex}"]`);
    const unitDivs = Array.from(trackDiv.querySelectorAll('.unit-container'));
    return {
      label: trackLabelInput.value,
      units: unitDivs.map((unitDiv, unitIndex) => {
        const unitLabelInput = unitDiv.querySelector(`input[data-unit-index="${unitIndex}"]`);
        const fieldContainers = Array.from(unitDiv.querySelectorAll('.field-container'));
        return {
          label: unitLabelInput.value,
          fields: fieldContainers.map(fieldDiv => {
            const fieldLabel = fieldDiv.querySelector('.field-label').value;
            const typeSelect = fieldDiv.querySelector('.field-type');
            const optionsInput = fieldDiv.querySelector('.field-options');
            return {
              label: fieldLabel,
              type: typeSelect ? typeSelect.value : 'text',
              options: optionsInput ? optionsInput.value : ''
            };
          })
        };
      })
    };
  });
}

function renderTemplateTracks() {
  const templateTracks = document.getElementById('templateTracks');
  templateTracks.innerHTML = '';
  template.forEach((track, tIndex) => {
    let trackHtml = `
      <div class="track-container bg-gray-800 border border-gray-700 rounded-md p-4 mb-4 space-y-4 animate__animated animate__fadeIn" data-id="${tIndex}">
        <div class="flex items-center space-x-4 handle-track cursor-move">
          <i class="fas fa-arrows-alt text-gray-400"></i>
          <input type="text" data-track-index="${tIndex}" value="${track.label}" class="bg-gray-700 text-white p-3 rounded font-mono text-xl flex-grow" placeholder="Prep Track Name" />
          <button class="delete-track-button text-red-500 hover:text-red-600" data-track-index="${tIndex}"><i class="fas fa-trash"></i></button>
        </div>
        <div class="units-container space-y-4">`;
    track.units.forEach((unit, uIndex) => {
      trackHtml += `
          <div class="unit-container bg-gray-700 border border-gray-600 rounded-md p-4 mb-4 space-y-4" data-id="${uIndex}">
            <div class="flex items-center space-x-4">
              <input type="text" data-unit-index="${uIndex}" value="${unit.label}" class="bg-gray-600 text-white p-3 rounded font-mono text-lg flex-grow" placeholder="Unit Label" />
              <button class="delete-unit-button text-red-500 hover:text-red-600" data-unit-index="${uIndex}" data-track-index="${tIndex}"><i class="fas fa-trash"></i></button>
            </div>
            <div class="fields-container space-y-2">`;
      unit.fields.forEach((field, fIndex) => {
        trackHtml += `
              <div class="field-container flex items-center space-x-2">
                <input type="text" class="field-label bg-gray-600 text-white p-3 rounded flex-grow font-mono" placeholder="Field Name" value="${field.label}" />
                <select class="field-type bg-gray-600 text-white p-2 rounded font-mono">
                  <option value="text" ${field.type==='text'?'selected':''}>Text</option>
                  <option value="number" ${field.type==='number'?'selected':''}>Number</option>
                  <option value="date" ${field.type==='date'?'selected':''}>Date</option>
                  <option value="textarea" ${field.type==='textarea'?'selected':''}>Textarea</option>
                  <option value="checkbox" ${field.type==='checkbox'?'selected':''}>Checkbox</option>
                  <option value="select" ${field.type==='select'?'selected':''}>Select</option>
                </select>
                <input type="text" class="field-options bg-gray-600 text-white p-3 rounded flex-grow font-mono ${field.type==='select'?'':'hidden'}" placeholder="Options (comma-separated)" value="${field.options || ''}" />
                <button class="delete-field-button text-red-500 hover:text-red-600" data-track-index="${tIndex}" data-unit-index="${uIndex}" data-field-index="${fIndex}"><i class="fas fa-trash"></i></button>
              </div>`;
      });
      trackHtml += `
            </div>
            <button class="add-field-button bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-mono" data-track-index="${tIndex}" data-unit-index="${uIndex}"><i class="fas fa-plus mr-1"></i> Add Field</button>
          </div>`;
    });
    trackHtml += `
        </div>
        <button class="add-unit-button bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-mono" data-track-index="${tIndex}"><i class="fas fa-plus mr-1"></i> Add Unit</button>
      </div>`;
    templateTracks.insertAdjacentHTML('beforeend', trackHtml);
  });
  initSortableTemplate();
  
  // Attach focus events for clearing default names:
  // For track names:
  document.querySelectorAll('#templateTracks input[data-track-index]').forEach(input => {
    input.addEventListener('focus', function() {
      if (this.value === 'Prep Track Name' || this.value === 'New Prep Track' || this.value === 'Unnamed Track') {
        this.value = '';
      }
    });
  });
  // For unit labels:
  document.querySelectorAll('#templateTracks input[data-unit-index]').forEach(input => {
    input.addEventListener('focus', function() {
      if (this.value === 'Unit Label' || this.value === 'New Unit' || this.value === 'Unnamed Unit') {
        this.value = '';
      }
    });
  });
  // For field labels:
  document.querySelectorAll('#templateTracks .field-label').forEach(input => {
    input.addEventListener('focus', function() {
      if (this.value === 'Field Name' || this.value === 'New Field' || this.value === 'Unnamed Field') {
        this.value = '';
      }
    });
  });
}


function initSortableTemplate() {
  const container = document.getElementById('templateTracks');
  new Sortable(container, { animation: 150, handle: '.handle-track' });
  document.querySelectorAll('.units-container').forEach(uc => {
    new Sortable(uc, { animation: 150 });
  });
}

/***** New / Edit Log Entry Form Functions *****/

/**
 * Renders the New or Edit log entry form.
 *   - "new" mode loads a deep copy of the template. Prefilled tracks/fields are rendered as static text (non-editable) with delete options.
 *   - "edit" mode loads the saved log entry so all track names, field labels/types, and values are fully editable.
 */
function renderLogEntryForm(mode = 'new', logData = null) {
  const formContainer = document.getElementById('logEntryForm');
  formContainer.innerHTML = `
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-semibold mb-4 text-purple-400">
        ${mode === 'new' ? '🚀 New Log Entry' : '🚀 Edit Log Entry'}
      </h2>
      <button id="closeLogEntryForm" type="button" class="text-gray-400 hover:text-red-500">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <form id="entryForm" class="space-y-4">
      <div class="mb-4">
        <label class="block font-semibold text-gray-300">Date</label>
        <input type="date" id="date" class="bg-gray-700 text-white p-3 rounded w-full">
      </div>
      <div class="mb-4">
        <label class="block font-semibold text-gray-300">Daily Notes</label>
        <textarea id="daily-notes" class="bg-gray-700 text-white p-3 rounded w-full" placeholder="Share your thoughts..."></textarea>
      </div>
      <div id="tracksContainer"></div>
      <button type="button" id="addNewTrackBtn" class="bg-purple-600 px-4 py-2 rounded">
        <i class="fas fa-plus mr-1"></i> Add New Track
      </button>
      <button type="submit" id="saveEntry" class="mt-4 bg-green-600 text-white px-4 py-2 rounded">
        ${mode === 'new' ? '💾 Save Log Entry' : '💾 Save Changes'}
      </button>
    </form>`;
  formContainer.classList.remove('hidden');

  document.getElementById('closeLogEntryForm').onclick = () => formContainer.classList.add('hidden');

  const dateEl = document.getElementById('date');
  dateEl.value = (mode === 'edit' && logData) ? logData.date : new Date().toISOString().split('T')[0];
  document.getElementById('daily-notes').value = (mode === 'edit' && logData) ? logData.dailyNotes : "";

  if (mode === 'edit' && logData) {
    renderTracksForEdit(logData.tracks);
  } else {
    renderTracksForNew();
  }

  document.getElementById('addNewTrackBtn').addEventListener('click', (e) => {
    e.preventDefault();
    const tracksContainer = document.getElementById('tracksContainer');
    addDynamicTrack(tracksContainer);
  });
  
  const saveEntryButton = document.getElementById('saveEntry');
  if (mode === 'new') {
    saveEntryButton.onclick = (e) => {
      e.preventDefault();
      saveNewLogEntry();
    };
  } else {
    saveEntryButton.onclick = (e) => {
      e.preventDefault();
      saveEditedLogEntry(logData);
    };
  }
}


/***** Helper Functions for New Log Entry *****/

// Render tracks for "new" mode: use a deep copy of the template where prefilled items are non-editable.
function renderTracksForNew() {
  const container = document.getElementById('tracksContainer');
  container.innerHTML = '';
  const tracks = JSON.parse(JSON.stringify(template));
  tracks.forEach(track => {
    const trackHtml = document.createElement('div');
    trackHtml.className = 'track-entry bg-gray-800 p-4 rounded mb-6 shadow-md animate__animated animate__fadeInUp';
    trackHtml.innerHTML = `
    <div class="flex justify-between items-center mb-2">
      <div class="flex items-center">
        <i class="fas fa-dumbbell text-purple-400 mr-2"></i>
        <span class="font-semibold text-purple-300 text-lg prefilled-track-label">${track.label}</span>
      </div>
      <button type="button" class="delete-track text-red-500"><i class="fas fa-trash"></i></button>
    </div>
    <div class="units-container space-y-4"></div>
    <button type="button" class="add-unit bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl mt-4">Add Unit</button>
  `;  
    trackHtml.querySelector('.delete-track').addEventListener('click', (e) => {
      e.preventDefault();
      trackHtml.classList.add('animate__fadeOut');
      setTimeout(() => trackHtml.remove(), 300);
    });
    const unitsContainer = trackHtml.querySelector('.units-container');
    track.units.forEach(unit => {
      renderPrefilledUnitNew(unitsContainer, unit);
    });
    trackHtml.querySelector('.add-unit').addEventListener('click', (e) => {
      e.preventDefault();
      addDynamicUnit(unitsContainer);
    });
    container.appendChild(trackHtml);
  });
}

// Render a prefilled unit for "new" mode: its label and fields are static (only delete option available)
function renderPrefilledUnitNew(unitsContainer, unitData) {
  const unitHtml = document.createElement('div');
  unitHtml.className = 'unit-entry bg-gray-700 p-3 rounded mb-3 animate__animated animate__fadeIn relative';
  unitHtml.innerHTML = `
    <div class="flex justify-between items-center mb-2">
      <span class="font-semibold text-gray-300 prefilled-unit-label">${unitData.label}</span>
      <button type="button" class="delete-unit text-red-500"><i class="fas fa-times-circle"></i></button>
    </div>
    <div class="fields-container"></div>
  `;
  unitHtml.querySelector('.delete-unit').addEventListener('click', (e) => {
    e.preventDefault();
    unitHtml.classList.add('animate__fadeOut');
    setTimeout(() => unitHtml.remove(), 300);
  });
  const fieldsContainer = unitHtml.querySelector('.fields-container');
  unitData.fields.forEach(field => {
    renderDynamicFieldNew(fieldsContainer, field);
  });
  unitsContainer.appendChild(unitHtml);
}

function addDynamicTrack(container = null) {
  const tracksContainer = container || document.getElementById('tracksContainer');
  if (!tracksContainer) {
    console.error("Tracks container not found");
    return;
  }
  
  let newTrack;
  if (template.length > 0) {
    // Clone the first track but only use its first unit.
    let defaultTrack = JSON.parse(JSON.stringify(template[0]));
    newTrack = {
      label: defaultTrack.label,
      units: defaultTrack.units.length > 0 ? [defaultTrack.units[0]] : [{
        label: "",
        fields: [{
          label: "",
          type: "text",
          options: ""
        }]
      }]
    };
  } else {
    newTrack = {
      label: "",
      units: [{
        label: "",
        fields: [{
          label: "",
          type: "text",
          options: ""
        }]
      }]
    };
  }
  
  const trackHtml = document.createElement('div');
  trackHtml.className = 'track-entry bg-gray-800 p-4 rounded mb-6 shadow-md animate__animated animate__fadeInUp';
  
  trackHtml.innerHTML = `
    <div class="flex justify-between items-center mb-2">
      <input type="text" placeholder="Track Name" class="track-label bg-gray-700 p-2 rounded flex-grow mr-2" value="">
      <button type="button" class="delete-track text-red-500"><i class="fas fa-trash"></i></button>
    </div>
    <div class="units-container"></div>
    <button type="button" class="add-unit bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl mt-4">Add Unit</button>
  `;
  
  // Clear default text on focus:
  const trackInput = trackHtml.querySelector('.track-label');
  trackInput.addEventListener('focus', function() {
    if (this.value === 'Track Name' || this.value === 'New Track' || this.value.trim() === '') {
      this.value = '';
    }
  });
  
  tracksContainer.appendChild(trackHtml);
  // Autoscroll new track into view:
  trackHtml.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  const unitsContainer = trackHtml.querySelector('.units-container');
  if (newTrack.units && newTrack.units.length > 0) {
    newTrack.units.forEach(unit => {
      renderDynamicUnit(unitsContainer, unit);
    });
  }
  
  // Bind the "Add Unit" button inside the new track:
  trackHtml.querySelector('.add-unit').addEventListener('click', (e) => {
    e.preventDefault();
    renderDynamicUnit(unitsContainer);
    const newUnit = unitsContainer.lastElementChild;
    if (newUnit) {
      newUnit.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  
  // Bind delete for the track:
  trackHtml.querySelector('.delete-track').addEventListener('click', (e) => {
    e.preventDefault();
    trackHtml.classList.add('animate__fadeOut');
    setTimeout(() => trackHtml.remove(), 300);
  });
}

// Add a dynamic, fully editable unit to the given container (for new log entry or when user adds a new unit)
function addDynamicUnit(unitsContainer) {
  const unitHtml = document.createElement('div');
  unitHtml.className = 'unit-entry bg-gray-700 p-3 rounded mb-3 animate__animated animate__fadeIn relative';
  unitHtml.innerHTML = `
    <div class="relative">
      <input type="text" placeholder="Unit Label" class="unit-label bg-gray-600 p-2 rounded w-full mb-2" value="">
      <button type="button" class="delete-unit absolute top-0 right-0 text-red-500"><i class="fas fa-times-circle"></i></button>
    </div>
    <div class="fields-container"></div>
    <button type="button" class="add-field bg-green-500 px-3 py-1 rounded mt-2"><i class="fas fa-plus"></i> Add Field</button>
  `;
  
  // Clear default text on focus:
  const unitInput = unitHtml.querySelector('.unit-label');
  unitInput.addEventListener('focus', function() {
    if (this.value === 'Unit Label' || this.value === 'New Unit' || this.value.trim() === '') {
      this.value = '';
    }
  });
  
  unitHtml.querySelector('.delete-unit').addEventListener('click', (e) => {
    e.preventDefault();
    unitHtml.classList.add('animate__fadeOut');
    setTimeout(() => unitHtml.remove(), 300);
  });
  
  const fieldsContainer = unitHtml.querySelector('.fields-container');
  unitHtml.querySelector('.add-field').addEventListener('click', (e) => {
    e.preventDefault();
    renderDynamicField(fieldsContainer);
    // Autoscroll new field into view:
    const newField = fieldsContainer.lastElementChild;
    if (newField) {
      newField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  
  unitsContainer.appendChild(unitHtml);
  // Autoscroll new unit into view:
  unitHtml.scrollIntoView({ behavior: 'smooth', block: 'center' });
}



// Render an individual unit in edit mode; its label and fields are fully editable.
function renderUnitEdit(unitsContainer, unitData) {
  const unitHtml = document.createElement('div');
  unitHtml.className = 'unit-entry bg-gray-700 p-3 rounded mb-3 animate__animated animate__fadeIn relative';
  unitHtml.innerHTML = `
    <div class="flex justify-between items-center mb-2">
      <input type="text" placeholder="Unit Label" class="unit-label bg-gray-600 p-2 rounded w-full" value="${unitData.label}">
      <button type="button" class="delete-unit text-red-500"><i class="fas fa-times-circle"></i></button>
    </div>
    <div class="fields-container"></div>
    <button type="button" class="add-field bg-green-500 px-3 py-1 rounded mt-2"><i class="fas fa-plus"></i> Add Field</button>
  `;
  unitHtml.querySelector('.delete-unit').addEventListener('click', (e) => {
    e.preventDefault();
    unitHtml.classList.add('animate__fadeOut');
    setTimeout(() => unitHtml.remove(), 300);
  });
  const fieldsContainer = unitHtml.querySelector('.fields-container');
  unitData.fields.forEach(field => {
    renderDynamicField(fieldsContainer, field);
  });
  unitHtml.querySelector('.add-field').addEventListener('click', (e) => {
    e.preventDefault();
    renderDynamicField(fieldsContainer);
  });
  unitsContainer.appendChild(unitHtml);
}

function renderTracksForEdit(tracks) {
  const container = document.getElementById('tracksContainer');
  container.innerHTML = '';
  tracks.forEach(track => {
    const trackHtml = document.createElement('div');
    trackHtml.className = 'track-entry bg-gray-800 p-4 rounded mb-6 shadow-md animate__animated animate__fadeInUp';
    trackHtml.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <div class="flex items-center">
          <i class="fas fa-dumbbell text-purple-400 mr-2"></i>
          <input type="text" placeholder="Track Name" class="track-label bg-gray-700 p-2 rounded flex-grow mr-2" value="${track.label}">
        </div>
        <button type="button" class="delete-track text-red-500"><i class="fas fa-trash"></i></button>
      </div>
      <div class="units-container space-y-4"></div>
      <button type="button" class="add-unit bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl mt-4">Add Unit</button>
    `;
    
    // Clear default text on focus:
    const trackInput = trackHtml.querySelector('.track-label');
    trackInput.addEventListener('focus', function() {
      if (this.value === 'Track Name' || this.value === 'New Track' || this.value.trim() === '') {
        this.value = '';
      }
    });
    
    // Delete button event:
    trackHtml.querySelector('.delete-track').addEventListener('click', (e) => {
      e.preventDefault();
      trackHtml.classList.add('animate__fadeOut');
      setTimeout(() => trackHtml.remove(), 300);
    });
    
    const unitsContainer = trackHtml.querySelector('.units-container');
    track.units.forEach(unit => {
      renderUnitEdit(unitsContainer, unit);
    });
    
    // Bind "Add Unit" button:
    trackHtml.querySelector('.add-unit').addEventListener('click', (e) => {
      e.preventDefault();
      addDynamicUnit(unitsContainer);
      const newUnit = unitsContainer.lastElementChild;
      if (newUnit) {
        newUnit.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    
    container.appendChild(trackHtml);
  });
}


/***** Dynamic Field Rendering *****/

// In new mode, fields are rendered as static text with delete option.
function renderDynamicFieldNew(fieldsContainer, fieldData = {}) {
  const fieldHtml = document.createElement('div');
  fieldHtml.className = 'field-entry mb-2 animate__animated animate__fadeIn';
  const labelText = fieldData.label || "";
  const typeText = fieldData.type || "text";
  const optionsText = fieldData.options || "";
  fieldHtml.innerHTML = `
    <div class="flex items-center space-x-2">
      <span class="prefilled-field-label font-semibold text-gray-300">${labelText}</span>
      <span class="prefilled-field-type text-gray-300">(${typeText})</span>
      ${ typeText === "select" ? `<span class="prefilled-field-options text-gray-300">[${optionsText}]</span>` : "" }
      <button type="button" class="delete-field text-red-500"><i class="fas fa-trash"></i></button>
    </div>
    <div class="mt-2 field-input"></div>
  `;
  fieldsContainer.appendChild(fieldHtml);
  // Autoscroll new field into view:
  fieldHtml.scrollIntoView({ behavior: 'smooth', block: 'center' });
  updateDynamicInput(typeText, fieldHtml.querySelector('.field-input'), "", optionsText);
  fieldHtml.querySelector('.delete-field').addEventListener('click', (e) => {
    e.preventDefault();
    fieldHtml.classList.add('animate__fadeOut');
    setTimeout(() => fieldHtml.remove(), 300);
  });
}


// In edit mode, dynamic fields are fully editable.
function renderDynamicField(fieldsContainer, fieldData = null) {
  const fieldHtml = document.createElement('div');
  fieldHtml.className = 'field-entry mb-2 animate__animated animate__fadeIn';
  fieldHtml.innerHTML = `
    <input type="text" placeholder="Field Label" class="field-label-input bg-gray-600 p-2 rounded mr-2" value="${fieldData ? fieldData.label : ''}">
    <select class="field-type bg-gray-600 p-2 rounded mr-2">
      <option value="text" ${fieldData?.type === 'text' ? 'selected' : ''}>Text</option>
      <option value="number" ${fieldData?.type === 'number' ? 'selected' : ''}>Number</option>
      <option value="date" ${fieldData?.type === 'date' ? 'selected' : ''}>Date</option>
      <option value="textarea" ${fieldData?.type === 'textarea' ? 'selected' : ''}>Textarea</option>
      <option value="checkbox" ${fieldData?.type === 'checkbox' ? 'selected' : ''}>Checkbox</option>
      <option value="select" ${fieldData?.type === 'select' ? 'selected' : ''}>Select</option>
    </select>
    <input type="text" placeholder="Options (comma-separated)" class="field-options bg-gray-600 p-2 rounded ${fieldData?.type === 'select' ? '' : 'hidden'}" value="${fieldData?.options || ''}">
    <button type="button" class="delete-field text-red-500"><i class="fas fa-trash"></i></button>
    <div class="mt-2 field-input"></div>
  `;
  
  fieldsContainer.appendChild(fieldHtml);
  // Autoscroll new field into view:
  fieldHtml.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  // Clear default field label on focus:
  const fieldLabelInput = fieldHtml.querySelector('.field-label-input');
  fieldLabelInput.addEventListener('focus', function() {
    if (this.value === 'Field Label' || this.value === 'New Field' || this.value.trim() === '') {
      this.value = '';
    }
  });
  
  const typeSelect = fieldHtml.querySelector('.field-type');
  const optionsInput = fieldHtml.querySelector('.field-options');
  const fieldInputContainer = fieldHtml.querySelector('.field-input');
  updateDynamicInput(typeSelect.value, fieldInputContainer, fieldData?.value || '', optionsInput.value);
  
  typeSelect.addEventListener('change', () => {
    optionsInput.classList.toggle('hidden', typeSelect.value !== 'select');
    updateDynamicInput(typeSelect.value, fieldInputContainer, '', optionsInput.value);
  });
  
  optionsInput.addEventListener('input', () => {
    if (typeSelect.value === 'select') {
      updateDynamicInput('select', fieldInputContainer, '', optionsInput.value);
    }
  });
  
  fieldHtml.querySelector('.delete-field').addEventListener('click', (e) => {
    e.preventDefault();
    fieldHtml.classList.add('animate__fadeOut');
    setTimeout(() => fieldHtml.remove(), 300);
  });
}

function renderDynamicUnit(unitsContainer, unitData = null) {
  const unitHtml = document.createElement('div');
  unitHtml.className = 'unit-entry bg-gray-700 p-3 rounded mb-3 animate__animated animate__fadeIn relative';
  unitHtml.innerHTML = `
    <div class="relative">
      <input type="text" placeholder="Unit Label" class="unit-label bg-gray-600 p-2 rounded w-full mb-2" value="">
      <button type="button" class="delete-unit absolute top-0 right-0 text-red-500"><i class="fas fa-times-circle"></i></button>
    </div>
    <div class="fields-container"></div>
    <button type="button" class="add-field bg-green-500 px-3 py-1 rounded mt-2"><i class="fas fa-plus"></i> Add Field</button>
  `;
  
  // Clear default text on focus:
  const unitInput = unitHtml.querySelector('.unit-label');
  unitInput.addEventListener('focus', function() {
    if (this.value === 'Unit Label' || this.value === 'New Unit' || this.value.trim() === '') {
      this.value = '';
    }
  });
  
  // Bind delete event for the unit:
  unitHtml.querySelector('.delete-unit').addEventListener('click', (e) => {
    e.preventDefault();
    unitHtml.classList.add('animate__fadeOut');
    setTimeout(() => unitHtml.remove(), 300);
  });
  
  // Bind "Add Field" button inside the unit:
  const fieldsContainer = unitHtml.querySelector('.fields-container');
  unitHtml.querySelector('.add-field').addEventListener('click', (e) => {
    e.preventDefault();
    console.log("Add Field button clicked in unit.");
    renderDynamicField(fieldsContainer);
    // Autoscroll the new field into view:
    const newField = fieldsContainer.lastElementChild;
    if (newField) {
      newField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  
  // Append the new unit to the provided container and autoscroll it into view:
  unitsContainer.appendChild(unitHtml);
  unitHtml.scrollIntoView({ behavior: 'smooth', block: 'center' });
}


// Updates the input element rendered below a field based on the selected type and options.
function updateDynamicInput(type, container, value = '', options = '') {
  container.innerHTML = '';
  let input;
  if (type === 'textarea') {
    input = document.createElement('textarea');
    input.value = value;
  } else if (type === 'checkbox') {
    input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = (value === true || value === 'true');
  } else if (type === 'select') {
    input = document.createElement('select');
    input.className = 'field-value bg-gray-600 p-2 rounded w-full';
    const opts = options.split(',').map(opt => opt.trim()).filter(Boolean);
    opts.forEach(opt => {
      const optionEl = document.createElement('option');
      optionEl.value = opt;
      optionEl.textContent = opt;
      input.appendChild(optionEl);
    });
    if (opts.includes(value)) input.value = value;
  } else {
    input = document.createElement('input');
    input.type = type;
    input.value = value;
  }
  input.classList.add('field-value', 'bg-gray-600', 'p-2', 'rounded', 'w-full');
  input.setAttribute('data-type', type);
  container.appendChild(input);
}

/***** Form Data & Save Functions *****/
function getLogEntryFormData() {
  const date = document.getElementById('date').value;
  const dailyNotes = document.getElementById('daily-notes').value;
  let tracks = [];
  const trackEntries = document.querySelectorAll('.track-entry');
  trackEntries.forEach(trackEntry => {
    const trackLabelInput = trackEntry.querySelector('.track-label');
    const trackLabel = trackLabelInput ? trackLabelInput.value : trackEntry.querySelector('.prefilled-track-label')?.textContent || "Unnamed Track";
    let trackData = { label: trackLabel, units: [] };
    const unitEntries = trackEntry.querySelectorAll('.unit-entry');
    unitEntries.forEach(unitEntry => {
      let unitData = { fields: [] };
      const unitLabelInput = unitEntry.querySelector('.unit-label');
      unitData.label = unitLabelInput ? unitLabelInput.value : unitEntry.querySelector('.prefilled-unit-label')?.textContent || "Unnamed Unit";
      const fieldEntries = unitEntry.querySelectorAll('.field-entry');
      fieldEntries.forEach(fieldEntry => {
        const fieldLabelInput = fieldEntry.querySelector('.field-label-input');
        const fieldLabel = fieldLabelInput ? fieldLabelInput.value : fieldEntry.querySelector('.prefilled-field-label')?.textContent || "Unnamed Field";
        const inputEl = fieldEntry.querySelector('.field-value');
        const fieldType = inputEl.getAttribute('data-type') || 'text';
        let value;
        if (fieldType === 'checkbox') value = inputEl.checked;
        else value = inputEl.value;
        unitData.fields.push({
          label: fieldLabel,
          type: fieldType,
          value: value,
          options: fieldType === 'select' ? fieldEntry.querySelector('.field-options')?.value || '' : ''
        });
      });
      trackData.units.push(unitData);
    });
    tracks.push(trackData);
  });
  return { date, dailyNotes, tracks };
}

// Extracts the structure (labels, types, options) from a log entry for comparing with the template.
function extractStructureFromLog(log) {
  let structure = [];
  log.tracks.forEach(track => {
    let newTrack = { label: track.label, units: [] };
    track.units.forEach(unit => {
      let newUnit = { label: unit.label, fields: [] };
      unit.fields.forEach(field => {
        newUnit.fields.push({
          label: field.label,
          type: field.type,
          options: field.options || ""
        });
      });
      newTrack.units.push(newUnit);
    });
    structure.push(newTrack);
  });
  return structure;
}

// Save new log entry, and update template if structures differ.
function saveNewLogEntry() {
  const newLog = getLogEntryFormData();
  let templateUpdated = false;
  if (JSON.stringify(extractStructureFromLog(newLog)) !== JSON.stringify(template)) {
    if (confirm("Your daily log structure differs from the current template. Update template with the new structure?")) {
      template = extractStructureFromLog(newLog);
      renderTemplateTracks();
      templateUpdated = true;
    }
  }
  logs.unshift(newLog);
  saveCloudData();
  renderLogEntries();
  document.getElementById('logEntryForm').classList.add('hidden');
  showFeedback('Log Entry Saved!');
  // Autoscroll back to top after saving a new log entry
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (templateUpdated) {
    setTimeout(() => { showFeedback('Template Updated Successfully!', 'info'); }, 1600);
  }
}


// Save edited log entry, with the same template-check.
function saveEditedLogEntry(originalLog) {
  const updatedLog = getLogEntryFormData();
  let templateUpdated = false;
  if (JSON.stringify(extractStructureFromLog(updatedLog)) !== JSON.stringify(template)) {
    if (confirm("Your daily log structure differs from the current template. Update template with the new structure?")) {
      template = extractStructureFromLog(updatedLog);
      renderTemplateTracks();
      templateUpdated = true;
    }
  }
  // Find and update the original log entry in logs array.
  const index = logs.findIndex(log => log.date === originalLog.date && log.dailyNotes === originalLog.dailyNotes);
  if (index !== -1) logs[index] = updatedLog;
  else logs.unshift(updatedLog);
  saveCloudData();
  renderLogEntries();
  document.getElementById('logEntryForm').classList.add('hidden');
  showFeedback('Log Entry Updated!');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (templateUpdated) {
    setTimeout(() => { showFeedback('Template Updated Successfully!', 'info'); }, 1600);
    
  }
}

/***** Rendering Log Entries *****/
function renderLogEntries(filteredLogs = logs) {
  const logEntriesDiv = document.getElementById('logEntries');
  logEntriesDiv.innerHTML = '';
  filteredLogs.forEach((log, index) => {
    const card = document.createElement('div');
    card.className = 'log-entry-card bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6 shadow-md transition transform hover:-translate-y-1 hover:shadow-lg animate__animated animate__fadeIn';
    
    const header = document.createElement('div');
    header.className = 'flex justify-between items-start mb-4';
    
    const dateEl = document.createElement('h3');
    dateEl.className = 'text-xl font-semibold text-purple-400';
    // Add a calendar emoji before the date
    dateEl.innerHTML = `<span title="Date">📅</span> ${log.date}`;
    
    const actionButtons = document.createElement('div');
    actionButtons.className = 'flex space-x-3';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'text-blue-400 hover:text-blue-500';
    editBtn.innerHTML = '<i class="fas fa-edit text-lg"></i>';
    editBtn.setAttribute('data-log-index', index);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'text-red-500 hover:text-red-600';
    deleteBtn.innerHTML = '<i class="fas fa-trash text-lg"></i>';
    deleteBtn.setAttribute('data-log-index', index);
    
    actionButtons.appendChild(editBtn);
    actionButtons.appendChild(deleteBtn);
    
    header.appendChild(dateEl);
    header.appendChild(actionButtons);
    
    const notes = document.createElement('p');
    notes.className = 'text-sm text-gray-300 mb-4';
    // Add a memo emoji for notes
    notes.innerHTML = `<span class="font-semibold text-gray-400">📝 Notes:</span> ${log.dailyNotes}`;
    
    card.appendChild(header);
    card.appendChild(notes);
    
    log.tracks.forEach(track => {
      const trackSection = document.createElement('div');
      trackSection.className = 'mb-5';
      
      const trackTitle = document.createElement('h4');
      trackTitle.className = 'text-lg font-semibold text-gray-100 mb-2 border-b border-gray-600 pb-1';
      // Prepend a dumbbell icon (already styled in purple) with an additional emoji (💪) for extra visual punch
      trackTitle.innerHTML = `<i class="fas fa-dumbbell text-purple-400 mr-2"></i><span title="Track">💪 ${track.label}</span>`;
      
      trackSection.appendChild(trackTitle);
      
      track.units.forEach(unit => {
        const unitBlock = document.createElement('div');
        unitBlock.className = 'bg-gray-700 p-4 rounded-xl mb-3 space-y-2';
        
        unit.fields.forEach(field => {
          const fieldRow = document.createElement('div');
          fieldRow.className = 'flex justify-between items-center';
          
          const label = document.createElement('span');
          label.className = 'text-sm font-medium text-gray-300';
          label.textContent = field.label;
          
          const value = document.createElement('span');
          value.className = 'text-sm text-gray-100';
          // Add an appropriate emoji based on field type (example: 📌 for text)
          const emoji = field.type === 'number' ? '🔢' : field.type === 'date' ? '📆' : field.type === 'checkbox' ? '✅' : '📌';
          value.innerHTML = `${emoji} ${field.value}`;
          
          fieldRow.appendChild(label);
          fieldRow.appendChild(value);
          unitBlock.appendChild(fieldRow);
        });
        
        trackSection.appendChild(unitBlock);
      });
      
      card.appendChild(trackSection);
    });
    
    logEntriesDiv.appendChild(card);
    
    // Bind events for edit and delete:
    editBtn.addEventListener('click', (e) => {
      const logIndex = e.currentTarget.getAttribute('data-log-index');
      editLogEntry(logIndex);
    });
    deleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const logIndex = e.currentTarget.getAttribute('data-log-index');
      confirmLogDeletion(logIndex);
    });
  });
}


function editLogEntry(logIndex) {
  const log = logs[logIndex];
  renderLogEntryForm('edit', log);
}

/***** Search Functionality *****/
function logMatchesSearch(log, term) {
  let searchText = log.date + " " + log.dailyNotes;
  log.tracks.forEach(track => {
    searchText += " " + track.label;
    track.units.forEach(unit => {
      searchText += " " + unit.label;
      unit.fields.forEach(field => {
        searchText += " " + field.label + " " + field.value;
      });
    });
  });
  return searchText.toLowerCase().includes(term);
}

/***** Event Listeners & Initialization *****/
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  document.getElementById('closeTutorial').addEventListener('click', () => {
    document.getElementById('tutorial').classList.add('hidden');
    if (template.length === 0) {
      document.getElementById('templateBuilder').classList.remove('hidden');
    }
  });
  document.getElementById('closeTemplateBuilder')?.addEventListener('click', () => {
    document.getElementById('templateBuilder').classList.add('hidden');
  });
  document.getElementById('newEntryButton').addEventListener('click', () => {
    renderLogEntryForm('new');
  });
  document.getElementById('templateButton').addEventListener('click', () => {
    document.getElementById('templateBuilder').classList.toggle('hidden');
    document.getElementById('logEntryForm').classList.add('hidden');
  });
  document.getElementById('addTrack').addEventListener('click', () => {
    updateTemplateFromDOM();
    template.push({
      label: 'New Prep Track',
      units: [{
        label: 'New Unit',
        fields: [{
          label: 'New Field',
          type: 'text',
          options: ''
        }]
      }]
    });
    renderTemplateTracks();
    saveCloudData();
    const lastTrack = document.querySelector('#templateTracks .track-container:last-child');
    if (lastTrack) {
      lastTrack.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  document.getElementById('templateTracks').addEventListener('click', (e) => {
    if (e.target.closest('.add-unit-button')) {
      updateTemplateFromDOM();
      const trackIndex = e.target.closest('.add-unit-button').getAttribute('data-track-index');
      template[trackIndex].units.push({
        label: 'New Unit',
        fields: [{
          label: 'New Field',
          type: 'text',
          options: ''
        }]
      });
      renderTemplateTracks();
      saveCloudData();
      const trackContainer = document.querySelector(`#templateTracks .track-container[data-id="${trackIndex}"]`);
      if (trackContainer) {
        trackContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
    if (e.target.closest('.add-field-button')) {
      updateTemplateFromDOM();
      const trackIndex = e.target.closest('.add-field-button').getAttribute('data-track-index');
      const unitIndex = e.target.closest('.add-field-button').getAttribute('data-unit-index');
      template[trackIndex].units[unitIndex].fields.push({
        label: 'New Field',
        type: 'text',
        options: ''
      });
      renderTemplateTracks();
      saveCloudData();
      const trackContainer = document.querySelector(`#templateTracks .track-container[data-id="${trackIndex}"]`);
      if (trackContainer) {
        trackContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    if (e.target.closest('.delete-track-button')) {
      updateTemplateFromDOM();
      const trackIndex = e.target.closest('.delete-track-button').getAttribute('data-track-index');
      template.splice(trackIndex, 1);
      renderTemplateTracks();
      saveCloudData();
    }
    if (e.target.closest('.delete-unit-button')) {
      updateTemplateFromDOM();
      const trackIndex = e.target.closest('.delete-unit-button').getAttribute('data-track-index');
      const unitIndex = e.target.closest('.delete-unit-button').getAttribute('data-unit-index');
      template[trackIndex].units.splice(unitIndex, 1);
      renderTemplateTracks();
      saveCloudData();
    }
    if (e.target.closest('.delete-field-button')) {
      updateTemplateFromDOM();
      const tIndex = e.target.closest('.delete-field-button').getAttribute('data-track-index');
      const uIndex = e.target.closest('.delete-field-button').getAttribute('data-unit-index');
      const fIndex = e.target.closest('.delete-field-button').getAttribute('data-field-index');
      template[tIndex].units[uIndex].fields.splice(fIndex, 1);
      renderTemplateTracks();
      saveCloudData();
    }
  });
  document.getElementById('templateTracks').addEventListener('change', (e) => {
    if (e.target && e.target.classList.contains('field-type')) {
      const fieldContainer = e.target.closest('.field-container');
      const optionsInput = fieldContainer.querySelector('.field-options');
      if (e.target.value === 'select') optionsInput.classList.remove('hidden');
      else optionsInput.classList.add('hidden');
    }
  });
  document.getElementById('saveTemplate').addEventListener('click', () => {
    updateTemplateFromDOM();
    localStorage.setItem('logtrackTemplate', JSON.stringify(template));
    document.getElementById('templateBuilder').classList.add('hidden');
    document.getElementById('tutorial').classList.add('hidden');
    saveCloudData();
    showFeedback('Template Saved Successfully!');
    // Autoscroll to top of the page after saving template
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });  
  document.getElementById('searchBar').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = logs.filter(log => logMatchesSearch(log, term));
    renderLogEntries(filtered);
  });
  document.getElementById('exportButton').addEventListener('click', () => {
    const dataStr = JSON.stringify({ template, logs }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logtrack-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback('Logs Exported Successfully!', 'download');
  });
  loadCloudData();
  const loadingScreen = document.getElementById('loadingScreen');
  loadingScreen.classList.add('animate__fadeOut');
  setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
});
