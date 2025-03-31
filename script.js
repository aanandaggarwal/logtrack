// Supabase configuration and initialization
const SUPABASE_URL = "https://lemcswschudgjuwmmyou.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbWNzd3NjaHVkZ2p1d21teW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMzc5NDgsImV4cCI6MjA1ODYxMzk0OH0.NE3suOS5G1cxLEgbqE9P0krSkd5_ZRga-6MZPnpBM8Q";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/***** App Data *****/
let template = []; // Loaded from template builder
let logs = []; // Array of log entry objects
let cloudDocId = null; // Single row ID in Supabase
let currentUserId = null;

/***** Auth State Management *****/
async function checkAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    currentUserId = session.user.id;
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    loadCloudData();
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
  if (error) alert(error.message);
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
  await supabaseClient.auth.signOut();
  checkAuth();
});

document.getElementById('googleSignInButton')?.addEventListener('click', async () => {
  const { error } = await supabaseClient.auth.signInWithOAuth({ provider: 'google' });
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
  let html = `
    <h2 class="text-xl font-semibold mb-4 text-purple-400 flex items-center">${mode === 'new' ? 'New Log Entry' : 'Edit Log Entry'}</h2>
    <form id="entryForm" class="space-y-4">
      <div class="mb-4">
        <label for="date" class="block text-sm font-semibold mb-2 text-gray-300 font-mono">Date</label>
        <input type="date" id="date" name="date" class="bg-gray-700 text-white p-3 rounded w-full font-mono" />
      </div>
      <div class="mb-4">
        <label for="daily-notes" class="block text-sm font-semibold mb-2 text-gray-300 font-mono">Daily Notes</label>
        <textarea id="daily-notes" name="daily-notes" class="bg-gray-700 text-white p-3 rounded w-full font-mono"></textarea>
      </div>`;
  // Build tracks from saved log data or from the template
  let tracksToRender = [];
  if (mode === 'edit' && logData && logData.tracks) {
    tracksToRender = logData.tracks;
  } else {
    tracksToRender = template.length ? template.map(track => {
      // Mark tracks coming from the template as prefilled so they are read-only in daily log
      let defaultUnit = {
        fields: track.units && track.units.length > 0 ? track.units[0].fields.map(field => ({
          label: field.label,
          type: field.type,
          options: field.options || "",
          value: ""
        })) : []
      };
      return { label: track.label, units: [defaultUnit], prefilled: true };
    }) : [];
  }
  tracksToRender.forEach((track, tIndex) => {
    html += `
      <div class="track-entry border border-gray-700 rounded p-4 mb-4 animate__animated animate__fadeIn" data-track-index="${tIndex}">
        <div class="flex items-center justify-between mb-2">
          <input type="text" class="track-label bg-gray-700 text-white p-3 rounded font-mono text-lg flex-grow" value="${track.label}" placeholder="Track Name" ${track.prefilled ? 'readonly' : ''} />
          ${ track.prefilled ? `<button type="button" class="delete-track-entry text-red-500 hover:text-red-600 ml-2"><i class="fas fa-trash"></i></button>` : '' }
        </div>
        <div class="units-container" data-track-index="${tIndex}">`;
    track.units.forEach((unit, uIndex) => {
      html += `<div class="unit-entry mb-2" data-unit-index="${uIndex}">`;
      unit.fields.forEach((field, fIndex) => {
        html += `<div class="field-entry mb-2 animate__animated animate__fadeIn flex flex-col" data-field-index="${fIndex}">
          <div class="flex items-center justify-between">
            <input type="text" class="field-label-input bg-gray-600 text-white p-2 rounded flex-grow font-mono" value="${field.label}" placeholder="Field Name" ${track.prefilled ? 'readonly' : ''} />
            <button type="button" class="delete-field-entry text-red-500 hover:text-red-600 ml-2"><i class="fas fa-trash"></i></button>
          </div>`;
        if (field.type === 'textarea') {
          html += `<textarea class="field-value bg-gray-600 text-white p-2 rounded w-full font-mono mt-2" data-type="${field.type}" placeholder="${field.label}">${field.value || ""}</textarea>`;
        } else if (field.type === 'checkbox') {
          html += `<input type="checkbox" class="field-value mt-2" data-type="${field.type}" ${field.value ? 'checked' : ''} />`;
        } else if (field.type === 'select') {
          let options = field.options ? field.options.split(',').map(opt => opt.trim()) : [];
          html += `<select class="field-value bg-gray-600 text-white p-2 rounded w-full font-mono mt-2" data-type="${field.type}">`;
          options.forEach(opt => {
            html += `<option value="${opt}" ${field.value === opt ? 'selected' : ''}>${opt}</option>`;
          });
          html += `</select>`;
        } else {
          html += `<input type="${field.type}" class="field-value bg-gray-600 text-white p-2 rounded w-full font-mono mt-2" data-type="${field.type}" value="${field.value || ""}" placeholder="${field.label}" />`;
        }
        html += `</div>`;
      });
      html += `<button type="button" class="add-field-entry bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-mono mt-2 flex items-center">
                 <i class="fas fa-plus mr-1"></i> Add Field
               </button>`;
      html += `</div>`;
    });
    html += `</div>
             <button type="button" class="add-unit-entry bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-mono mt-2 flex items-center">
               <i class="fas fa-plus mr-1"></i> Add Unit
             </button>
           </div>`;
  });
  html += `<button type="button" id="addTrackEntry" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-mono flex items-center">
             <i class="fas fa-plus mr-1"></i> Add Track
           </button>`;
  html += `<button id="saveEntry" type="button" class="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold font-mono">
             ${mode==='new'?'Save Log Entry':'Save Changes'}
           </button>
           </form>`;
  formContainer.innerHTML = html;
  formContainer.classList.remove('hidden');
  document.getElementById('date').value = mode === 'edit' && logData ? logData.date : new Date().toISOString().split('T')[0];
  document.getElementById('daily-notes').value = mode === 'edit' && logData ? logData.dailyNotes : "";
  const entryForm = document.getElementById('entryForm');
  entryForm.addEventListener('click', function(e) {
    if(e.target.closest('.delete-track-entry')) {
      e.target.closest('.track-entry').remove();
    }
    if(e.target.closest('.delete-field-entry')) {
      e.target.closest('.field-entry').remove();
    }
    if(e.target.closest('.add-unit-entry')) {
      const trackEntry = e.target.closest('.track-entry');
      const unitsContainer = trackEntry.querySelector('.units-container');
      const unitIndex = unitsContainer.querySelectorAll('.unit-entry').length;
      let unitHtml = `<div class="unit-entry mb-2" data-unit-index="${unitIndex}">
                        <div class="field-entry mb-2 flex flex-col animate__animated animate__fadeIn" data-field-index="0">
                          <div class="flex items-center justify-between">
                            <input type="text" class="field-label-input bg-gray-600 text-white p-2 rounded flex-grow font-mono" value="New Field" placeholder="Field Name" />
                            <button type="button" class="delete-field-entry text-red-500 hover:text-red-600 ml-2"><i class="fas fa-trash"></i></button>
                          </div>
                          <input type="text" class="field-value bg-gray-600 text-white p-2 rounded w-full font-mono mt-2" data-type="text" placeholder="Field Value" />
                        </div>
                        <button type="button" class="add-field-entry bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-mono mt-2 flex items-center">
                          <i class="fas fa-plus mr-1"></i> Add Field
                        </button>
                      </div>`;
      unitsContainer.insertAdjacentHTML('beforeend', unitHtml);
    }
    if(e.target.closest('.add-field-entry')) {
      const unitEntry = e.target.closest('.unit-entry');
      const fieldIndex = unitEntry.querySelectorAll('.field-entry').length;
      let fieldHtml = `<div class="field-entry mb-2 animate__animated animate__fadeIn flex flex-col" data-field-index="${fieldIndex}">
                         <div class="flex items-center justify-between">
                           <input type="text" class="field-label-input bg-gray-600 text-white p-2 rounded flex-grow font-mono" value="New Field" placeholder="Field Name" />
                           <button type="button" class="delete-field-entry text-red-500 hover:text-red-600 ml-2"><i class="fas fa-trash"></i></button>
                         </div>
                         <input type="text" class="field-value bg-gray-600 text-white p-2 rounded w-full font-mono mt-2" data-type="text" placeholder="Field Value" />
                       </div>`;
      unitEntry.insertAdjacentHTML('beforeend', fieldHtml);
    }
  });
  document.getElementById('addTrackEntry').addEventListener('click', () => {
    const form = document.getElementById('entryForm');
    const newTrackIndex = form.querySelectorAll('.track-entry').length;
    // Newly added track in a daily log is editable so do not mark as prefilled
    let newTrackHtml = `<div class="track-entry border border-gray-700 rounded p-4 mb-4 animate__animated animate__fadeIn" data-track-index="${newTrackIndex}">
                          <div class="flex items-center justify-between mb-2">
                            <input type="text" class="track-label bg-gray-700 text-white p-3 rounded font-mono text-lg flex-grow" value="New Track" placeholder="Track Name" />
                          </div>
                          <div class="units-container" data-track-index="${newTrackIndex}">
                            <div class="unit-entry" data-unit-index="0">
                              <div class="field-entry mb-2 flex flex-col animate__animated animate__fadeIn" data-field-index="0">
                                <div class="flex items-center justify-between">
                                  <input type="text" class="field-label-input bg-gray-600 text-white p-2 rounded flex-grow font-mono" value="New Field" placeholder="Field Name" />
                                  <button type="button" class="delete-field-entry text-red-500 hover:text-red-600 ml-2"><i class="fas fa-trash"></i></button>
                                </div>
                                <input type="text" class="field-value bg-gray-600 text-white p-2 rounded w-full font-mono mt-2" data-type="text" placeholder="Field Value" />
                              </div>
                              <button type="button" class="add-field-entry bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-mono mt-2 flex items-center">
                                <i class="fas fa-plus mr-1"></i> Add Field
                              </button>
                            </div>
                            <button type="button" class="add-unit-entry bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-mono mt-2 flex items-center">
                              <i class="fas fa-plus mr-1"></i> Add Unit
                            </button>
                          </div>
                        </div>`;
    form.insertAdjacentHTML('beforeend', newTrackHtml);
  });
}

/***** Gathering Form Data *****/
function getLogEntryFormData() {
  const date = document.getElementById('date').value;
  const dailyNotes = document.getElementById('daily-notes').value;
  let tracks = [];
  const trackEntries = document.querySelectorAll('.track-entry');
  trackEntries.forEach(trackEntry => {
    const trackLabelInput = trackEntry.querySelector('.track-label');
    const trackLabel = trackLabelInput ? trackLabelInput.value : "Unnamed Track";
    let trackData = { label: trackLabel, units: [] };
    const unitEntries = trackEntry.querySelectorAll('.unit-entry');
    unitEntries.forEach(unitEntry => {
      let unitData = { fields: [] };
      const fieldEntries = unitEntry.querySelectorAll('.field-entry');
      fieldEntries.forEach(fieldEntry => {
        const fieldLabelInput = fieldEntry.querySelector('.field-label-input');
        const fieldLabel = fieldLabelInput ? fieldLabelInput.value : "Unnamed Field";
        const inputEl = fieldEntry.querySelector('.field-value');
        let value;
        if (inputEl.getAttribute('data-type') === 'checkbox') {
          value = inputEl.checked;
        } else {
          value = inputEl.value;
        }
        unitData.fields.push({
          label: fieldLabel,
          type: inputEl.getAttribute('data-type'),
          value: value,
          options: ""
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
          options: field.options || ""
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
    let cardHtml = `<div class="log-entry-card bg-gray-800 border border-gray-700 rounded p-4 mb-4 animate__animated animate__fadeIn">
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-lg font-bold text-purple-400">${log.date}</h3>
            <div class="flex space-x-2">
              <button class="edit-log-button text-blue-400 hover:text-blue-500" data-log-index="${index}"><i class="fas fa-edit"></i></button>
              <button class="delete-log-button text-red-500 hover:text-red-600" data-log-index="${index}"><i class="fas fa-trash"></i></button>
            </div>
          </div>
          <p class="mb-4 text-sm text-gray-300"><strong>Notes:</strong> ${log.dailyNotes}</p>`;
    log.tracks.forEach(track => {
      cardHtml += `<div class="mb-4">
            <h4 class="font-bold border-b pb-1 mb-2">${track.label}</h4>
            <table class="w-full text-sm">
              <thead>
                <tr>
                  <th class="py-1 text-left">#</th>
                  <th class="py-1 text-left">Details</th>
                </tr>
              </thead>
              <tbody>`;
      track.units.forEach((unit, idx) => {
        let detailsHTML = "";
        unit.fields.forEach(field => {
          detailsHTML += `<div><span class="font-semibold">${field.label}:</span> ${field.value}</div>`;
        });
        cardHtml += `<tr>
                  <td class="py-1">${idx + 1}</td>
                  <td class="py-1">${detailsHTML}</td>
                </tr>`;
      });
      cardHtml += `</tbody>
            </table>
          </div>`;
    });
    cardHtml += `</div>`;
    logEntriesDiv.insertAdjacentHTML('beforeend', cardHtml);
  });
  document.querySelectorAll('.edit-log-button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const logIndex = e.currentTarget.getAttribute('data-log-index');
      editLogEntry(logIndex);
    });
  });
  document.querySelectorAll('.delete-log-button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const logIndex = e.currentTarget.getAttribute('data-log-index');
      logs.splice(logIndex, 1);
      saveCloudData();
      renderLogEntries();
    });
  });
}

function editLogEntry(logIndex) {
  const log = logs[logIndex];
  renderLogEntryForm('edit', log);
  document.getElementById('saveEntry').addEventListener('click', () => {
    const updatedLog = getLogEntryFormData();
    if (JSON.stringify(extractStructureFromLog(updatedLog)) !== JSON.stringify(template)) {
      if (confirm("Your daily log structure differs from the current template. Update template with the new structure?")) {
        template = extractStructureFromLog(updatedLog);
        renderTemplateTracks();
        saveCloudData();
      }
    }
    logs[logIndex] = updatedLog;
    saveCloudData();
    renderLogEntries();
    document.getElementById('logEntryForm').classList.add('hidden');
  });
}

function saveNewLogEntry() {
  const newLog = getLogEntryFormData();
  if (JSON.stringify(extractStructureFromLog(newLog)) !== JSON.stringify(template)) {
    if (confirm("Your daily log structure differs from the current template. Update template with the new structure?")) {
      template = extractStructureFromLog(newLog);
      renderTemplateTracks();
      saveCloudData();
    }
  }
  logs.unshift(newLog);
  saveCloudData();
  renderLogEntries();
  document.getElementById('logEntryForm').classList.add('hidden');
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
    alert('Template saved! You can now create log entries.');
  });
  document.getElementById('logEntryForm').addEventListener('click', (e) => {
    if (e.target.id === 'saveEntry' && document.getElementById('entryForm')) {
      if (e.target.textContent.includes('Save Log Entry')) {
        saveNewLogEntry();
      }
    }
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
  });
  loadCloudData();
  // Hide loading screen after content loads
  const loadingScreen = document.getElementById('loadingScreen');
  loadingScreen.classList.add('animate__fadeOut');
  setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
});