'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface ConfigData {
  eventName: string;
  giftName: string;
  targetAmount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  imagePath: string;
  currentAmount: number;
  fundingHistory: any[];
}

export default function Home() {
  const router = useRouter();
  const [config, setConfig] = useState<ConfigData | null>(null);

  // States for funding flow
  const [nickname, setNickname] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [hideAmount, setHideAmount] = useState(false);
  const [step, setStep] = useState<'intro' | 'action' | 'deposit' | 'success' | 'finished'>('intro');
  const [myNickname, setMyNickname] = useState<string | null>(null);
  const [noCount, setNoCount] = useState(0);
  const [noPosition, setNoPosition] = useState({ x: 0, y: 0 });
  const [showWarning, setShowWarning] = useState(false);
  const [myFundIds, setMyFundIds] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        if (data.currentAmount >= data.targetAmount) {
          setStep('finished');
        }
      });

    // Check URL params for nickname
    const params = new URLSearchParams(window.location.search);
    const presetNickname = params.get('nick');
    if (presetNickname) setNickname(presetNickname);

    // Retrieve myNickname from localStorage
    const storedNickname = localStorage.getItem('birthday_myNickname');
    if (storedNickname) {
      setMyNickname(storedNickname);
      if (!presetNickname) setNickname(storedNickname);
    }

    // Retrieve myFundIds from localStorage
    const storedFundIds = localStorage.getItem('birthday_myFundIds');
    if (storedFundIds) {
      try {
        setMyFundIds(JSON.parse(storedFundIds));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  if (!config) return <div className="container">로딩 중...</div>;

  const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const progressPercentage = Math.min((config.currentAmount / config.targetAmount) * 100, 100);
  const remaining = Math.max(config.targetAmount - config.currentAmount, 0);

  const handleNoHover = () => {
    const randomX = Math.floor(Math.random() * 300) - 150;
    const randomY = Math.floor(Math.random() * 300) - 150;
    setNoPosition({ x: randomX, y: randomY });
    setNoCount(prev => prev + 1);
  };

  const handleNoClick = () => {
    handleNoHover();
  };

  const handleYesClick = () => {
    setStep('action');
  };

  const handleFundClick = () => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('올바른 펀딩 금액을 입력해주세요!');
      return;
    }
    if (numAmount > 30000) {
      setShowWarning(true);
      return;
    }
    setStep('deposit');
  };

  const handleDepositComplete = async () => {
    const finalNickname = nickname.trim() ? nickname.trim() : '익명의 천사';
    const numAmount = Number(amount);
    const newId = 'fund_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const newHistoryItem = {
      id: newId,
      nickname: finalNickname,
      amount: numAmount,
      hidden: hideAmount
    };

    const newData = {
      ...config,
      currentAmount: config.currentAmount + numAmount,
      fundingHistory: [...config.fundingHistory, newHistoryItem]
    };

    // Update state optimistically
    setConfig(newData);

    // Update local storage and state for myFundIds
    const updatedFundIds = [...myFundIds, newId];
    setMyFundIds(updatedFundIds);
    localStorage.setItem('birthday_myFundIds', JSON.stringify(updatedFundIds));

    if (newData.currentAmount >= newData.targetAmount) {
      setStep('finished');
    } else {
      setStep('success');
    }

    // Save to server
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData)
    });

    // Remember my nickname
    localStorage.setItem('birthday_myNickname', finalNickname);
    setMyNickname(finalNickname);
  };

  const handleDeleteFunding = async (idToDelete: string) => {
    if (!config) return;

    // Find the item to delete
    const targetItem = config.fundingHistory.find(item => item.id === idToDelete);
    if (!targetItem) {
      alert('삭제할 내역을 찾을 수 없습니다.');
      return;
    }

    const confirmDelete = window.confirm(`정말 펀딩 내역(${formatNumber(targetItem.amount)}원)을 삭제하시겠습니까? 🥺`);
    if (!confirmDelete) return;

    const newFundingHistory = config.fundingHistory.filter(item => item.id !== idToDelete);
    const newCurrentAmount = Math.max(config.currentAmount - targetItem.amount, 0);

    const newData = {
      ...config,
      currentAmount: newCurrentAmount,
      fundingHistory: newFundingHistory
    };

    // Optimistic update
    setConfig(newData);

    // Update local storage and state for myFundIds
    const updatedFundIds = myFundIds.filter(id => id !== idToDelete);
    setMyFundIds(updatedFundIds);
    localStorage.setItem('birthday_myFundIds', JSON.stringify(updatedFundIds));

    // Check if the goal status should change back
    if (newData.currentAmount < newData.targetAmount && step === 'finished') {
      setStep('action');
    }

    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });
      alert('펀딩이 취소되었습니다. 마음은 감사히 받았습니다! 🌸');
    } catch (e) {
      console.error(e);
      alert('서버에 반영하지 못했습니다. 다시 시도해주세요.');
    }
  };

  const resetFlow = () => {
    setAmount('');
    setHideAmount(false);
    setStep('action');
  };

  const reversedHistory = [...config.fundingHistory].reverse();

  return (
    <div className="container">
      {/* Intro Section */}
      {step === 'intro' && (
        <section className="intro-section" style={{ textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <h2>당신은 {config.eventName || '생일 펀딩'}에 초대되었습니다.</h2>
          <h3 style={{ marginBottom: '2rem' }}>참여하시겠습니까?</h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', minHeight: '100px' }}>
            <button
              className="btn primary-btn"
              onClick={handleYesClick}
              style={{
                width: '120px',
                transform: `scale(${1 + noCount * 0.5})`,
                transition: 'transform 0.2s ease',
                zIndex: 10
              }}
            >
              YES 😍
            </button>
            <button
              className="btn secondary-btn"
              onClick={handleNoClick}
              onMouseEnter={handleNoHover}
              style={{
                width: '120px',
                position: noCount > 0 ? 'absolute' : 'relative',
                transform: noCount > 0 ? `translate(${noPosition.x}px, ${noPosition.y}px)` : 'none',
                transition: 'transform 0.1s ease',
                display: noCount > 5 ? 'none' : 'block', // hide no after 6 clicks
                zIndex: 5
              }}
            >
              NO 🙅‍♀️
            </button>
          </div>
        </section>
      )}

      {step !== 'intro' && (
        <>
          {/* Hero Section */}
          <header className="hero">
            <h1>{config.eventName}</h1>
            <h2 className="gift-title">갖고 싶은 선물은... 바로..</h2>
            <div className="gift-image-container">
              <img src="/assets/gift.jpg" alt="생일 선물" className="gift-image" />
            </div>
            <h2>{config.giftName}</h2>
            <div className="funding-status">
              <div className="progress-info">
                <span className="current-amount" id="currentAmountText">{formatNumber(config.currentAmount)}원</span>
                <span className="target-amount">/ {formatNumber(config.targetAmount)}원</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" id="progressBar" style={{ width: `${progressPercentage}%` }}></div>
              </div>
              <p className="remaining-amount">
                목표까지 <span id="remainingAmountText">{formatNumber(remaining)}</span>원 ({Math.max(100 - progressPercentage, 0).toFixed(1).replace('.0', '')}%) 남았어요!
              </p>
            </div>
          </header>

          {/* Finished State */}
          {step === 'finished' && (
            <section className="success-animation" id="finishedSection">
              <h2 className="success-title">감사합니다 펀딩 완료! 💕</h2>
              <img src="/assets/thanks.jpg" alt="Thanks" className="dancing-cat" />
              <p style={{ fontWeight: 800, color: '#ff6b95', margin: '15px 0', fontSize: '1.2rem' }}>
                여러분의 사랑으로 목표 금액이 모두 모였습니다!
              </p>
            </section>
          )}

          {/* Funding Action */}
          {step === 'action' && (
            <section className="funding-action" id="fundingActionSection">
              <h3>🎁 펀딩 참여하기</h3>
              <div className="input-group">
                <label htmlFor="funderNickname">닉네임</label>
                <input
                  type="text"
                  id="funderNickname"
                  placeholder="닉네임을 입력해주세요 (선택)"
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label htmlFor="fundingAmount">펀딩 금액 (원)</label>
                <input
                  type="number"
                  id="fundingAmount"
                  placeholder="금액을 입력해주세요"
                  min="1000"
                  step="1000"
                  value={amount}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '') {
                      setAmount('');
                      return;
                    }
                    const numVal = Number(val);
                    if (numVal > 30000) {
                      setShowWarning(true);
                      return;
                    }
                    setAmount(numVal);
                  }}
                />
              </div>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="hideAmount"
                  checked={hideAmount}
                  onChange={e => setHideAmount(e.target.checked)}
                />
                <label htmlFor="hideAmount">금액 비공개로 하기 🤫(생일 당사자는 확인 가능합니다)</label>
              </div>
              <button className="btn primary-btn" id="fundBtn" onClick={handleFundClick}>펀딩하기</button>
            </section>
          )}

          {/* Deposit Info */}
          {step === 'deposit' && (
            <section className="deposit-info" id="depositInfoSection">
              <h3>입금 안내</h3>
              <p>아래 계좌로 <span id="depositAmountText" className="highlight">{formatNumber(Number(amount))}</span>원을 입금해주세요!</p>
              <div className="account-box">
                <p className="bank-name">{config.bankName}</p>
                <p className="account-number">{config.accountNumber}</p>
                <p className="account-holder">{config.accountHolder}</p>
              </div>
              <button className="btn secondary-btn" id="depositCompleteBtn" onClick={handleDepositComplete}>입금 완료했어요!</button>
            </section>
          )}

          {/* Success Animation */}
          {step === 'success' && (
            <section className="success-animation" id="successSection">
              <h2 className="success-title">감사합니다! 💕</h2>
              <img src="/assets/dancing.jpg" alt="Dancing Cat" className="dancing-cat" />
              <p>펀딩 내역이 추가되었습니다!</p>
              <button className="btn primary-btn" id="returnBtn" onClick={resetFlow}>돌아가기</button>
            </section>
          )}

          {/* Funding History */}
          <section className="funding-history">
            <h3>펀딩 내역</h3>
            <ul id="historyList" className="history-list">
              {reversedHistory.length === 0 ? (
                <li style={{ textAlign: 'center', color: '#999', padding: '20px' }}>아직 펀딩 내역이 없어요. 첫 번째 주인공이 되어주세요!</li>
              ) : (
                reversedHistory.map((item, index) => {
                  const isMine = item.id && myFundIds.includes(item.id);
                  const showAmount = !item.hidden || isMine || (myNickname && item.nickname === myNickname);

                  return (
                    <li key={index} className="history-item">
                      <div className="history-nickname">🎉 {item.nickname} {isMine && <span style={{ fontSize: '0.8rem', color: '#ff4d4f' }}>(내 후원)</span>}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="history-amount">{showAmount ? `${formatNumber(item.amount)}원` : '비밀 금액 🤫'}</div>
                        {isMine && (
                          <button
                            onClick={() => handleDeleteFunding(item.id)}
                            className="delete-history-btn"
                            title="펀딩 내역 삭제"
                          >
                            ❌
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        </>
      )}

      {/* Cute Warning Modal */}
      {showWarning && (
        <div className="warning-overlay" onClick={() => setShowWarning(false)}>
          <div className="warning-card" onClick={e => e.stopPropagation()}>
            <div className="warning-image-wrapper">
              <img src="/assets/warning_cute.png" alt="경고" className="warning-cat-img" />
            </div>
            <h3 className="warning-card-title">앗! 3만원 초과는 멈춰! 🚫</h3>
            <p className="warning-card-desc">
              3만원을 초과하는 금액은 입력하실 수 없습니다.<br />
              마음만 가득 받을게요! 🥰
            </p>
            <button className="btn primary-btn warning-close-btn" onClick={() => setShowWarning(false)}>
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
