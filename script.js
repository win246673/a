const STORAGE_KEY = 'multiToolApp';
let appData = {
    theme: 'light',
    calculator: {
        history: []
    },
    todo: {
        items: []
    },
    accounts: {
        records: []
    },
    stats: {
        calcCount: 0,
        todoCount: 0,
        accCount: 0,
        recentRecords: []
    }
};

let calcDisplay = document.getElementById('calc-display');
let calcCurrentInput = '0';
let calcPreviousInput = '';
let calcOperator = null;
let todoFilter = 'all';

function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        appData = JSON.parse(saved);
    }
    applyTheme(appData.theme);
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY) ? JSON.parse(localStorage.getItem(STORAGE_KEY)).theme : 'light';
    applyTheme(savedTheme);
}

document.getElementById('themeToggle').addEventListener('click', () => {
    const newTheme = appData.theme === 'light' ? 'dark' : 'light';
    appData.theme = newTheme;
    applyTheme(newTheme);
    saveData();
});

document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabId = tab.getAttribute('data-tab');
        document.querySelectorAll('.tool-section').forEach(s => s.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        if (['calculator', 'todo', 'accounts'].includes(tabId)) {
            addRecentRecord(tabId);
        }
        updateStats();
    });
});

function addRecentRecord(tool) {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const record = {
        tool: tool,
        time: timeStr,
        date: now.toLocaleDateString()
    };
    appData.stats.recentRecords.unshift(record);
    if (appData.stats.recentRecords.length > 10) {
        appData.stats.recentRecords.pop();
    }
    saveData();
}

function showRecent(tool) {
    const modal = document.getElementById('recentModal');
    const list = document.getElementById('recentModalList');
    const toolRecords = appData.stats.recentRecords.filter(r => r.tool === tool);
    if (toolRecords.length === 0) {
        list.innerHTML = '<li>暂无最近使用记录</li>';
    } else {
        list.innerHTML = toolRecords.map(r =>
            `<li>${getToolName(r.tool)} - ${r.date} ${r.time}</li>`
        ).join('');
    }
    modal.classList.add('show');
}

function closeRecentModal() {
    document.getElementById('recentModal').classList.remove('show');
}

function getToolName(tool) {
    const names = {
        calculator: '计算器',
        todo: '待办事项',
        accounts: '记账本'
    };
    return names[tool] || tool;
}

document.getElementById('exportBtn').addEventListener('click', () => {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toolapp-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
});

document.getElementById('importFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (confirm('确定要导入数据吗？这将覆盖当前所有数据。')) {
                    appData = importedData;
                    saveData();
                    applyTheme(appData.theme);
                    initCalculator();
                    renderTodoList();
                    renderAccounts();
                    updateStats();
                    alert('数据导入成功！');
                }
            } catch (error) {
                alert('文件格式错误，导入失败！');
            }
        };
        reader.readAsText(file);
    }
    e.target.value = '';
});

function calcUpdateDisplay() {
    calcDisplay.textContent = calcCurrentInput;
}

function calcAppendNum(num) {
    if (calcCurrentInput === '0') {
        calcCurrentInput = num;
    } else {
        calcCurrentInput += num;
    }
    calcUpdateDisplay();
}

function calcAppendDecimal() {
    if (!calcCurrentInput.includes('.')) {
        calcCurrentInput += '.';
        calcUpdateDisplay();
    }
}

function calcAppendOp(op) {
    if (calcOperator !== null && calcPreviousInput !== '') {
        calcEquals();
    }
    calcPreviousInput = calcCurrentInput;
    calcOperator = op;
    calcCurrentInput = '0';
}

function calcClear() {
    calcCurrentInput = '0';
    calcPreviousInput = '';
    calcOperator = null;
    calcUpdateDisplay();
}

function calcDelete() {
    if (calcCurrentInput.length > 1) {
        calcCurrentInput = calcCurrentInput.slice(0, -1);
    } else {
        calcCurrentInput = '0';
    }
    calcUpdateDisplay();
}

function calcEquals() {
    if (calcOperator === null || calcPreviousInput === '') {
        return;
    }
    appData.stats.calcCount++;
    saveData();
    const prev = parseFloat(calcPreviousInput);
    const current = parseFloat(calcCurrentInput);
    if (isNaN(prev) || isNaN(current)) {
        return;
    }
    let result;
    switch (calcOperator) {
        case '+':
            result = prev + current;
            break;
        case '-':
            result = prev - current;
            break;
        case '*':
            result = prev * current;
            break;
        case '/':
            if (current === 0) {
                result = 'Error';
            } else {
                result = prev / current;
            }
            break;
        default:
            return;
    }
    const expression = `${prev} ${calcOperator} ${current} = ${result}`;
    appData.calculator.history.unshift(expression);
    if (appData.calculator.history.length > 10) {
        appData.calculator.history.pop();
    }
    saveData();
    renderCalcHistory();
    if (typeof result === 'number' && !Number.isInteger(result)) {
        result = result.toFixed(10).replace(/\.?0+$/, '');
    }
    calcCurrentInput = result.toString();
    calcPreviousInput = '';
    calcOperator = null;
    calcUpdateDisplay();
}

function renderCalcHistory() {
    const list = document.getElementById('calc-history-list');
    list.innerHTML = appData.calculator.history.map(h => `<li>${h}</li>`).join('');
}

function initCalculator() {
    calcCurrentInput = '0';
    calcPreviousInput = '';
    calcOperator = null;
    calcUpdateDisplay();
    renderCalcHistory();
}

function addTodo() {
    const input = document.getElementById('todo-input');
    const priority = document.getElementById('todo-priority');
    const text = input.value.trim();
    if (!text) {
        alert('请输入待办内容');
        return;
    }
    appData.stats.todoCount++;
    const todo = {
        id: Date.now(),
        text: text,
        priority: priority.value,
        completed: false,
        createdAt: new Date().toLocaleString()
    };
    appData.todo.items.unshift(todo);
    saveData();
    input.value = '';
    renderTodoList();
    updateStats();
}

function toggleTodo(id) {
    const todo = appData.todo.items.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveData();
        renderTodoList();
        updateStats();
    }
}

function deleteTodo(id) {
    appData.todo.items = appData.todo.items.filter(t => t.id !== id);
    saveData();
    renderTodoList();
    updateStats();
}

function renderTodoList() {
    const list = document.getElementById('todo-list');
    let filtered = appData.todo.items;
    if (todoFilter === 'pending') {
        filtered = appData.todo.items.filter(t => !t.completed);
    } else if (todoFilter === 'completed') {
        filtered = appData.todo.items.filter(t => t.completed);
    }
    list.innerHTML = filtered.map(todo => `
        <li class="todo-item ${todo.completed ? 'completed' : ''}">
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} onclick="toggleTodo(${todo.id})">
            <span class="todo-text">${todo.text}</span>
            <span class="todo-priority ${todo.priority}">${getPriorityText(todo.priority)}</span>
            <button class="todo-delete" onclick="deleteTodo(${todo.id})">删除</button>
        </li>
    `).join('');
    updateTodoStats();
}

function getPriorityText(priority) {
    const texts = { low: '低', medium: '中', high: '高' };
    return texts[priority] || priority;
}

function updateTodoStats() {
    const total = appData.todo.items.length;
    const completed = appData.todo.items.filter(t => t.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    document.getElementById('todo-total').textContent = total;
    document.getElementById('todo-completed').textContent = completed;
    document.getElementById('todo-rate').textContent = rate + '%';
}

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        todoFilter = btn.getAttribute('data-filter');
        renderTodoList();
    });
});

document.getElementById('todo-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});

function addAccount() {
    const type = document.getElementById('acc-type').value;
    const amountInput = document.getElementById('acc-amount');
    const descInput = document.getElementById('acc-desc');
    const amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount <= 0) {
        alert('请输入有效金额');
        return;
    }
    appData.stats.accCount++;
    const record = {
        id: Date.now(),
        type: type,
        amount: amount,
        desc: descInput.value.trim() || '无说明',
        date: new Date().toLocaleString()
    };
    appData.accounts.records.unshift(record);
    saveData();
    amountInput.value = '';
    descInput.value = '';
    renderAccounts();
    updateStats();
}

function deleteAccount(id) {
    appData.accounts.records = appData.accounts.records.filter(r => r.id !== id);
    saveData();
    renderAccounts();
    updateStats();
}

function renderAccounts() {
    const list = document.getElementById('acc-list');
    let totalIncome = 0;
    let totalExpense = 0;
    appData.accounts.records.forEach(r => {
        if (r.type === 'income') {
            totalIncome += r.amount;
        } else {
            totalExpense += r.amount;
        }
    });
    document.getElementById('total-income').textContent = '¥' + totalIncome.toFixed(2);
    document.getElementById('total-expense').textContent = '¥' + totalExpense.toFixed(2);
    document.getElementById('total-balance').textContent = '¥' + (totalIncome - totalExpense).toFixed(2);
    list.innerHTML = appData.accounts.records.map(r => `
        <li class="acc-item ${r.type}">
            <span class="acc-type">${r.type === 'income' ? '收入' : '支出'}</span>
            <span class="acc-amount">${r.type === 'income' ? '+' : '-'}¥${r.amount.toFixed(2)}</span>
            <span class="acc-desc">${r.desc}</span>
            <span class="acc-date">${r.date}</span>
            <button class="acc-delete" onclick="deleteAccount(${r.id})">删除</button>
        </li>
    `).join('');
    if (appData.accounts.records.length === 0) {
        list.innerHTML = '<li style="text-align:center;padding:20px;color:var(--text-secondary);">暂无记录</li>';
    }
}

document.getElementById('acc-amount').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addAccount();
    }
});

document.getElementById('acc-desc').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addAccount();
    }
});

function updateStats() {
    document.getElementById('stat-calc-count').textContent = appData.stats.calcCount;
    document.getElementById('stat-todo-count').textContent = appData.stats.todoCount;
    const todoTotal = appData.todo.items.length;
    const todoCompleted = appData.todo.items.filter(t => t.completed).length;
    const todoRate = todoTotal > 0 ? Math.round((todoCompleted / todoTotal) * 100) : 0;
    document.getElementById('stat-todo-rate').textContent = todoRate + '%';
    document.getElementById('stat-acc-count').textContent = appData.stats.accCount;
    let totalIncome = 0;
    let totalExpense = 0;
    appData.accounts.records.forEach(r => {
        if (r.type === 'income') totalIncome += r.amount;
        else totalExpense += r.amount;
    });
    document.getElementById('stat-acc-income').textContent = '¥' + totalIncome.toFixed(0);
    document.getElementById('stat-acc-expense').textContent = '¥' + totalExpense.toFixed(0);
    const recentList = document.getElementById('recent-list');
    if (appData.stats.recentRecords.length === 0) {
        recentList.innerHTML = '<li>暂无最近操作记录</li>';
    } else {
        recentList.innerHTML = appData.stats.recentRecords.slice(0, 5).map(r => `
            <li>
                <span>${getToolName(r.tool)}</span>
                <span class="recent-time">${r.date} ${r.time}</span>
            </li>
        `).join('');
    }
}

loadData();
initCalculator();
renderTodoList();
renderAccounts();
updateStats();
