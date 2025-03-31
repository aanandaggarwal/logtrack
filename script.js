// Supabase configuration and initialization
const SUPABASE_URL = "https://lemcswschudgjuwmmyou.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbWNzd3NjaHVkZ2p1d21teW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMzc5NDgsImV4cCI6MjA1ODYxMzk0OH0.NE3suOS5G1cxLEgbqE9P0krSkd5_ZRga-6MZPnpBM8Q";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/***** App Data *****/
let template = []; // Loaded from template builder
let logs = []; // Array of log entry objects
let cloudDocId = null; // Single row ID in Supabase
let currentUserId = null;

function showFeedback(message, type = 'success', duration = 1500) {
  const feedbackModal = document.getElementById('feedbackModal');
  const feedbackMessage = document.getElementById('feedbackMessage');
  const feedbackIcon = document.getElementById('feedbackIcon');

  feedbackMessage.textContent = message;

  // Customize based on feedback type
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

  setTimeout(() => {
    feedbackModal.classList.add('hidden');
  }, duration);
}

function confirmLogDeletion(logIndex) {
  const deleteConfirmModal = document.getElementById('deleteConfirmModal');
  deleteConfirmModal.classList.remove('hidden');

  const confirmBtn = document.getElementById('confirmDeleteBtn');
  const cancelBtn = document.getElementById('cancelDeleteBtn');

  // Clean previous listeners
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

// Perform actual deletion and show feedback
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


supabaseClient.auth.onAuthStateChange((event, session) => {
  checkAuth();
});

/***** Auth Functions *****/
document.getElementById('loginButton').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    alert(error.message);
  } else {
    showFeedback('Successfully Signed In!', 'success');
  }
});


document.getElementById('signupButton').addEventListener('click', async () => {
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const { error } = await supabaseClient.auth.signUp({ email, password });
  if (error) {
    alert(error.message);
  } else {
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
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay for UI effect
  await supabaseClient.auth.signOut();
  logoutModal.classList.add('hidden');
  checkAuth();
});

document.getElementById('googleSignInButton')?.addEventListener('click', async () => {
  sessionStorage.setItem('redirectLogin', true);
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://aanandaggarwal.github.io/logtrack/'
    }
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

/***** Load & Save Cloud Data *****/
async function loadCloudData() {
  if (!currentUserId) {
    console.log("No current user found, skipping cloud data load.");
    return;
  }
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
    if (error) {
      console.error("Error updating cloud data:", error);
    }
  } else {
    const { data: insertedData, error } = await supabaseClient
      .from('logtrack')
      .insert([dataToSave], { returning: 'minimal' });
    if (error) {
      console.error("Error saving cloud data:", error);
    } else {
      cloudDocId = insertedData[0].id;
    }
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
}

function initSortableTemplate() {
  const container = document.getElementById('templateTracks');
  new Sortable(container, {
    animation: 150,
    handle: '.handle-track'
  });
  document.querySelectorAll('.units-container').forEach(uc => {
    new Sortable(uc, { animation: 150 });
  });
}

/***** New / Edit Log Entry Form *****/
function renderLogEntryForm(mode = 'new', logData = null) {
  const formContainer = document.getElementById('logEntryForm');
  formContainer.innerHTML = `
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-semibold mb-4 text-purple-400">${mode === 'new' ? 'New Log Entry' : 'Edit Log Entry'}</h2>
      <button id="closeLogEntryForm" class="text-gray-400 hover:text-red-500"><i class="fas fa-times"></i></button>
    </div>
    <form id="entryForm" class="space-y-4">
      <div class="mb-4">
        <label class="block font-semibold text-gray-300">Date</label>
        <input type="date" id="date" class="bg-gray-700 text-white p-3 rounded w-full">
      </div>
      <div class="mb-4">
        <label class="block font-semibold text-gray-300">Daily Notes</label>
        <textarea id="daily-notes" class="bg-gray-700 text-white p-3 rounded w-full"></textarea>
      </div>
      <div id="tracksContainer"></div>
      <button id="addNewTrackBtn" class="bg-purple-600 px-4 py-2 rounded">Add New Track</button>
      <button id="saveEntry" class="mt-4 bg-green-600 text-white px-4 py-2 rounded">
        ${mode === 'new' ? 'Save Log Entry' : 'Save Changes'}
      </button>
    </form>`;

  formContainer.classList.remove('hidden');
  document.getElementById('closeLogEntryForm').onclick = () => formContainer.classList.add('hidden');

  document.getElementById('date').value = mode === 'edit' && logData ? logData.date : new Date().toISOString().split('T')[0];
  document.getElementById('daily-notes').value = mode === 'edit' && logData ? logData.dailyNotes : "";

  renderTracks(mode, logData);

  document.getElementById('addNewTrackBtn').addEventListener('click', (e) => {
    e.preventDefault();
    addDynamicTrack();
  });
}

// Add these new functions for dynamic entry editing:
function addDynamicTrack(trackData = null, container = null) {
  const tracksContainer = container || document.getElementById('tracksContainer');
  const trackHtml = document.createElement('div');
  trackHtml.className = 'track-entry bg-gray-800 p-4 rounded mb-4 animate__fadeIn';

  trackHtml.innerHTML = `
    <div class="flex justify-between items-center">
      <input type="text" placeholder="Track Name" class="track-label bg-gray-700 p-2 rounded flex-grow mr-2" value="${trackData ? trackData.label : ''}">
      <button class="delete-track text-red-500"><i class="fas fa-trash"></i></button>
    </div>
    <div class="units-container mt-3"></div>
    <button class="add-unit bg-blue-500 px-3 py-1 rounded mt-3"><i class="fas fa-plus"></i> Add Unit</button>`;

  tracksContainer.appendChild(trackHtml);
  if (window.innerWidth < 768) {
    trackHtml.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
  

  trackHtml.querySelector('.delete-track').onclick = (e) => {
    e.preventDefault();
    trackHtml.remove();
  };

  const unitsContainer = trackHtml.querySelector('.units-container');

  if (trackData && trackData.units) {
    trackData.units.forEach(unit => {
      renderDynamicUnit(unitsContainer, unit);
    });
  }

  trackHtml.querySelector('.add-unit').onclick = (e) => {
    e.preventDefault();
    renderDynamicUnit(unitsContainer);
  };
}


function renderDynamicUnit(unitsContainer, unitData = null) {
  const unitHtml = document.createElement('div');
  unitHtml.className = 'unit-entry bg-gray-700 p-3 rounded mb-3 animate__fadeIn';

  unitHtml.innerHTML = `
    <input type="text" placeholder="Unit Label" class="unit-label bg-gray-600 p-2 rounded w-full mb-2" value="${unitData ? unitData.label : ''}">
    <div class="fields-container"></div>
    <button class="add-field bg-green-500 px-3 py-1 rounded mt-2"><i class="fas fa-plus"></i> Add Field</button>`;

  unitsContainer.appendChild(unitHtml);
  if (window.innerWidth < 768) {
    trackHtml.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
  
  const fieldsContainer = unitHtml.querySelector('.fields-container');

  if (unitData && unitData.fields) {
    unitData.fields.forEach(field => {
      renderDynamicField(fieldsContainer, field);
    });
  }

  unitHtml.querySelector('.add-field').onclick = (e) => {
    e.preventDefault();
    renderDynamicField(fieldsContainer);
  };
}


function renderDynamicField(fieldsContainer, fieldData = null) {
  const fieldHtml = document.createElement('div');
  fieldHtml.className = 'field-entry mb-2 animate__fadeIn';

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
    <button class="delete-field text-red-500"><i class="fas fa-trash"></i></button>
    <div class="mt-2 field-input"></div>`;

  fieldsContainer.appendChild(fieldHtml);
  if (window.innerWidth < 768) {
    fieldHtml.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
  
  const typeSelect = fieldHtml.querySelector('.field-type');
  const optionsInput = fieldHtml.querySelector('.field-options');
  const fieldInputContainer = fieldHtml.querySelector('.field-input');

  // Initial input render
  updateDynamicInput(typeSelect.value, fieldInputContainer, fieldData?.value || '', optionsInput.value);

  // On field type change
  typeSelect.addEventListener('change', () => {
    const type = typeSelect.value;
    optionsInput.classList.toggle('hidden', type !== 'select');
    updateDynamicInput(type, fieldInputContainer, '', optionsInput.value);
  });

  // On options change (if type is select)
  optionsInput.addEventListener('input', () => {
    if (typeSelect.value === 'select') {
      updateDynamicInput('select', fieldInputContainer, '', optionsInput.value);
    }
  });

  fieldHtml.querySelector('.delete-field').onclick = () => fieldHtml.remove();
}

function updateDynamicInput(type, container, value = '', options = '') {
  container.innerHTML = '';
  let input;

  if (type === 'textarea') {
    input = document.createElement('textarea');
    input.value = value;
  } else if (type === 'checkbox') {
    input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = value === true || value === 'true';
  } else if (type === 'select') {
    input = document.createElement('select');
    input.className = 'field-value bg-gray-600 p-2 rounded w-full';
    input.setAttribute('data-type', 'select');

    const opts = options.split(',').map(opt => opt.trim()).filter(Boolean);
    opts.forEach(opt => {
      const optionEl = document.createElement('option');
      optionEl.value = opt;
      optionEl.textContent = opt;
      input.appendChild(optionEl);
    });

    if (opts.includes(value)) {
      input.value = value;
    }
  } else {
    input = document.createElement('input');
    input.type = type;
    input.value = value;
  }

  input.classList.add('field-value', 'bg-gray-600', 'p-2', 'rounded', 'w-full');
  input.setAttribute('data-type', type);
  container.appendChild(input);
}

// Enhanced renderTracks and renderUnit with smooth animations and scroll fix
function renderTracks(mode = 'new', logData = null) {
  const container = document.getElementById('tracksContainer');
  container.innerHTML = '';

  const tracks = mode === 'edit' && logData ? logData.tracks : template;

  tracks.forEach((track, tIdx) => {
    const trackHtml = document.createElement('div');
    trackHtml.className = 'track-entry bg-gray-800 p-4 rounded-2xl mb-6 shadow-md transition transform hover:-translate-y-1 hover:shadow-lg animate__animated animate__fadeInUp';
    trackHtml.innerHTML = `
      <div class="flex justify-between items-center">
        <h3 class="font-semibold text-purple-300 text-lg flex items-center gap-2"><i class="fas fa-dumbbell"></i> ${track.label}</h3>
        <button class="delete-track text-red-500"><i class="fas fa-trash"></i></button>
      </div>
      <div class="units-container mt-4 space-y-4"></div>
      <button class="add-unit bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl mt-4 transition" title="Add another unit to this track"><i class="fas fa-plus mr-1"></i> Add Unit</button>`;

    trackHtml.querySelector('.delete-track').onclick = () => trackHtml.remove();

    const unitsContainer = trackHtml.querySelector('.units-container');
    const unitData = mode === 'edit' && logData ? track.units : [{}];

    renderUnit(unitsContainer, track.units[0].fields);

    trackHtml.querySelector('.add-unit').onclick = (e) => {
      e.preventDefault(); // Prevents scroll jump
      renderUnit(unitsContainer, track.units[0].fields);
    };

    container.appendChild(trackHtml);
  });
}

function renderUnit(container, fieldsTemplate, prefilled = false) {
  const unitHtml = document.createElement('div');
  unitHtml.className = 'unit-entry bg-gray-700 p-4 rounded-xl border-l-4 border-purple-500 relative animate__animated animate__fadeInUp';

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'absolute top-2 right-2 text-red-400 hover:text-red-500';
  deleteBtn.innerHTML = '<i class="fas fa-times-circle"></i>';
  deleteBtn.onclick = () => {
    unitHtml.classList.add('animate__fadeOut');
    setTimeout(() => unitHtml.remove(), 300);
  };
  unitHtml.appendChild(deleteBtn);

  fieldsTemplate.forEach(field => {
    const fieldEntry = document.createElement('div');
    fieldEntry.className = 'field-entry mb-2 animate__animated animate__fadeInUp';

    const label = document.createElement('label');
    label.className = 'font-semibold text-gray-300';
    label.textContent = field.label;

    let inputElement;
    if (field.type === 'textarea') {
      inputElement = document.createElement('textarea');
    } else if (field.type === 'checkbox') {
      inputElement = document.createElement('input');
      inputElement.type = 'checkbox';
    } else if (field.type === 'select') {
      inputElement = document.createElement('select');
      const options = (field.options || '').split(',').map(opt => opt.trim()).filter(Boolean);
      options.forEach(opt => {
        const optEl = document.createElement('option');
        optEl.value = opt;
        optEl.textContent = opt;
        inputElement.appendChild(optEl);
      });
    } else {
      inputElement = document.createElement('input');
      inputElement.type = field.type;
    }

    inputElement.className = 'field-value bg-gray-600 p-2 rounded w-full transition duration-200';
    inputElement.setAttribute('data-type', field.type);

    fieldEntry.appendChild(label);
    fieldEntry.appendChild(inputElement);
    unitHtml.appendChild(fieldEntry);
  });

  container.appendChild(unitHtml);
}

/***** Gathering Form Data *****/
function getLogEntryFormData() {
  const date = document.getElementById('date').value;
  const dailyNotes = document.getElementById('daily-notes').value;
  let tracks = [];
  const trackEntries = document.querySelectorAll('.track-entry');
  trackEntries.forEach(trackEntry => {
    const trackLabelInput = trackEntry.querySelector('.track-label');
    const trackLabel = trackLabelInput ? trackLabelInput.value : trackEntry.querySelector('h3')?.textContent || "Unnamed Track";
    let trackData = { label: trackLabel, units: [] };
    const unitEntries = trackEntry.querySelectorAll('.unit-entry');
    unitEntries.forEach(unitEntry => {
      let unitData = { fields: [] };
      const fieldEntries = unitEntry.querySelectorAll('.field-entry');
      fieldEntries.forEach(fieldEntry => {
        const fieldLabelInput = fieldEntry.querySelector('.field-label-input');
        const fieldLabel = fieldLabelInput ? fieldLabelInput.value : fieldEntry.querySelector('label')?.textContent || "Unnamed Field";
        const inputEl = fieldEntry.querySelector('.field-value');
        const fieldType = inputEl.getAttribute('data-type') || 'text';
        let value;
        if (fieldType === 'checkbox') {
          value = inputEl.checked;
        } else {
          value = inputEl.value;
        }
        unitData.fields.push({
          label: fieldLabel,
          type: fieldType,
          value: value,
          options: fieldType === 'select'
            ? fieldEntry.querySelector('.field-options')?.value || ''
            : ''
        });
      });
      trackData.units.push(unitData);
    });
    tracks.push(trackData);
  });
  return { date, dailyNotes, tracks };
}

/***** Extract Structure for Template Update *****/
function extractStructureFromLog(log) {
  let structure = [];
  log.tracks.forEach(track => {
    let newTrack = { label: track.label, units: [] };
    track.units.forEach(unit => {
      let newUnit = { label: "", fields: [] };
      unit.fields.forEach(field => {
        newUnit.fields.push({
          label: field.label,
          type: field.type,
          options: field.options || ""  // ✅ include options!
        });
      });
      newTrack.units.push(newUnit);
    });
    structure.push(newTrack);
  });
  return structure;
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

    const date = document.createElement('h3');
    date.className = 'text-xl font-semibold text-purple-400';
    date.textContent = log.date;

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
    header.appendChild(date);
    header.appendChild(actionButtons);

    const notes = document.createElement('p');
    notes.className = 'text-sm text-gray-300 mb-4';
    notes.innerHTML = `<span class="font-semibold text-gray-400">Notes:</span> ${log.dailyNotes}`;

    card.appendChild(header);
    card.appendChild(notes);

    log.tracks.forEach(track => {
      const trackSection = document.createElement('div');
      trackSection.className = 'mb-5';

      const trackTitle = document.createElement('h4');
      trackTitle.className = 'text-lg font-semibold text-gray-100 mb-2 border-b border-gray-600 pb-1';
      trackTitle.textContent = track.label;
      trackSection.appendChild(trackTitle);

      track.units.forEach((unit, unitIdx) => {
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
          value.textContent = field.value;

          fieldRow.appendChild(label);
          fieldRow.appendChild(value);
          unitBlock.appendChild(fieldRow);
        });

        trackSection.appendChild(unitBlock);
      });

      card.appendChild(trackSection);
    });

    logEntriesDiv.appendChild(card);
  });

  // Bind edit and delete
  document.querySelectorAll('.edit-log-button, .delete-log-button').forEach(btn => {
    btn.onclick = null;
  });

  document.querySelectorAll('.edit-log-button, .text-blue-400').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const logIndex = e.currentTarget.getAttribute('data-log-index');
      editLogEntry(logIndex);
    });
  });

  document.querySelectorAll('.delete-log-button, .text-red-500').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const logIndex = e.currentTarget.getAttribute('data-log-index');
      confirmLogDeletion(logIndex);
    });
  });
}


function editLogEntry(logIndex) {
  const log = logs[logIndex];
  renderLogEntryForm('edit', log);

  document.getElementById('saveEntry').onclick = (e) => {
    e.preventDefault();
    const updatedLog = getLogEntryFormData();
    let templateUpdated = false;

    if (JSON.stringify(extractStructureFromLog(updatedLog)) !== JSON.stringify(template)) {
      if (confirm("Your daily log structure differs from the current template. Update template with the new structure?")) {
        template = extractStructureFromLog(updatedLog);
        renderTemplateTracks();
        templateUpdated = true;
      }
    }

    logs[logIndex] = updatedLog;
    saveCloudData();
    renderLogEntries();
    document.getElementById('logEntryForm').classList.add('hidden');

    showFeedback('Log Entry Updated!');

    if (templateUpdated) {
      setTimeout(() => {
        showFeedback('Template Updated Successfully!', 'info');
      }, 1600); // Slight delay to avoid overlapping modals
    }
  };
}

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

  if (templateUpdated) {
    setTimeout(() => {
      showFeedback('Template Updated Successfully!', 'info');
    }, 1600); // Slight delay to avoid overlapping modals
  }
}


/***** Enhanced Search Functionality *****/
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
  
    // Auto-scroll to the newly added track on mobile
    if (window.innerWidth < 768) {
      const lastTrack = document.querySelector('#templateTracks .track-container:last-child');
      if (lastTrack) {
        lastTrack.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
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
    
      // Auto-scroll to the modified track container on mobile
      if (window.innerWidth < 768) {
        const trackContainer = document.querySelector(`#templateTracks .track-container[data-id="${trackIndex}"]`);
        if (trackContainer) {
          trackContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
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
    
      // Auto-scroll to the modified track container on mobile
      if (window.innerWidth < 768) {
        const trackContainer = document.querySelector(`#templateTracks .track-container[data-id="${trackIndex}"]`);
        if (trackContainer) {
          trackContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
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
      if (e.target.value === 'select') {
        optionsInput.classList.remove('hidden');
      } else {
        optionsInput.classList.add('hidden');
      }
    }
  });
  document.getElementById('saveTemplate').addEventListener('click', () => {
    updateTemplateFromDOM();
    localStorage.setItem('logtrackTemplate', JSON.stringify(template));
    document.getElementById('templateBuilder').classList.add('hidden');
    document.getElementById('tutorial').classList.add('hidden');
    saveCloudData();
  
    showFeedback('Template Saved Successfully!');
  });  
  document.getElementById('logEntryForm').onclick = (e) => {
    if (e.target.id === 'saveEntry' && document.getElementById('entryForm')) {
      e.preventDefault();
      if (e.target.textContent.includes('Save Log Entry')) {
        saveNewLogEntry();
      }
    }
  };  
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
  
    // Display feedback modal
    showFeedback('Logs Exported Successfully!', 'download');
  });  
  loadCloudData();
  // Hide loading screen after content loads
  const loadingScreen = document.getElementById('loadingScreen');
  loadingScreen.classList.add('animate__fadeOut');
  setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
    
});
