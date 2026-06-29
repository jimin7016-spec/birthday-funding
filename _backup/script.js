const TARGET_AMOUNT = 500000;
let currentAmount = 0;
let fundingHistory = [];
let pendingFunding = null; // Store temp data before deposit complete

// DOM Elements
const currentAmountText = document.getElementById('currentAmountText');
const progressBar = document.getElementById('progressBar');
const remainingAmountText = document.getElementById('remainingAmountText');
const fundingActionSection = document.getElementById('fundingActionSection');
const depositInfoSection = document.getElementById('depositInfoSection');
const successSection = document.getElementById('successSection');
const fundBtn = document.getElementById('fundBtn');
const depositCompleteBtn = document.getElementById('depositCompleteBtn');
const returnBtn = document.getElementById('returnBtn');
const depositAmountText = document.getElementById('depositAmountText');
const historyList = document.getElementById('historyList');

// Inputs
const funderNicknameInput = document.getElementById('funderNickname');
const fundingAmountInput = document.getElementById('fundingAmount');
const hideAmountCheckbox = document.getElementById('hideAmount');

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Initialize
function init() {
    // Load from local storage
    const storedAmount = localStorage.getItem('birthday_currentAmount');
    const storedHistory = localStorage.getItem('birthday_fundingHistory');

    if (storedAmount) {
        currentAmount = parseInt(storedAmount, 10);
    }
    if (storedHistory) {
        fundingHistory = JSON.parse(storedHistory);
    }

    updateUI();
    renderHistory();
    
    // Check URL params for nickname
    const urlParams = new URLSearchParams(window.location.search);
    const presetNickname = urlParams.get('nick');
    if (presetNickname) {
        funderNicknameInput.value = presetNickname;
    }
}

// Update Hero UI (Progress bar, amounts)
function updateUI() {
    currentAmountText.textContent = `${formatNumber(currentAmount)}원`;
    
    let remaining = TARGET_AMOUNT - currentAmount;
    if (remaining < 0) remaining = 0;
    remainingAmountText.textContent = formatNumber(remaining);

    let progressPercentage = (currentAmount / TARGET_AMOUNT) * 100;
    if (progressPercentage > 100) progressPercentage = 100;
    
    // Add small delay for animation to show on load
    setTimeout(() => {
        progressBar.style.width = `${progressPercentage}%`;
    }, 100);
}

// Render History List
function renderHistory() {
    historyList.innerHTML = '';
    
    if (fundingHistory.length === 0) {
        historyList.innerHTML = '<li style="text-align:center; color:#999; padding: 20px;">아직 펀딩 내역이 없어요. 첫 번째 주인공이 되어주세요!</li>';
        return;
    }

    // Show latest first
    const reversedHistory = [...fundingHistory].reverse();

    reversedHistory.forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';
        
        const amountDisplay = item.hidden ? '비밀 금액 🤫' : `${formatNumber(item.amount)}원`;
        
        li.innerHTML = `
            <div class="history-nickname">🎉 ${item.nickname}</div>
            <div class="history-amount">${amountDisplay}</div>
        `;
        historyList.appendChild(li);
    });
}

// Fund Button Click
fundBtn.addEventListener('click', () => {
    let nickname = funderNicknameInput.value.trim();
    let amount = parseInt(fundingAmountInput.value, 10);
    let hidden = hideAmountCheckbox.checked;

    if (!nickname) {
        nickname = '익명의 천사';
    }

    if (isNaN(amount) || amount <= 0) {
        alert('올바른 펀딩 금액을 입력해주세요!');
        return;
    }

    // Save pending info
    pendingFunding = { nickname, amount, hidden };

    // Update Deposit Info UI
    depositAmountText.textContent = formatNumber(amount);
    
    // Show Deposit Info, Hide Action
    fundingActionSection.classList.add('hidden');
    depositInfoSection.classList.remove('hidden');
});

// Deposit Complete Button Click
depositCompleteBtn.addEventListener('click', () => {
    if (pendingFunding) {
        // Add to history
        fundingHistory.push(pendingFunding);
        currentAmount += pendingFunding.amount;

        // Save to Local Storage
        localStorage.setItem('birthday_currentAmount', currentAmount.toString());
        localStorage.setItem('birthday_fundingHistory', JSON.stringify(fundingHistory));

        // Update UI
        updateUI();
        renderHistory();

        // Show Success Animation
        depositInfoSection.classList.add('hidden');
        successSection.classList.remove('hidden');

        // Reset inputs
        fundingAmountInput.value = '';
        hideAmountCheckbox.checked = false;
        pendingFunding = null;
    }
});

// Return Button Click
returnBtn.addEventListener('click', () => {
    successSection.classList.add('hidden');
    fundingActionSection.classList.remove('hidden');
});

// Start
init();
