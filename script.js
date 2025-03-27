/***** Cloud Saving via jsonbox.io *****/
const BOX_URL = "https://jsonbox.io/box_logtrack"; // Fixed box identifier
let cloudDocId = null;

function loadCloudData() {
  fetch(BOX_URL)
    .then(res => res.json())
    .then(data => {
      if (data.length > 0) {
        const doc = data[0];
        template = doc.template || [];
        logs = doc.logs || [];
        cloudDocId = doc._id;
        renderTemplateTracks();
        renderLogEntryForm();
        renderLogEntries();
      }
    })
    .catch(err => console.error("Error fetching cloud data:", err));
}

function saveCloudData() {
  const dataToSave = { template, logs };
  if (cloudDocId) {
    fetch(`${BOX_URL}/${cloudDocId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSave)
    })
      .then(res => res.json())
      .then(data => console.log("Cloud data updated:", data))
      .catch(err => console.error("Error updating cloud data:", err));
  } else {
    fetch(BOX_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSave)
    })
      .then(res => res.json())
      .then(data => { cloudDocId = data._id; console.log("Cloud data created:", data); })
      .catch(err => console.error("Error saving cloud data:", err));
  }
}

/***** App Data *****/
let template = [];
let logs = [];

/***** Helper: Update Template from DOM *****/
function updateTemplateFromDOM() {
  const templateTracks = document.getElementById('templateTracks');
  template = Array.from(templateTracks.querySelectorAll('.track-container')).map((trackDiv, trackIndex) => {
    const trackLabelInput = trackDiv.querySelector(`input[data-track-index="${trackIndex}"]`);
    const unitDivs = Array.from(trackDiv.querySelectorAll('.unit-container'));
    return {
      label: trackLabelInput.value,
      units: unitDivs.map((unitDiv, unitIndex) => {
        const unitLabelInput = unitDiv.querySelector(`input[data-unit-index="${unitIndex}"]`);
        const fieldInputs = Array.from(unitDiv.querySelectorAll('.mb-3.flex.items-center.space-x-2'));
        return {
          label: unitLabelInput.value,
          fields: fieldInputs.map(fieldInput => {
            const labelInput = fieldInput.querySelector(`input[data-field-index]`);
            const typeSelect = fieldInput.querySelector(`select[data-field-index]`);
            const optionsInput = fieldInput.querySelector(`input[placeholder="Options (comma-separated)"]`);
            return {
              label: labelInput.value,
              type: typeSelect ? typeSelect.value : 'text',
              options: optionsInput ? optionsInput.value : ''
            };
          })
        };
      })
    };
  });
}

/***** Rendering Functions *****/
// Render Template Builder
function renderTemplateTracks() {
  const templateTracks = document.getElementById('templateTracks');
  templateTracks.innerHTML = '';
  template.forEach((track, trackIndex) => {
    const trackDiv = document.createElement('div');
    trackDiv.classList.add('border', 'border-gray-700', 'rounded-md', 'p-4', 'mb-4', 'space-y-4', 'track-container');
    trackDiv.innerHTML = `
      <div class="flex items-center space-x-4">
        <input type="text" value="${track.label}" class="bg-gray-700 text-white p-3 rounded font-mono text-xl flex-grow track-name-input" 
               data-track-index="${trackIndex}" placeholder="Prep Track Name (e.g., NeetCode 150, SQL 50)" />
        <button class="text-red-500 hover:text-red-600 transition-colors delete-track-button" data-track-index="${trackIndex}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <div class="units-container space-y-4">
        ${track.units.map((unit, unitIndex) => {
          return `
            <div class="border border-gray-700 rounded-md p-4 mb-4 space-y-4 unit-container">
              <div class="flex items-center space-x-4">
                <input type="text" value="${unit.label}" class="bg-gray-700 text-white p-3 rounded font-mono text-lg flex-grow unit-name-input" 
                       data-track-index="${trackIndex}" data-unit-index="${unitIndex}" placeholder="Unit Label (e.g., Problem, Section)" />
                <button class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded font-semibold flex items-center text-sm add-field-button" 
                        data-track-index="${trackIndex}" data-unit-index="${unitIndex}">
                  <i class="fas fa-plus mr-1"></i> Add Field
                </button>
                <button class="text-red-500 hover:text-red-600 transition-colors delete-unit-button" 
                        data-track-index="${trackIndex}" data-unit-index="${unitIndex}">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
              <div class="fields-container space-y-2">
                ${unit.fields.map((field, fieldIndex) => {
                  return `
                    <div class="mb-3 flex items-center space-x-2">
                      <input type="text" value="${field.label}" class="bg-gray-700 text-white p-3 rounded flex-grow font-mono field-name-input" 
                             data-track-index="${trackIndex}" data-unit-index="${unitIndex}" data-field-index="${fieldIndex}" placeholder="Field Name" />
                      <select data-track-index="${trackIndex}" data-unit-index="${unitIndex}" data-field-index="${fieldIndex}" class="bg-gray-700 text-white p-2 rounded font-mono">
                        <option value="text" ${field.type === 'text' ? 'selected' : ''}>Text</option>
                        <option value="number" ${field.type === 'number' ? 'selected' : ''}>Number</option>
                        <option value="date" ${field.type === 'date' ? 'selected' : ''}>Date</option>
                        <option value="textarea" ${field.type === 'textarea' ? 'selected' : ''}>Textarea</option>
                        <option value="checkbox" ${field.type === 'checkbox' ? 'selected' : ''}>Checkbox</option>
                        <option value="select" ${field.type === 'select' ? 'selected' : ''}>Select</option>
                      </select>
                      <input type="text" value="${field.options || ''}" class="bg-gray-700 text-white p-3 rounded flex-grow font-mono field-options-input ${field.type === 'select' ? '' : 'hidden'}" 
                             data-track-index="${trackIndex}" data-unit-index="${unitIndex}" data-field-index="${fieldIndex}" placeholder="Options (comma-separated)" />
                      <button class="text-red-500 hover:text-red-600 transition-colors" 
                              data-track-index="${trackIndex}" data-unit-index="${unitIndex}" data-field-index="${fieldIndex}">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold flex items-center add-unit-button" 
              data-track-index="${trackIndex}">
        <i class="fas fa-plus mr-2"></i> Add Unit
      </button>
    `;
    templateTracks.appendChild(trackDiv);
  });
}

// Render New Log Entry Form (using template as default)
function renderLogEntryForm(customContent) {
  const entryForm = document.getElementById('entryForm');
  let formHtml = `
    <div class="mb-4">
      <label for="date" class="block text-sm font-semibold mb-2 text-gray-300 font-mono">Date</label>
      <input type="date" id="date" name="date" value="${new Date().toISOString().split('T')[0]}"
             class="bg-gray-700 text-white p-3 rounded w-full font-mono" />
    </div>
    <div class="mb-4">
      <label for="daily-notes" class="block text-sm font-semibold mb-2 text-gray-300 font-mono">Daily Notes</label>
      <textarea id="daily-notes" name="daily-notes" class="bg-gray-700 text-white p-3 rounded w-full font-mono"></textarea>
    </div>
  `;
  formHtml += `<div id="logEntryTracksContainer">`;
  formHtml += customContent ? customContent :
    template.map(track => {
      return `
        <div class="track-log-entry border border-gray-700 rounded p-4 mb-4">
          <div class="flex justify-between items-center">
            <input type="text" class="bg-gray-700 text-white p-3 rounded font-mono text-lg track-label" value="${track.label}" />
            <button type="button" class="delete-track-log-entry-button text-red-500 hover:text-red-600">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          ${track.units.map(unit => {
            return `
              <div class="unit-log-entry border border-gray-600 rounded p-3 my-2">
                <div class="flex justify-between items-center">
                  <input type="text" class="bg-gray-700 text-white p-2 rounded font-mono unit-label" value="${unit.label}" />
                  <button type="button" class="delete-unit-log-entry-button text-red-500 hover:text-red-600">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
                ${unit.fields.map(field => {
                  const inputId = `input-${track.label.replace(/\s+/g, '-')}-${unit.label.replace(/\s+/g, '-')}-${field.label.replace(/\s+/g, '-')}`;
                  return `
                    <div class="mb-2">
                      <label class="block text-sm font-semibold mb-1 text-gray-300 font-mono">${field.label}</label>
                      ${getInputField(field, inputId)}
                    </div>
                  `;
                }).join('')}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }).join('');
  formHtml += `</div>`;
  entryForm.innerHTML = formHtml;
}

// Render Saved Log Entries
function renderLogEntries(filteredLogs = logs) {
  const logEntries = document.getElementById('logEntries');
  logEntries.innerHTML = '';
  filteredLogs.forEach((log, index) => {
    const logDiv = document.createElement('div');
    logDiv.classList.add('log-entry', 'bg-gray-800', 'rounded', 'p-6', 'mb-4', 'fade-in', 'flex', 'flex-col');
    let logContent = `
      <div class="flex justify-between items-start mb-2">
        <h3 class="text-lg font-semibold mb-4 text-purple-400 font-century-gothic">${log.date}</h3>
        <div class="space-x-2">
          <button class="edit-log-button text-blue-400 hover:text-blue-500 transition-colors" data-log-index="${index}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-log-button text-red-500 hover:text-red-600 transition-colors" data-log-index="${index}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <p class="mb-2"><strong class="text-gray-300 font-mono">Daily Notes:</strong> <span class="text-white font-century-gothic">${log.dailyNotes || ''}</span></p>
      <div class="log-entry-content">
        ${log.content || ''}
      </div>
    `;
    logDiv.innerHTML = logContent;
    logEntries.appendChild(logDiv);
  });
}

/***** Helper: Generate Input Field HTML based on field type *****/
function getInputField(field, inputId) {
  let inputHtml = '';
  switch (field.type) {
    case 'text':
      inputHtml = `<input type="text" id="${inputId}" name="${inputId}" class="bg-gray-700 text-white p-3 rounded w-full font-mono" />`;
      break;
    case 'number':
      inputHtml = `<input type="number" id="${inputId}" name="${inputId}" class="bg-gray-700 text-white p-3 rounded w-full font-mono" />`;
      break;
    case 'date':
      inputHtml = `<input type="date" id="${inputId}" name="${inputId}" class="bg-gray-700 text-white p-3 rounded w-full font-mono" />`;
      break;
    case 'textarea':
      inputHtml = `<textarea id="${inputId}" name="${inputId}" class="bg-gray-700 text-white p-3 rounded w-full font-mono"></textarea>`;
      break;
    case 'checkbox':
      inputHtml = `<input type="checkbox" id="${inputId}" name="${inputId}" class="mr-2 w-6 h-6 align-middle" />`;
      break;
    case 'select':
      const options = field.options ? field.options.split(',').map(opt => opt.trim()) : [];
      let selectOptionsHtml = '';
      options.forEach(opt => { selectOptionsHtml += `<option value="${opt}">${opt}</option>`; });
      inputHtml = `<select id="${inputId}" name="${inputId}" class="bg-gray-700 text-white p-3 rounded w-full font-mono">
                      ${selectOptionsHtml}
                    </select>`;
      break;
    default:
      inputHtml = `<input type="text" id="${inputId}" name="${inputId}" class="bg-gray-700 text-white p-3 rounded w-full font-mono" />`;
  }
  return inputHtml;
}

/***** Event Listeners *****/
document.addEventListener('DOMContentLoaded', () => {
  const templateButton = document.getElementById('templateButton');
  const templateBuilder = document.getElementById('templateBuilder');
  const logEntryForm = document.getElementById('logEntryForm');
  const entryForm = document.getElementById('entryForm');
  const saveTemplate = document.getElementById('saveTemplate');
  const saveEntry = document.getElementById('saveEntry');
  const addTrackButton = document.getElementById('addTrack');
  const templateTracks = document.getElementById('templateTracks');
  const exportButton = document.getElementById('exportButton');
  const searchBar = document.getElementById('searchBar');
  const tutorial = document.getElementById('tutorial');
  const closeTutorialButton = document.getElementById('closeTutorial');
  const newEntryButton = document.getElementById('newEntryButton');
  const addNewTrackButton = document.getElementById('addNewTrackButton');

  // Tutorial close: Clicking "X" hides the tutorial.
  closeTutorialButton.addEventListener('click', () => {
    tutorial.classList.add('hidden');
    if (template.length === 0) {
      templateBuilder.classList.remove('hidden');
    } else {
      renderLogEntryForm();
      logEntryForm.classList.remove('hidden');
    }
  });

  newEntryButton.addEventListener('click', () => {
    renderLogEntryForm();
    logEntryForm.classList.remove('hidden');
  });

  templateButton.addEventListener('click', () => {
    templateBuilder.classList.toggle('hidden');
    logEntryForm.classList.add('hidden');
  });

  addTrackButton.addEventListener('click', () => {
    updateTemplateFromDOM();
    template.push({
      label: 'New Prep Track',
      units: [{ label: 'New Unit', fields: [{ label: 'New Field', type: 'text' }] }]
    });
    renderTemplateTracks();
    saveCloudData();
  });

  // In Template Builder: update DOM values before adding new unit or field.
  templateTracks.addEventListener('click', (event) => {
    if (event.target.classList.contains('add-unit-button')) {
      updateTemplateFromDOM();
      const trackIndex = event.target.dataset.trackIndex;
      template[trackIndex].units.push({ label: 'New Unit', fields: [{ label: 'New Field', type: 'text' }] });
      renderTemplateTracks();
      saveCloudData();
    }
    if (event.target.classList.contains('add-field-button')) {
      updateTemplateFromDOM();
      const trackIndex = event.target.dataset.trackIndex;
      const unitIndex = event.target.dataset.unitIndex;
      template[trackIndex].units[unitIndex].fields.push({ label: 'New Field', type: 'text' });
      renderTemplateTracks();
      saveCloudData();
    }
    if (event.target.classList.contains('fa-trash')) {
      updateTemplateFromDOM();
      const targetButton = event.target.parentElement;
      if (targetButton.dataset.fieldIndex !== undefined) {
        const trackIndex = targetButton.dataset.trackIndex;
        const unitIndex = targetButton.dataset.unitIndex;
        const fieldIndex = targetButton.dataset.fieldIndex;
        template[trackIndex].units[unitIndex].fields.splice(fieldIndex, 1);
      } else if (targetButton.dataset.unitIndex !== undefined) {
        const trackIndex = targetButton.dataset.trackIndex;
        const unitIndex = targetButton.dataset.unitIndex;
        template[trackIndex].units.splice(unitIndex, 1);
      } else if (targetButton.dataset.trackIndex !== undefined) {
        const trackIndex = targetButton.dataset.trackIndex;
        template.splice(trackIndex, 1);
      }
      renderTemplateTracks();
      saveCloudData();
    }
  });

  // Save Template button event.
  saveTemplate.addEventListener('click', () => {
    updateTemplateFromDOM();
    localStorage.setItem('logtrackTemplate', JSON.stringify(template));
    templateBuilder.classList.add('hidden');
    tutorial.classList.add('hidden');
    renderLogEntryForm();
    logEntryForm.classList.remove('hidden');
    renderLogEntries();
    alert('Template saved! You can now create log entries.');
    saveCloudData();
  });

  // When a select element changes in the Template Builder, show/hide its options input.
  templateTracks.addEventListener('change', (event) => {
    if (event.target.tagName === 'SELECT') {
      const selectElement = event.target;
      const fieldDiv = selectElement.parentElement;
      const optionsInput = fieldDiv.querySelector('.field-options-input');
      if (selectElement.value === 'select') {
        optionsInput.classList.remove('hidden');
      } else {
        optionsInput.classList.add('hidden');
      }
    }
  });

  // Auto-clear default names on focusin; restore on focusout if empty.
  templateTracks.addEventListener('focusin', (event) => {
    if (event.target.classList.contains('track-name-input') && event.target.value === 'New Prep Track') {
      event.target.value = '';
    }
    if (event.target.classList.contains('unit-name-input') && event.target.value === 'New Unit') {
      event.target.value = '';
    }
    if (event.target.classList.contains('field-name-input') && event.target.value === 'New Field') {
      event.target.value = '';
    }
  });
  templateTracks.addEventListener('focusout', (event) => {
    if (event.target.classList.contains('track-name-input') && event.target.value === '') {
      event.target.value = 'New Prep Track';
    }
    if (event.target.classList.contains('unit-name-input') && event.target.value === '') {
      event.target.value = 'New Unit';
    }
    if (event.target.classList.contains('field-name-input') && event.target.value === '') {
      event.target.value = 'New Field';
    }
  });

  /***** Log Entry Form Dynamic Behavior *****/
  entryForm.addEventListener('click', (event) => {
    if (event.target.closest('.add-unit-to-track-button')) {
      const trackContainer = event.target.closest('.track-log-entry');
      let lastUnit = trackContainer.querySelector('.unit-log-entry:last-of-type');
      let newUnit;
      if (lastUnit) {
        newUnit = lastUnit.cloneNode(true);
        newUnit.querySelectorAll('input').forEach(input => input.value = '');
        newUnit.querySelectorAll('textarea').forEach(text => text.value = '');
      } else {
        newUnit = `<div class="unit-log-entry border border-gray-600 rounded p-3 my-2">
                     <div class="flex justify-between items-center">
                       <input type="text" class="bg-gray-700 text-white p-2 rounded font-mono unit-label" placeholder="Unit Name" />
                       <button type="button" class="delete-unit-log-entry-button text-red-500 hover:text-red-600">
                         <i class="fas fa-trash"></i>
                       </button>
                     </div>
                     <div class="mb-2">
                       <label class="block text-sm font-semibold mb-1 text-gray-300 font-mono">Field</label>
                       <input type="text" class="bg-gray-700 text-white p-2 rounded w-full font-mono" placeholder="Field Value" />
                     </div>
                     <button type="button" class="add-field-to-unit-button bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-semibold flex items-center mt-2">
                       <i class="fas fa-plus mr-1"></i> Add Field
                     </button>
                   </div>`;
      }
      if (typeof newUnit === "string") {
        trackContainer.insertAdjacentHTML('beforeend', newUnit);
      } else {
        trackContainer.insertAdjacentElement('beforeend', newUnit);
      }
    }
    if (event.target.closest('.delete-track-log-entry-button')) {
      const trackDiv = event.target.closest('.track-log-entry');
      trackDiv.parentElement.removeChild(trackDiv);
    }
    if (event.target.closest('.delete-unit-log-entry-button')) {
      const unitDiv = event.target.closest('.unit-log-entry');
      unitDiv.parentElement.removeChild(unitDiv);
    }
    if (event.target.closest('.add-field-to-unit-button')) {
      const unitDiv = event.target.closest('.unit-log-entry');
      const fieldHtml = `
        <div class="mb-2">
          <label class="block text-sm font-semibold mb-1 text-gray-300 font-mono">Field</label>
          <input type="text" class="bg-gray-700 text-white p-2 rounded w-full font-mono" placeholder="Field Value" />
          <button type="button" class="delete-field-log-entry-button text-red-500 hover:text-red-600">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      unitDiv.insertAdjacentHTML('beforeend', fieldHtml);
    }
    if (event.target.closest('.delete-field-log-entry-button')) {
      const fieldDiv = event.target.closest('div.mb-2');
      fieldDiv.parentElement.removeChild(fieldDiv);
    }
  });

  addNewTrackButton.addEventListener('click', () => {
    const container = document.getElementById('logEntryTracksContainer');
    const newTrackHtml = `
      <div class="track-log-entry border border-gray-700 rounded p-4 mb-4">
        <div class="flex justify-between items-center">
          <input type="text" class="bg-gray-700 text-white p-3 rounded font-mono text-lg track-label" placeholder="Custom Track Name" />
          <button type="button" class="delete-track-log-entry-button text-red-500 hover:text-red-600">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <div class="unit-log-entry border border-gray-600 rounded p-3 my-2">
          <div class="flex justify-between items-center">
            <input type="text" class="bg-gray-700 text-white p-2 rounded font-mono unit-label" placeholder="Unit Name" />
            <button type="button" class="delete-unit-log-entry-button text-red-500 hover:text-red-600">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <div class="mb-2">
            <label class="block text-sm font-semibold mb-1 text-gray-300 font-mono">Field</label>
            <input type="text" class="bg-gray-700 text-white p-2 rounded w-full font-mono" placeholder="Field Value" />
          </div>
          <button type="button" class="add-field-to-unit-button bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-semibold flex items-center mt-2">
            <i class="fas fa-plus mr-1"></i> Add Field
          </button>
        </div>
        <button type="button" class="add-unit-to-track-button bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold flex items-center mt-2">
          <i class="fas fa-plus mr-2"></i> Add Unit
        </button>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', newTrackHtml);
  });

  /***** Save & Edit Log Entry *****/
  const saveEntryHandler = () => {
    const date = document.getElementById('date').value;
    const dailyNotes = document.getElementById('daily-notes').value;
    // Clone and sanitize the log entry content (remove interactive buttons)
    const contentContainer = document.getElementById('logEntryTracksContainer').cloneNode(true);
    contentContainer.querySelectorAll('button').forEach(btn => btn.remove());
    const content = contentContainer.innerHTML;
    logs.unshift({ date, dailyNotes, content });
    saveCloudData();
    renderLogEntries();
    logEntryForm.classList.add('hidden');
    alert('Log entry saved!');
  };
  saveEntry.onclick = saveEntryHandler;

  document.getElementById('logEntries').addEventListener('click', (event) => {
    if (event.target.closest('.edit-log-button')) {
      const logIndex = event.target.closest('.edit-log-button').dataset.logIndex;
      const log = logs[logIndex];
      document.getElementById('date').value = log.date;
      document.getElementById('daily-notes').value = log.dailyNotes;
      renderLogEntryForm(log.content);
      logEntryForm.classList.remove('hidden');
      saveEntry.textContent = 'Update Log Entry';
      saveEntry.onclick = () => {
        const updatedDate = document.getElementById('date').value;
        const updatedDailyNotes = document.getElementById('daily-notes').value;
        const updatedContent = document.getElementById('logEntryTracksContainer').innerHTML;
        logs[logIndex] = { date: updatedDate, dailyNotes: updatedDailyNotes, content: updatedContent };
        saveCloudData();
        renderLogEntries();
        logEntryForm.classList.add('hidden');
        saveEntry.textContent = 'Save Log Entry';
        saveEntry.onclick = saveEntryHandler;
        alert('Log entry updated!');
      };
    }
  });

  document.getElementById('logEntries').addEventListener('click', (event) => {
    if (event.target.closest('.delete-log-button')) {
      const logIndex = event.target.closest('.delete-log-button').dataset.logIndex;
      logs.splice(logIndex, 1);
      saveCloudData();
      renderLogEntries();
    }
  });

  searchBar.addEventListener('input', () => {
    const term = searchBar.value.toLowerCase();
    const filtered = logs.filter(log =>
      log.date.toLowerCase().includes(term) ||
      (log.dailyNotes || '').toLowerCase().includes(term) ||
      (log.content || '').toLowerCase().includes(term)
    );
    renderLogEntries(filtered);
  });

  // Load cloud data on startup.
  loadCloudData();
});
