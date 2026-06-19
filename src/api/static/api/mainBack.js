// api/static/api/mainBack.js - FINAL CORRECTED VERSION

async function setupDashboard() {
  // This function will now always ensure the title and button are visible
  // and the form is hidden when the page first loads.
  // The logic for what to do when the button is clicked is handled later in the file.
  loadAccountingsIntoSidebar(); // This is the main change: load the list on page start
  const accountingTitleEl = document.getElementById('accountingTitle');
  const newAccountingBtnEl = document.getElementById('newAccountingBtn');
  const accountingBoxEl = document.getElementById('accountingBox');
  
  if (accountingTitleEl) accountingTitleEl.style.display = 'block';
  if (newAccountingBtnEl) newAccountingBtnEl.style.display = 'block';
  if (accountingBoxEl) accountingBoxEl.classList.add('hidden');
  
  // We can still fetch user data here later to populate the sidebar,
  // but it no longer controls showing/hiding the main form.
  try {
    const response = await debtpalFetch('/api/user/initial-status/');
    if (!response.ok && (response.status === 401 || response.status === 403)) {
      window.location.href = '/'; // Redirect to login if not authenticated
    }
    // const data = await response.json();
    // TODO: Use 'data' to load recent accountings into the sidebar
  } catch (error) {
    console.error('Error during dashboard setup:', error);
  }
}
// --- 1. LIST ACCOUNTINGS: Fetch all accountings from the API and display them in the sidebar ---
async function loadAccountingsIntoSidebar() {
  const sidebarList = document.querySelector('.sidebar-inner .recent-list');
  if (!sidebarList) {
      const sidebarInner = document.querySelector('.sidebar-inner');
      if(sidebarInner) {
        sidebarInner.innerHTML = '<div class="recent-label">My Accountings</div><ul class="recent-list"></ul>';
        sidebarList = document.querySelector('.sidebar-inner .recent-list');
      } else {
        return;
      }
  }

  try {
    const response = await debtpalFetch('/api/accountings/');
    if (!response.ok) throw new Error('Failed to fetch');
    const accountings = await response.json();

    sidebarList.innerHTML = ''; // Clear any existing items
    if (accountings.length === 0) {
      sidebarList.innerHTML = '<li>No accountings yet.</li>';
    } else {
      accountings.forEach(acc => {
        const li = document.createElement('li');
        li.textContent = acc.name;
        li.dataset.id = acc.id;
        li.addEventListener('click', () => loadSelectedAccounting(acc.id));
        sidebarList.appendChild(li);
      });
    }
  } catch (error) {
    sidebarList.innerHTML = '<li>Error loading.</li>';
    console.error("Error loading accountings:", error);
  }
}

// --- 2. SELECT ACCOUNTING: Fetch details for one accounting and display them ---
async function loadSelectedAccounting(accountingId) {
    currentAccountingId = accountingId;
    
    document.getElementById('accountingTitle').style.display = 'none';
    document.getElementById('newAccountingBtn').style.display = 'none';
    const accountingBox = document.getElementById('accountingBox');
    accountingBox.classList.remove('hidden');

    try {
        const response = await debtpalFetch(`/api/accountings/${accountingId}/`);
        if (!response.ok) throw new Error('Failed to fetch details');
        const data = await response.json();

        const accountingNameInput = document.getElementById('accountingNameInput');
        const accountingNameText = document.getElementById('accountingNameText');
        accountingNameText.textContent = data.name;
        accountingNameText.style.display = 'inline';
        accountingNameInput.style.display = 'none';
        accountingNameSet = true;

        const savedDebtsRow = document.getElementById('savedDebtsRow');
        savedDebtsRow.innerHTML = '';
        data.debt_items.forEach(debt => {
            const debtBoxElement = document.createElement('div');
            debtBoxElement.className = 'saved-debt-box show';
            debtBoxElement.textContent = `${debt.name} (${parseFloat(debt.price).toFixed(2)})`;
            savedDebtsRow.appendChild(debtBoxElement);
        });

        clearDebtItemFormFields();
    } catch (error) {
        console.error("Error loading accounting details:", error);
    }
}
function clearDebtItemFormFields() {
    document.getElementById('debtTitleInput').value = '';
    document.getElementById('amountInput').value = '';
    document.getElementById('commentInput').value = '';
    
    const payersList = document.getElementById('payersList');
    payersList.innerHTML = `<div class="payer-entry"><input type="text" class="payer-name-input" placeholder="Payer 1 Name"><input type="number" class="payer-amount-input" placeholder="Paid Amount" min="0" step="any"></div>`;
    
    const personsList = document.getElementById('personsList');
    personsList.innerHTML = '<input type="text" placeholder="Person 1">';
    
    updateControlsVisibility(payersList, document.getElementById('addPayerBtn'), document.getElementById('removePayerBtn'));
    updateControlsVisibility(personsList, document.getElementById('addPersonBtn'), document.getElementById('removePersonBtn'));
}
function resetToNewAccountingView() {
    // Show the initial title and "Create" button
    document.getElementById('accountingTitle').style.display = 'block';
    document.getElementById('newAccountingBtn').style.display = 'block';

    // Hide the main accounting form
    document.getElementById('accountingBox').classList.add('hidden');

    // Fully reset the form's internal state for next time
    resetAccountingFormClientSide();
}

function updateControlsVisibility(listEl, addBtnEl, removeBtnEl, limit = 3) {
    if (!listEl || !addBtnEl || !removeBtnEl) return;
    const items = listEl.querySelectorAll('.payer-entry, input[type="text"]:not(.payer-name-input)');
    const count = items.length;
    addBtnEl.style.display = (count < limit) ? 'inline-block' : 'none';
    removeBtnEl.style.display = (count > 1) ? 'inline-block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  setupDashboard();

  // --- Element Selectors ---
  const sidebarButton = document.getElementById('sidebarButton');
  const sidebar = document.getElementById('sidebar');
  const sidebarToggleInside = document.getElementById('sidebarToggleInside');
  const blurOverlay = document.getElementById('blurOverlay');
  const searchToggleBtn = document.getElementById('searchToggleBtn');
  const searchBoxContainer = document.getElementById('searchBoxContainer');
  const profileButton = document.getElementById('profileButton');
  const profileSidebar = document.getElementById('profileSidebar');
  const profileButtonInside = document.getElementById('profileButtonInside');
  const logoutButton = document.getElementById('logoutButton');
  const settingsButton = document.getElementById('settingsButton');
  const newAccountingBtn = document.getElementById('newAccountingBtn');
  const accountingBox = document.getElementById('accountingBox');
  const addButton = document.getElementById('addButton');
  const addButtonInside = document.getElementById('addButtonInside');
  const accountingNameInput = document.getElementById('accountingNameInput');
  const accountingNameText = document.getElementById('accountingNameText');
  let accountingNameSet = false;
  const saveBtn = document.getElementById('saveBtn');

  // --- UI Event Listeners ---
  if (sidebarButton) {
    sidebarButton.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      blurOverlay.classList.toggle('hidden', !sidebar.classList.contains('active'));
    });
  }
  if (sidebarToggleInside) {
    sidebarToggleInside.addEventListener('click', () => {
      sidebar.classList.remove('active');
      blurOverlay.classList.add('hidden');
    });
  }
  if (profileButton) {
    profileButton.addEventListener('click', () => {
      profileSidebar.classList.toggle('active');
      blurOverlay.classList.toggle('hidden', !profileSidebar.classList.contains('active'));
    });
  }
  if(profileButtonInside) {
    profileButtonInside.addEventListener('click', () => profileSidebar.classList.toggle('active'));
  }
  if (blurOverlay) {
    blurOverlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      profileSidebar.classList.remove('active');
      blurOverlay.classList.add('hidden');
    });
  }
  
  const showAccountingForm = () => {
    document.getElementById('accountingTitle').style.display = 'none';
    newAccountingBtn.style.display = 'none';
    accountingBox.classList.remove('hidden');
  };
  if (newAccountingBtn) newAccountingBtn.addEventListener('click', showAccountingForm);
  if (addButton) addButton.addEventListener('click', showAccountingForm);
  if (addButtonInside) addButtonInside.addEventListener('click', showAccountingForm);

  if (addButton) addButton.addEventListener('click', resetToNewAccountingView);
  if (addButtonInside) addButtonInside.addEventListener('click', resetToNewAccountingView);

  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      await debtpalFetch('/api/auth/logout/');
      window.location.href = '/';
    });
  }
  if (settingsButton) {
    settingsButton.addEventListener('click', () => window.location.href = '/settings');
  }
  // --- SEARCH: Logic for the search icon and input field ---

  const searchInput = document.getElementById('searchInput');

  if (searchToggleBtn) {
    searchToggleBtn.addEventListener('click', () => {
      searchBoxContainer.classList.toggle('hidden');
      if (!searchBoxContainer.classList.contains('hidden')) {
        searchInput.focus();
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const accountings = document.querySelectorAll('.sidebar-inner .recent-list li');
      accountings.forEach(li => {
        const name = li.textContent.toLowerCase();
        if (name.includes(searchTerm)) {
          li.style.display = 'block';
        } else {
          li.style.display = 'none';
        }
      });
    });
  }


  const transactionsButton = document.getElementById('transactionsButton');
  if (transactionsButton) {
    transactionsButton.addEventListener('click', () => {
      window.location.href = '/transactions/';
    });
  }
  

  // --- Dynamic Form Lists Logic ---
  const payersList = document.getElementById('payersList');
  const addPayerBtn = document.getElementById('addPayerBtn');
  const removePayerBtn = document.getElementById('removePayerBtn');
  if (addPayerBtn) {
    addPayerBtn.addEventListener('click', () => {
      if (payersList.children.length < 3) {
        const newEntry = document.createElement('div');
        newEntry.className = 'payer-entry';
        newEntry.innerHTML = `<input type="text" class="payer-name-input" placeholder="Payer ${payersList.children.length + 1} Name"><input type="number" class="payer-amount-input" placeholder="Paid Amount" min="0" step="any">`;
        payersList.appendChild(newEntry);
      }
      updateControlsVisibility(payersList, addPayerBtn, removePayerBtn);
    });
  }
  if (removePayerBtn) {
    removePayerBtn.addEventListener('click', () => {
        if (payersList.children.length > 1) payersList.removeChild(payersList.lastElementChild);
        updateControlsVisibility(payersList, addPayerBtn, removePayerBtn);
    });
  }
  
  const personsList = document.getElementById('personsList');
  const addPersonBtn = document.getElementById('addPersonBtn');
  const removePersonBtn = document.getElementById('removePersonBtn');
  if (addPersonBtn) {
    addPersonBtn.addEventListener('click', () => {
        if (personsList.children.length < 10) {
            const newInput = document.createElement('input');
            newInput.type = 'text';
            newInput.placeholder = `Person ${personsList.children.length + 1}`;
            personsList.appendChild(newInput);
        }
        updateControlsVisibility(personsList, addPersonBtn, removePersonBtn);
    });
  }
  if (removePersonBtn) {
    removePersonBtn.addEventListener('click', () => {
        if (personsList.children.length > 1) personsList.removeChild(personsList.lastElementChild);
        updateControlsVisibility(personsList, addPersonBtn, removePersonBtn);
    });
  }
  // --- CORRECTED "SAVE DEBT ITEM" BUTTON LOGIC (Connects to Django API) ---
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      // 1. Set Accounting Name if not set
      if (!accountingNameSet) {
        const name = accountingNameInput.value.trim();
        if (!name) { alert("Please enter an Accounting Name first!"); return; }
        accountingNameText.textContent = name;
        accountingNameText.style.display = 'inline';
        accountingNameInput.style.display = 'none';
        accountingNameSet = true;
      }
      
      // 2. Gather data from form
      const debtTitleInput = document.getElementById('debtTitleInput');
      const amountInput = document.getElementById('amountInput');
      const commentInput = document.getElementById('commentInput');

      const debtTitle = debtTitleInput.value.trim();
      const totalAmountVal = parseFloat(amountInput.value);
      
      const payersData = Array.from(payersList.querySelectorAll('.payer-entry')).map(entry => ({
        name: entry.querySelector('.payer-name-input').value.trim(),
        amount: parseFloat(entry.querySelector('.payer-amount-input').value)
      })).filter(p => p.name && !isNaN(p.amount) && p.amount > 0);
  
      const involvedPeopleData = Array.from(personsList.querySelectorAll('input[type="text"]')).map(input => input.value.trim()).filter(Boolean);

      // 3. Client-side validation
      if (!debtTitle || isNaN(totalAmountVal) || totalAmountVal <= 0 || payersData.length === 0 || involvedPeopleData.length === 0) {
        alert("Please fill out all required fields: Title, Amount, at least one Payer, and at least one Involved Person.");
        return;
      }
      const sumOfPaidAmounts = payersData.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(sumOfPaidAmounts - totalAmountVal) > 0.01) {
          alert(`The sum of Payer amounts (${sumOfPaidAmounts.toFixed(2)}) must match the Total Amount (${totalAmountVal.toFixed(2)}).`);
          return;
      }

      // 4. Prepare data payload for the API
      const apiPayload = {
        accountingName: accountingNameText.textContent.trim(),
        debtItem: {
          name: debtTitle,
          price: totalAmountVal,
          comment: commentInput.value.trim(),
          date: new Date().toISOString().split('T')[0], // Use today's date
          payers: payersData,
          involvedPersons: involvedPeopleData
        }
      };

      // 5. Send data to the Django API
      try {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        const response = await debtpalFetch('/api/accountings/add-debt/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiPayload)
        });

        const result = await response.json();

        if (response.ok) {
          // Success! Add the debt to the visual list using data from the server
          const debtBoxElement = document.createElement('div');
          debtBoxElement.className = 'saved-debt-box show';
          debtBoxElement.textContent = `${result.savedDebt.name} (${parseFloat(result.savedDebt.price).toFixed(2)})`;
          
          // Store details for the modal to use
          debtBoxElement.dataset.details = JSON.stringify({
              title: result.savedDebt.name,
              accountingName: accountingNameText.textContent.trim(),
              totalAmount: result.savedDebt.price,
              payers: result.savedDebt.payers, // Use payers data from response
              involved: result.savedDebt.involved_persons.map(p => p.name), // Use involved persons data from response
              comment: result.savedDebt.comment,
              timestamp: new Date(result.savedDebt.created_at).toLocaleString()
          });

          debtBoxElement.addEventListener('click', () => {
              showDebtDetailsInModal(JSON.parse(debtBoxElement.dataset.details));
          });

          savedDebtsRow.appendChild(debtBoxElement);
          clearDebtItemFormFields();
          debtTitleInput.focus();
          loadAccountingsIntoSidebar()
        } else {
          alert(`Error: ${result.message || 'Failed to save debt.'}`);
        }
      } catch (error) {
        alert('A network error occurred. Could not save debt.');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Debt Item';
      }
    });
  }

  // --- Modal Logic ---
  const debtDetailsModal = document.getElementById('debtDetailsModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  if (modalCloseBtn) {
      modalCloseBtn.onclick = () => { if(debtDetailsModal) debtDetailsModal.style.display = "none"; }
  }
  if (debtDetailsModal) {
    window.addEventListener('click', (event) => {
        if (event.target == debtDetailsModal) { if(debtDetailsModal) debtDetailsModal.style.display = "none"; }
    });
  }
  
  function showDebtDetailsInModal(details) { 
    if (!debtDetailsModal) return;
    const getEl = (id) => document.getElementById(id);

    getEl('modalDebtTitle').textContent = details.title || 'N/A';
    getEl('modalAccountingName').textContent = details.accountingName || 'N/A';
    getEl('modalTotalAmount').textContent = details.totalAmount ? parseFloat(details.totalAmount).toFixed(2) : 'N/A';
    
    const modalPayersListEl = getEl('modalPayersList');
    if (modalPayersListEl) {
        modalPayersListEl.innerHTML = ''; 
        if (details.payers && details.payers.length > 0) {
            details.payers.forEach(p => {
                const li = document.createElement('li');
                li.textContent = `${p.name}: ${parseFloat(p.paid_amount).toFixed(2)}`;
                modalPayersListEl.appendChild(li);
            });
        }
    }

    const modalInvolvedPeopleListEl = getEl('modalInvolvedPeopleList');
    if (modalInvolvedPeopleListEl) {
        modalInvolvedPeopleListEl.innerHTML = '';
        if (details.involved && details.involved.length > 0) {
            details.involved.forEach(personName => {
                const li = document.createElement('li');
                li.textContent = personName;
                modalInvolvedPeopleListEl.appendChild(li);
            });
        }
    }
    
    const modalCommentSpan = getEl('modalComment');
    const modalCommentSection = getEl('modalCommentSection');
    if (modalCommentSpan && modalCommentSection) {
        if (details.comment) {
            modalCommentSpan.textContent = details.comment;
            modalCommentSection.style.display = 'block';
        } else {
            modalCommentSection.style.display = 'none';
        }
    }
    getEl('modalTimestamp').textContent = details.timestamp || 'N/A';
    
    debtDetailsModal.style.display = "block";
  }
});