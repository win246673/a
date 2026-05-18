let display = document.getElementById('display');
let currentInput = '0';
let previousInput = '';
let operator = null;

function updateDisplay() {
    display.textContent = currentInput;
}

function appendNumber(num) {
    if (currentInput === '0') {
        currentInput = num;
    } else {
        currentInput += num;
    }
    updateDisplay();
}

function appendDecimal() {
    if (!currentInput.includes('.')) {
        currentInput += '.';
        updateDisplay();
    }
}

function appendOperator(op) {
    if (operator !== null && previousInput !== '') {
        calculate();
    }
    previousInput = currentInput;
    operator = op;
    currentInput = '0';
}

function clearDisplay() {
    currentInput = '0';
    previousInput = '';
    operator = null;
    updateDisplay();
}

function deleteChar() {
    if (currentInput.length > 1) {
        currentInput = currentInput.slice(0, -1);
    } else {
        currentInput = '0';
    }
    updateDisplay();
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
    
    if (typeof result === 'number' && !Number.isInteger(result)) {
        result = result.toFixed(10).replace(/\.?0+$/, '');
    }
    
    currentInput = result.toString();
    previousInput = '';
    operator = null;
    updateDisplay();
}