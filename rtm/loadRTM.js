export async function loadRTM() {
  try {
    const response = await fetch('rtm.json');
    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }
    const data = await response.json();
    console.log('RTM data:', data);
    const { rtm, specList } = data;
    const rtmBody = document.getElementById('rtm-body');
    const specMapBody = document.getElementById('spec-map-body');
    let activeRow = null;
    let activeSpecRow = null;

    rtm.forEach((entry, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${entry.requirement.id}</td><td>${entry.requirement.description}</td>`;
      row.addEventListener('click', () => toggleAccordion(index, entry.testCases, row));
      rtmBody.appendChild(row);
    });

    specList.forEach((spec, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${spec.file}</td><td>${spec.requirements.join(', ')}</td>`;
      row.addEventListener('click', () => toggleSpecAccordion(index, spec.requirements, row));
      specMapBody.appendChild(row);
    });

    function toggleAccordion(index, testCases, row) {
      if (activeRow && activeRow !== row) {
        const existingAccordion = activeRow.nextElementSibling;
        if (existingAccordion && existingAccordion.classList.contains('test-case-accordion')) {
          existingAccordion.remove();
        }
      }

      const existingAccordion = row.nextElementSibling;
      if (existingAccordion && existingAccordion.classList.contains('test-case-accordion')) {
        existingAccordion.remove();
        activeRow = null;
      } else {
        const accordionItem = document.createElement('tr');
        accordionItem.className = 'test-case-accordion';
        accordionItem.innerHTML = `
          <td colspan="2">
            <div class="card">
              <div class="card-header">
                <button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapse-${index}" aria-expanded="true" aria-controls="collapse-${index}">
                  Test Cases
                </button>
              </div>
              <div id="collapse-${index}" class="collapse show">
                <div class="card-body">
                  ${testCases.length > 0 ? `
                    <ul>
                      ${testCases.map(testCase => `
                        <li class="test-case"><span class="icon">🧪</span>${testCase.description}
                          ${testCase.tags.length > 0 ? `<span class="badge badge-info ml-2">${testCase.tags.join('</span> <span class="badge badge-info">')}</span>` : ''}
                        </li>
                      `).join('')}
                    </ul>
                  ` : '<ul><li class="test-case">No test cases found</li></ul>'}
                </div>
              </div>
            </div>
          </td>
        `;

        row.after(accordionItem);
        activeRow = row;
      }
    }

    function toggleSpecAccordion(index, requirements, row) {
      if (activeSpecRow && activeSpecRow !== row) {
        const existingAccordion = activeSpecRow.nextElementSibling;
        if (existingAccordion && existingAccordion.classList.contains('spec-accordion')) {
          existingAccordion.remove();
        }
      }

      const existingAccordion = row.nextElementSibling;
      if (existingAccordion && existingAccordion.classList.contains('spec-accordion')) {
        existingAccordion.remove();
        activeSpecRow = null;
      } else {
        const accordionItem = document.createElement('tr');
        accordionItem.className = 'spec-accordion';
        accordionItem.innerHTML = `
          <td colspan="2">
            <div class="card">
              <div class="card-header">
                <button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapse-spec-${index}" aria-expanded="true" aria-controls="collapse-spec-${index}">
                  Requirements
                </button>
              </div>
              <div id="collapse-spec-${index}" class="collapse show">
                <div class="card-body">
                  ${requirements.length > 0 ? `
                    <ul>
                      ${requirements.map(requirement => `<li class="requirement"><span class="icon">📄</span>${requirement}</li>`).join('')}
                    </ul>
                  ` : '<ul><li class="requirement">No requirements found</li></ul>'}
                </div>
              </div>
            </div>
          </td>
        `;

        row.after(accordionItem);
        activeSpecRow = row;
      }
    }
  } catch (error) {
    console.error('Failed to load RTM data:', error);
  }
}
