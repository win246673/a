let display = document.getElementById('display');
let expressionDisplay = document.getElementById('expression');
let historyList = document.getElementById('history-list');
let currentInput = '0';
let previousInput = '';
let operator = null;
let history = [];

function updateDisplay() {
    display.textContent = currentInput;
}

function updateExpression() {
    if (previousInput && operator) {
        expressionDisplay.textContent = `${previousInput} ${getDisplayOperator(operator)} ${currentInput}`;
    } else {
        expressionDisplay.textContent = '0';
    }
}

function getDisplayOperator(op) {
    const operators = {
        '+': '+',
        '-': '−',
        '*': '×',
        '/': '÷'
    };
    return operators[op] || op;
}

function appendNumber(num) {
    if (currentInput === '0') {
        currentInput = num;
    } else {
        currentInput += num;
    }
    updateDisplay();
    updateExpression();
}

function appendDecimal() {
    if (!currentInput.includes('.')) {
        currentInput += '.';
        updateDisplay();
        updateExpression();
    }
}

function appendOperator(op) {
    if (operator !== null && previousInput !== '') {
        calculate();
    }
    previousInput = currentInput;
    operator = op;
    currentInput = '0';
    updateExpression();
}

function clearDisplay() {
    currentInput = '0';
    previousInput = '';
    operator = null;
    updateDisplay();
    updateExpression();
}

function deleteChar() {
    if (currentInput.length > 1) {
        currentInput = currentInput.slice(0, -1);
    } else {
        currentInput = '0';
    }
    updateDisplay();
    updateExpression();
}

function calculate() {
    if (operator === null || previousInput === '') {
        return;
    }
    
    let result;
    const prev = parseFloat(previousInput);
    const current = parseFloat(currentInput);
    
    if (isNaN(prev) || isNaN(current)) {
        return;
    }
    
    switch (operator) {
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
    
    const expression = `${previousInput} ${getDisplayOperator(operator)} ${currentInput} = ${result}`;
    
    if (typeof result === 'number') {
        if (!Number.isInteger(result)) {
            result = result.toFixed(10).replace(/\.?0+$/, '');
        }
    }
    
    history.unshift({
        expression: `${previousInput} ${getDisplayOperator(operator)} ${currentInput}`,
        result: result.toString()
    });
    
    if (history.length > 10) {
        history.pop();
    }
    
    renderHistory();
    
    currentInput = result.toString();
    previousInput = '';
    operator = null;
    updateDisplay();
    updateExpression();
}

function renderHistory() {
    if (history.length === 0) {
        historyList.innerHTML = '<div class="history-empty">暂无计算记录</div>';
        return;
    }
    
    historyList.innerHTML = history.map((item, index) => `
        <div class="history-item" onclick="loadHistory(${index})">
            <div class="history-expression">${item.expression}</div>
            <div class="history-result">= ${item.result}</div>
        </div>
    `).join('');
}

function loadHistory(index) {
    const item = history[index];
    currentInput = item.result;
    previousInput = '';
    operator = null;
    updateDisplay();
    updateExpression();
}

function clearHistory() {
    history = [];
    renderHistory();
}

renderHistory();
