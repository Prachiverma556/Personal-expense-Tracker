// script.js — upgraded: add edit, validation, improved UX
const form = document.getElementById('expense-form');
const tableBody = document.querySelector('#expenses-table tbody');
const totalEl = document.getElementById('total');
const filterMonth = document.getElementById('filter-month');
const exportBtn = document.getElementById('export-btn');

let expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
let editId = null;

function saveExpenses(){
  localStorage.setItem('expenses', JSON.stringify(expenses));
}

function formatDateISO(dateStr){
  if(!dateStr) return '';
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
      <td>${escapeHtml(e.category)}</td>
      <td>₹${Number(e.amount).toFixed(2)}</td>
      <td>${escapeHtml(e.note || '')}</td>
      <td>
        <button class="action-btn" data-id="${e.id}" data-action="edit">Edit</button>
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

function updateExpense(id, payload){
  expenses = expenses.map(e => e.id === id ? { ...e, ...payload } : e);
  saveExpenses();
  render(filterMonth.value);
}

function deleteExpense(id){
  expenses = expenses.filter(e => e.id !== id);
  saveExpenses();
  render(filterMonth.value);
}

function escapeHtml(str){
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function clearForm(){
  form.reset();
  editId = null;
  form.querySelector('button[type="submit"]').textContent = 'Add Expense';
}

// Validation helper
function validate({ amount, category, date }){
  if (!amount || isNaN(amount) || Number(amount) <= 0) return 'Enter a valid amount > 0';
  if (!category) return 'Select a category';
  if (!date) return 'Select a date';
  return null;
}

form.addEventListener('submit', e=>{
  e.preventDefault();
  const amount = form.querySelector('#amount').value.trim();
  const category = form.querySelector('#category').value;
  const date = form.querySelector('#date').value;
  const note = form.querySelector('#note').value.trim();

  const err = validate({ amount, category, date });
  if (err) { alert(err); return; }

  if(editId){
    updateExpense(editId, { amount: parseFloat(amount), category, date, note });
    clearForm();
  } else {
    const expense = { id: Date.now().toString(), amount: parseFloat(amount), category, date, note };
    addExpense(expense);
    form.reset();
  }
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
  } else if(action === 'edit'){
    const item = expenses.find(x => x.id === id);
    if(!item) return;
    // populate form
    form.querySelector('#amount').value = item.amount;
    form.querySelector('#category').value = item.category;
    form.querySelector('#date').value = item.date;
    form.querySelector('#note').value = item.note || '';
    editId = id;
    form.querySelector('button[type="submit"]').textContent = 'Save Changes';
    // scroll to form
    form.scrollIntoView({ behavior: 'smooth' });
  }
});

filterMonth.addEventListener('change', ()=> render(filterMonth.value) );

exportBtn.addEventListener('click', ()=>{
  const month = filterMonth.value;
  const rows = expenses.filter(e => {
    if(!month) return true;
    const [y,m] = month.split('-').map(Number);
    const ed = new Date(e.date);
    return ed.getFullYear() === y && (ed.getMonth()+1) === m;
  });
  if(rows.length === 0){ alert('No expenses to export'); return; }
  const csvRows = [
    ['Date','Category','Amount','Note'],
    ...rows.map(r => [new Date(r.date).toLocaleDateString(), r.category, r.amount, (r.note||'').replace(/"/g,'""')])
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

  
