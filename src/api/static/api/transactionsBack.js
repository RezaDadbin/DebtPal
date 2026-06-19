document.addEventListener('DOMContentLoaded', () => {
    const accountingsListEl = document.getElementById('accountingsList');
    const detailsPlaceholderEl = document.getElementById('detailsPlaceholder');
    const detailsViewEl = document.getElementById('detailsView');
    const selectedAccountingNameEl = document.getElementById('selectedAccountingName');
    const totalToReceiveEl = document.getElementById('totalToReceive');
    const receiveDetailsListEl = document.getElementById('receiveDetailsList');
    const totalToPayEl = document.getElementById('totalToPay');
    const payDetailsListEl = document.getElementById('payDetailsList');
    const settlementPlanEl = document.getElementById('settlementPlan');
    const deleteAccountingBtn = document.getElementById('deleteAccountingBtn');
    let debtChart = null; // To hold our chart instance

    let currentAccountingId = null;

    // --- 1. Fetch all accountings on page load ---
    async function loadAccountings() {
        try {
            const response = await debtpalFetch('/api/accountings/');
            if (!response.ok) throw new Error('Failed to fetch accountings');
            const accountings = await response.json();

            accountingsListEl.innerHTML = ''; // Clear "Loading..."
            if (accountings.length === 0) {
                accountingsListEl.innerHTML = '<li>No accountings found.</li>';
                return;
            }

            accountings.forEach(acc => {
                const li = document.createElement('li');
                li.textContent = acc.name;
                li.dataset.id = acc.id;
                li.addEventListener('click', () => {
                    // Remove 'active' class from any other item
                    document.querySelectorAll('#accountingsList li').forEach(item => item.classList.remove('active'));
                    // Add 'active' class to the clicked item
                    li.classList.add('active');
                    loadAccountingDetails(acc.id);
                });
                accountingsListEl.appendChild(li);
            });

        } catch (error) {
            accountingsListEl.innerHTML = '<li>Error loading accountings.</li>';
            console.error(error);
        }
    }

    // --- 2. Fetch details for a single, selected accounting ---
    async function loadAccountingDetails(id) {
        currentAccountingId = id;
        detailsPlaceholderEl.classList.add('hidden');
        detailsViewEl.classList.remove('hidden');

        try {
            const settleResponse = await debtpalFetch(`/api/accountings/${id}/settle/`);
            if (!settleResponse.ok) throw new Error('Failed to fetch settlement data');
            const settleData = await settleResponse.json();

            const detailResponse = await debtpalFetch(`/api/accountings/${id}/`);
            if (!detailResponse.ok) throw new Error('Failed to fetch detail data');
            const detailData = await detailResponse.json();
        
            // Check if the data is valid before trying to use it
            if (!settleData || !settleData.final_balances) {
                throw new Error('Received invalid data from server');
            }

            selectedAccountingNameEl.textContent = settleData.accounting_name || 'Details';

            // Populate balances and settlement plan
            populateBalances(settleData.final_balances);
            populateSettlementPlan(settleData.settlement_plan);
            
            // Create the chart
            createDebtChart(settleData.final_balances);
            populateDebtItems(detailData.debt_items);

        } catch (error) {
            console.error('Error loading details:', error);
            // Display a more permanent error message if something fails
            detailsViewEl.classList.add('hidden');
            detailsPlaceholderEl.classList.remove('hidden');
            detailsPlaceholderEl.textContent = 'Error loading details.';
        }
    }

// Also, create a new, separate function for the settlement plan
    function populateSettlementPlan(plan) {
        settlementPlanEl.innerHTML = '';
        if (plan && plan.length > 0) {
            plan.forEach(p => {
                const paymentEl = document.createElement('p');
                // Using parseFloat to ensure it's treated as a number before toFixed
                const amount = parseFloat(p.amount).toFixed(2);
                paymentEl.innerHTML = `<strong>${p.from}</strong> should pay <strong>${p.to}</strong> <span class="amount">${amount}</span>`;
                settlementPlanEl.appendChild(paymentEl);
            });
        } else {
            settlementPlanEl.innerHTML = '<p>All debts are settled!</p>';
        }
    }
    
    // Find and replace your existing populateBalances function with this
    function populateBalances(balances) {
        const finalBalancesListEl = document.getElementById('finalBalancesList');
        finalBalancesListEl.innerHTML = '';

        // Check if the balances object is empty
        if (Object.keys(balances).length === 0) {
            const li = document.createElement('li');
            li.textContent = "No balances to show.";
            finalBalancesListEl.appendChild(li);
            return;
        }

        for (const person in balances) {
            // Convert the string amount back to a number for processing
            const amount = parseFloat(balances[person]);
            const li = document.createElement('li');
            li.textContent = `${person}: ${amount.toFixed(2)}`;
            
            if (amount > 0) {
                li.className = 'credit';
            } else if (amount < 0) {
                li.className = 'debt';
            }
            finalBalancesListEl.appendChild(li);
            }
    }

    // Find and replace your existing createDebtChart function with this
    function createDebtChart(balances) {
        const ctx = document.getElementById('debtChart').getContext('2d');
        
        // Create labels and data arrays from the new balances object
        const labels = Object.keys(balances);
        const data = Object.values(balances).map(val => parseFloat(val));

        if (debtChart) {
            debtChart.destroy();
        }

        debtChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Final Balance',
                    data: data,
                    backgroundColor: data.map(d => d < 0 ? 'rgba(220, 53, 69, 0.7)' : 'rgba(40, 167, 69, 0.7)'),
                    borderColor: data.map(d => d < 0 ? '#dc3545' : '#28a745'),
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        ticks: { color: 'white' }
                    },
                    x: {
                        ticks: { color: 'white' }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }


    // Add this new function to transactionsBack.js
    function populateDebtItems(debtItems) {
        const container = document.getElementById('debtItemsContainer');
        container.innerHTML = ''; // Clear previous items

        if (!debtItems || debtItems.length === 0) {
            container.innerHTML = '<p>No debt items found in this accounting.</p>';
            return;
        }

        debtItems.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'debt-item-card';

            const payersHTML = item.payers.map(p => `<li>${p.name} (paid ${parseFloat(p.paid_amount).toFixed(2)})</li>`).join('');
            const involvedHTML = item.involved_persons.map(p => `<li>${p.name}</li>`).join('');

            itemEl.innerHTML = `
                <h4>${item.name} - <span class="price">${parseFloat(item.price).toFixed(2)}</span></h4>
                <div class="debt-details-grid">
                    <div>
                        <strong>Payers:</strong>
                        <ul>${payersHTML}</ul>
                    </div>
                    <div>
                        <strong>Involved:</strong>
                        <ul>${involvedHTML}</ul>
                    </div>
                </div>
                ${item.comment ? `<p class="comment"><strong>Comment:</strong> ${item.comment}</p>` : ''}
            `;
            container.appendChild(itemEl);
        });
    }

    // --- 4. Delete accounting functionality ---
    // Find and replace your existing deleteAccountingBtn event listener with this
    // Find and replace your existing deleteAccountingBtn event listener with this
    deleteAccountingBtn.addEventListener('click', async () => {
        if (!currentAccountingId) {
            alert("Please select an accounting first.");
            return;
        }

        if (confirm(`Are you sure you want to delete the "${selectedAccountingNameEl.textContent}" accounting? This action cannot be undone.`)) {
            try {
                const response = await debtpalFetch(`/api/accountings/${currentAccountingId}/`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    alert('Accounting deleted successfully.');
                    window.location.reload();
                } else {
                    alert('Failed to delete the accounting. Please try again.');
                }
            } catch (error) {
                console.error('Error deleting accounting:', error);
                alert('An error occurred while trying to delete the accounting.');
            }
        }
    });

    // --- Initial Load ---
    loadAccountings();
});