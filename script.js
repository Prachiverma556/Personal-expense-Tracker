// Simple expense tracker using localStorage
const form = document.getElementById('expense-form');
const tableBody = document.querySelector('#expenses-table tbody');
const totalEl = document.getElementById('total');
const filterMonth = document.getElementById('filter-month');
const exportBtn = document.getElementById('export-btn');

let expenses = JSON.parse(localStorage.getItem('expenses') || '[]');

function saveExpenses(){
  localStorage.setItem('expenses', JSON.stringify(expenses));
}

function formatDateISO(dateStr){
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}

function render(filterMonthValue){
  tableBody.innerHTML = '';
  let sum = 0;
  const rows = expenses
    .filter(e => {
      if(!filterMonthValue) return true;
      const [y,m] = filterMonthValue.split('-').map(Number);
      const ed = new Date(e.date);
      return ed.getFullYear() === y && (ed.getMonth()+1) === m;
    })
    .sort((a,b)=> new Date(b.date) - new Date(a.date));

  rows.forEach(e=>{
    sum += Number(e.amount);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDateISO(e.date)}</td>
      <td>${e.category}</td>
      <td>₹${Number(e.amount).toFixed(2)}</td>
      <td>${e.note || ''}</td>
      <td>
        <button class="action-btn" data-id="${e.id}" data-action="delete">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  totalEl.textContent = `Total: ₹${sum.toFixed(2)}`;
}

function addExpense(exp){
  expenses.push(exp);
  saveExpenses();
  render(filterMonth.value);
}

function deleteExpense(id){
  expenses = expenses.filter(e => e.id !== id);
  saveExpenses();
  render(filterMonth.value);
}

form.addEventListener('submit', e=>{
  e.preventDefault();
  const amount = form.querySelector('#amount').value.trim();
  const category = form.querySelector('#category').value;
  const date = form.querySelector('#date').value;
  const note = form.querySelector('#note').value.trim();
  if(!amount || !category || !date){ alert('Please fill amount, category and date'); return; }
  const expense = { id: Date.now().toString(), amount: parseFloat(amount), category, date, note };
  addExpense(expense);
  form.reset();
});

tableBody.addEventListener('click', e=>{
  const btn = e.target.closest('button');
  if(!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if(action === 'delete'){
    if(confirm('Delete this expense?')){
      deleteExpense(id);
    }
  }
});

filterMonth.addEventListener('change', ()=> render(filterMonth.value) );

exportBtn.addEventListener('click', ()=>{
  // export visible rows (respecting month filter)
  const month = filterMonth.value;
  const rows = expenses.filter(e => {
    if(!month) return true;
    const [y,m] = month.split('-').map(Number);
    const ed = new Date(e.date);
    return ed.getFullYear() === y && (ed.getMonth()+1) === m;
  });
  const csvRows = [
    ['Date','Category','Amount','Note'],
    ...rows.map(r => [new Date(r.date).toLocaleDateString(), r.category, r.amount, `"${(r.note||'').replace(/"/g,'""')}"`])
  ];
  const csv = csvRows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'expenses.csv';
  a.click();
  URL.revokeObjectURL(url);
});

// initial render
render();

