/***** Cloud Saving via Supabase *****/
const SUPABASE_URL = "https://lemcswschudgjuwmmyou.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbWNzd3NjaHVkZ2p1d21teW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMzc5NDgsImV4cCI6MjA1ODYxMzk0OH0.NE3suOS5G1cxLEgbqE9P0krSkd5_ZRga-6MZPnpBM8Q";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/***** App Data *****/
let template = [];   // Loaded from template builder
let logs = [];       // Array of log entry objects
let cloudDocId = null;  // Single row ID in Supabase

/***** Load & Save Cloud Data *****/
async function loadCloudData() {
  const { data, error } = await supabaseClient
    .from('logtrack')
    .select('*')
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
  } else {
    console.log("No cloud data found; start by creating a new template.");
  }
}

async function saveCloudData() {
  const dataToSave = { template, logs };
  if (cloudDocId) {
    const { data: updatedData, error: updateError } = await supabaseClient
      .from('logtrack')
      .update(dataToSave, { returning: 'representation' })
      .eq('id', cloudDocId)
      .select()
      .single();
    if (updateError) {
      console.error("Error updating cloud data:", updateError);
    } else {
      console.log("Cloud data updated:", updatedData);
    }
  } else {
    const { data: insertedData, error: insertError } = await supabaseClient
      .from('logtrack')
      .insert([dataToSave], { returning: 'representation' })
      .select()
      .single();
    if (insertError) {
      console.error("Error saving cloud data:", insertError);
    } else {
      cloudDocId = insertedData.id;
      console.log("Cloud data created:", insertedData);
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
      <div class="track-container border border-gray-700 rounded-md p-4 mb-4 space-y-4">
        <div class="flex items-center space-x-4">
          <input type="text" data-track-index="${tIndex}" value="${track.label}" class="bg-gray-700 text-white p-3 rounded font-mono text-xl flex-grow" placeholder="Prep Track Name" />
          <button class="delete-track-button text-red-500 hover:text-red-600" data-track-index="${tIndex}"><i class="fas fa-trash"></i></button>
        </div>
        <div class="units-container space-y-4">`;
    track.units.forEach((unit, uIndex) => {
      trackHtml += `
          <div class="unit-container border border-gray-700 rounded-md p-4 mb-4 space-y-4">
            <div class="flex items-center space-x-4">
              <input type="text" data-unit-index="${uIndex}" value="${unit.label}" class="bg-gray-700 text-white p-3 rounded font-mono text-lg flex-grow" placeholder="Unit Label" />
              <button class="delete-unit-button text-red-500 hover:text-red-600" data-unit-index="${uIndex}" data-track-index="${tIndex}"><i class="fas fa-trash"></i></button>
            </div>
            <div class="fields-container space-y-2">`;
      unit.fields.forEach((field, fIndex) => {
        trackHtml += `
              <div class="field-container flex items-center space-x-2">
                <input type="text" class="field-label bg-gray-700 text-white p-3 rounded flex-grow" placeholder="Field Name" value="${field.label}" />
                <select class="field-type bg-gray-700 text-white p-2 rounded">
                  <option value="text" ${field.type==='text'?'selected':''}>Text</option>
                  <option value="number" ${field.type==='number'?'selected':''}>Number</option>
                  <option value="date" ${field.type==='date'?'selected':''}>Date</option>
                  <option value="textarea" ${field.type==='textarea'?'selected':''}>Textarea</option>
                  <option value="checkbox" ${field.type==='checkbox'?'selected':''}>Checkbox</option>
                  <option value="select" ${field.type==='select'?'selected':''}>Select</option>
                </select>
                <input type="text" class="field-options bg-gray-700 text-white p-3 rounded flex-grow ${field.type==='select'?'':'hidden'}" placeholder="Options (comma-separated)" value="${field.options || ''}" />
                <button class="delete-field-button text-red-500 hover:text-red-600" data-track-index="${tIndex}" data-unit-index="${uIndex}" data-field-index="${fIndex}"><i class="fas fa-trash"></i></button>
              </div>`;
      });
      trackHtml += `
            </div>
            <button class="add-field-button bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" data-track-index="${tIndex}" data-unit-index="${uIndex}"><i class="fas fa-plus mr-1"></i> Add Field</button>
          </div>`;
    });
    trackHtml += `
        </div>
        <button class="add-unit-button bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" data-track-index="${tIndex}"><i class="fas fa-plus mr-1"></i> Add Unit</button>
      </div>`;
    templateTracks.insertAdjacentHTML('beforeend', trackHtml);
  });
}

/***** New / Edit Log Entry Form *****/
/*
  When creating or editing a log entry, the form displays each template track with locked labels
  (track, unit, and field names) and an input (or select/checkbox) for the field value.
  Additionally, a section for fully editable custom tracks is provided.
*/
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
      </div>
      <div id="logTracks" class="space-y-4">`;
  const curDate = mode === 'edit' && logData ? logData.date : new Date().toISOString().split('T')[0];
  const curNotes = mode === 'edit' && logData ? logData.dailyNotes : '';
  // Render each template-based track as locked labels with inputs for values.
  template.forEach((track, tIndex) => {
    html += `
      <div class="track-entry border border-gray-700 rounded p-4">
        <p class="text-lg font-bold mb-2">${track.label}</p>`;
    track.units.forEach((unit, uIndex) => {
      html += `<div class="unit-entry mb-2">
                <p class="font-semibold">${unit.label}</p>`;
      unit.fields.forEach((field, fIndex) => {
        let savedValue = '';
        if (mode === 'edit' && logData && logData.tracks) {
          const tmplTrack = logData.tracks.find(t => t.templateTrackIndex === tIndex);
          if (tmplTrack) {
            const tmplUnit = tmplTrack.units.find(u => u.templateUnitIndex === uIndex);
            if (tmplUnit) {
              const tmplField = tmplUnit.fields.find(f => f.templateFieldIndex === fIndex);
              if (tmplField) savedValue = tmplField.value;
            }
          }
        }
        html += `<div class="field-entry mb-2">
                   <label class="block text-sm text-gray-400">${field.label}</label>`;
        if (field.type === 'textarea') {
          html += `<textarea class="field-value bg-gray-600 text-white p-2 rounded w-full" data-type="${field.type}" placeholder="${field.label}">${savedValue}</textarea>`;
        } else if (field.type === 'checkbox') {
          html += `<input type="checkbox" class="field-value" data-type="${field.type}" ${savedValue ? 'checked' : ''} />`;
        } else if (field.type === 'select') {
          let options = field.options ? field.options.split(',').map(opt => opt.trim()) : [];
          html += `<select class="field-value bg-gray-600 text-white p-2 rounded w-full" data-type="${field.type}">`;
          options.forEach(opt => {
            html += `<option value="${opt}" ${savedValue===opt?'selected':''}>${opt}</option>`;
          });
          html += `</select>`;
        } else {
          html += `<input type="${field.type}" class="field-value bg-gray-600 text-white p-2 rounded w-full" data-type="${field.type}" value="${savedValue}" placeholder="${field.label}" />`;
        }
        html += `</div>`;
      });
      html += `</div>`;
    });
    html += `</div>`;
  });
  // Custom tracks section (fully editable)
  html += `<div id="customTracksArea"></div>
           <button id="addCustomTrack" type="button" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"><i class="fas fa-plus mr-1"></i> Add Custom Track</button>`;
  html += `</div>
      <button id="saveEntry" type="button" class="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold">${mode==='new'?'Save Log Entry':'Save Changes'}</button>
    </form>`;
  formContainer.innerHTML = html;
  formContainer.classList.remove('hidden');
  document.getElementById('date').value = curDate;
  document.getElementById('daily-notes').value = curNotes;
  document.getElementById('addCustomTrack')?.addEventListener('click', () => {
    addCustomTrack();
  });
}

function addCustomTrack(savedTrack = null) {
  const container = document.getElementById('customTracksArea');
  const html = `<div class="custom-track border border-gray-700 rounded p-4 mb-4">
                  <input type="text" class="custom-track-label bg-gray-600 text-white p-2 rounded w-full mb-2" placeholder="Custom Track Name" value="${savedTrack ? savedTrack.label : ''}" />
                  <div class="custom-units"></div>
                  <button type="button" class="add-custom-unit bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded mt-2"><i class="fas fa-plus mr-1"></i> Add Unit</button>
                  <button type="button" class="delete-custom-track text-red-500 hover:text-red-600 ml-2"><i class="fas fa-trash"></i></button>
                </div>`;
  container.insertAdjacentHTML('beforeend', html);
  const customTrack = container.lastElementChild;
  customTrack.querySelector('.add-custom-unit').addEventListener('click', () => {
    addCustomUnit(customTrack.querySelector('.custom-units'));
  });
  customTrack.querySelector('.delete-custom-track').addEventListener('click', () => {
    customTrack.remove();
  });
}

function addCustomUnit(unitsContainer, savedUnit = null) {
  const html = `<div class="custom-unit border border-gray-600 rounded p-3 mb-3">
                  <input type="text" class="custom-unit-label bg-gray-500 text-white p-2 rounded w-full mb-2" placeholder="Unit Label" value="${savedUnit ? savedUnit.label : ''}" />
                  <div class="custom-fields"></div>
                  <button type="button" class="add-custom-field bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded mt-2"><i class="fas fa-plus mr-1"></i> Add Field</button>
                  <button type="button" class="delete-custom-unit text-red-500 hover:text-red-600 ml-2"><i class="fas fa-trash"></i></button>
                </div>`;
  unitsContainer.insertAdjacentHTML('beforeend', html);
  const unitDiv = unitsContainer.lastElementChild;
  unitDiv.querySelector('.add-custom-field').addEventListener('click', () => {
    addCustomField(unitDiv.querySelector('.custom-fields'));
  });
  unitDiv.querySelector('.delete-custom-unit').addEventListener('click', () => {
    unitDiv.remove();
  });
}

function addCustomField(fieldsContainer, savedField = null) {
  const html = `<div class="custom-field mb-2">
                  <input type="text" class="custom-field-label bg-gray-500 text-white p-2 rounded w-1/3 inline-block mr-2" placeholder="Field Label" value="${savedField ? savedField.label : ''}" />
                  <input type="text" class="custom-field-value bg-gray-600 text-white p-2 rounded w-2/3 inline-block" placeholder="Value" value="${savedField ? savedField.value : ''}" />
                  <button type="button" class="delete-custom-field text-red-500 hover:text-red-600 ml-2"><i class="fas fa-trash"></i></button>
                </div>`;
  fieldsContainer.insertAdjacentHTML('beforeend', html);
  const fieldDiv = fieldsContainer.lastElementChild;
  fieldDiv.querySelector('.delete-custom-field').addEventListener('click', () => {
    fieldDiv.remove();
  });
}

/***** Gathering Form Data *****/
function getLogEntryFormData() {
  const date = document.getElementById('date').value;
  const dailyNotes = document.getElementById('daily-notes').value;
  let tracks = [];
  // Process template-based tracks:
  template.forEach((track, tIndex) => {
    let trackData = {
      templateTrackIndex: tIndex,
      label: track.label,
      units: []
    };
    track.units.forEach((unit, uIndex) => {
      let unitData = {
        templateUnitIndex: uIndex,
        label: unit.label,
        fields: []
      };
      const fieldContainers = document.querySelectorAll('#logTracks .track-entry')[tIndex]
                               .querySelectorAll('.unit-entry')[uIndex]
                               .querySelectorAll('.field-entry');
      unit.fields.forEach((field, fIndex) => {
        let inputEl = fieldContainers[fIndex].querySelector('.field-value');
        let value;
        if (inputEl.getAttribute('data-type') === 'checkbox') {
          value = inputEl.checked;
        } else {
          value = inputEl.value;
        }
        unitData.fields.push({
          templateFieldIndex: fIndex,
          label: field.label,
          type: field.type,
          value: value
        });
      });
      trackData.units.push(unitData);
    });
    tracks.push(trackData);
  });
  // Process custom tracks:
  const customTracks = document.querySelectorAll('#customTracksArea .custom-track');
  customTracks.forEach(customTrack => {
    let customData = {
      isCustom: true,
      label: customTrack.querySelector('.custom-track-label').value,
      units: []
    };
    const units = customTrack.querySelectorAll('.custom-unit');
    units.forEach(unitDiv => {
      let unitData = {
        label: unitDiv.querySelector('.custom-unit-label').value,
        fields: []
      };
      const fields = unitDiv.querySelectorAll('.custom-field');
      fields.forEach(fieldDiv => {
        unitData.fields.push({
          label: fieldDiv.querySelector('.custom-field-label').value,
          value: fieldDiv.querySelector('.custom-field-value').value
        });
      });
      customData.units.push(unitData);
    });
    tracks.push(customData);
  });
  return { date, dailyNotes, tracks };
}

/***** Rendering Log Entries *****/
/*
  Render each log entry as a compact, modern card with a locked display.
  Each card shows the date, daily notes, and all tracks with units and fields.
  An edit button toggles the entry into an editable form.
*/
function renderLogEntries(filteredLogs = logs) {
  const logEntriesDiv = document.getElementById('logEntries');
  logEntriesDiv.innerHTML = '';
  filteredLogs.forEach((log, index) => {
    let cardHtml = `<div class="log-entry-card bg-gray-800 rounded p-4 shadow-md">
                      <div class="flex justify-between items-center mb-2">
                        <h3 class="text-lg font-bold text-purple-400">${log.date}</h3>
                        <button class="edit-log-button text-blue-400 hover:text-blue-500" data-log-index="${index}"><i class="fas fa-edit"></i></button>
                      </div>
                      <p class="mb-2 text-sm text-gray-300"><strong>Notes:</strong> ${log.dailyNotes}</p>
                      <div class="tracks">`;
    log.tracks.forEach(track => {
      cardHtml += `<div class="mb-2">
                     <p class="font-bold">${track.label}</p>`;
      track.units.forEach(unit => {
        cardHtml += `<div class="ml-4">
                       <p class="font-semibold text-sm">${unit.label}</p>`;
        unit.fields.forEach(field => {
          cardHtml += `<div class="ml-4 text-sm">
                         <span class="text-gray-400">${field.label}: </span>
                         <span>${field.value}</span>
                       </div>`;
        });
        cardHtml += `</div>`;
      });
      cardHtml += `</div>`;
    });
    cardHtml += `   </div>
                    </div>`;
    logEntriesDiv.insertAdjacentHTML('beforeend', cardHtml);
  });
  document.querySelectorAll('.edit-log-button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const logIndex = e.currentTarget.getAttribute('data-log-index');
      editLogEntry(logIndex);
    });
  });
}

/***** Editing & Saving Log Entries *****/
function editLogEntry(logIndex) {
  const log = logs[logIndex];
  renderLogEntryForm('edit', log);
  document.getElementById('saveEntry').addEventListener('click', () => {
    const updatedLog = getLogEntryFormData();
    logs[logIndex] = updatedLog;
    saveCloudData();
    renderLogEntries();
    document.getElementById('logEntryForm').classList.add('hidden');
  });
}

function saveNewLogEntry() {
  const newLog = getLogEntryFormData();
  logs.unshift(newLog);
  saveCloudData();
  renderLogEntries();
  document.getElementById('logEntryForm').classList.add('hidden');
}

/***** Event Listeners & Initialization *****/
document.addEventListener('DOMContentLoaded', () => {
  // Tutorial close:
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

  // Template builder events:
  document.getElementById('addTrack').addEventListener('click', () => {
    updateTemplateFromDOM();
    template.push({
      label: 'New Prep Track',
      units: [{ label: 'New Unit', fields: [{ label: 'New Field', type: 'text', options: '' }] }]
    });
    renderTemplateTracks();
    saveCloudData();
  });

  document.getElementById('templateTracks').addEventListener('click', (e) => {
    if (e.target.closest('.add-unit-button')) {
      updateTemplateFromDOM();
      const trackIndex = e.target.closest('.add-unit-button').getAttribute('data-track-index');
      template[trackIndex].units.push({ label: 'New Unit', fields: [{ label: 'New Field', type: 'text', options: '' }] });
      renderTemplateTracks();
      saveCloudData();
    }
    if (e.target.closest('.add-field-button')) {
      updateTemplateFromDOM();
      const trackIndex = e.target.closest('.add-field-button').getAttribute('data-track-index');
      const unitIndex = e.target.closest('.add-field-button').getAttribute('data-unit-index');
      template[trackIndex].units[unitIndex].fields.push({ label: 'New Field', type: 'text', options: '' });
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

  document.getElementById('saveTemplate').addEventListener('click', () => {
    updateTemplateFromDOM();
    localStorage.setItem('logtrackTemplate', JSON.stringify(template));
    document.getElementById('templateBuilder').classList.add('hidden');
    document.getElementById('tutorial').classList.add('hidden');
    saveCloudData();
    alert('Template saved! You can now create log entries.');
  });

  // Save log entry (new)
  document.getElementById('logEntryForm').addEventListener('click', (e) => {
    if (e.target.id === 'saveEntry' && document.getElementById('entryForm')) {
      if (e.target.textContent.includes('Save Log Entry')) {
        saveNewLogEntry();
      }
    }
  });

  // Search functionality:
  document.getElementById('searchBar').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = logs.filter(log =>
      log.date.toLowerCase().includes(term) ||
      (log.dailyNotes || '').toLowerCase().includes(term)
    );
    renderLogEntries(filtered);
  });

  // Load existing data from Supabase on startup:
  loadCloudData();
});
