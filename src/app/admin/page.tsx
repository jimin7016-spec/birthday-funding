'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    eventName: '',
    giftName: '',
    targetAmount: 0,
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    imagePath: '/assets/gift.jpg'
  });
  const [loading, setLoading] = useState(true);

  const [fundingHistory, setFundingHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setFormData({
          eventName: data.eventName || '',
          giftName: data.giftName || '',
          targetAmount: data.targetAmount || 0,
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          accountHolder: data.accountHolder || '',
          imagePath: data.imagePath || '/assets/gift.jpg'
        });
        setFundingHistory(data.fundingHistory || []);
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'targetAmount' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const confirmed = window.confirm('설정을 저장하면 새로운 이벤트를 위해 기존 펀딩 내역과 모금액이 모두 [초기화]됩니다.\n계속하시겠습니까?');
    if (!confirmed) return;

    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        currentAmount: 0,
        fundingHistory: []
      })
    });
    alert('설정이 저장되었습니다!');
    router.push('/');
  };

  if (loading) return <div className="container">로딩 중...</div>;

  return (
    <div className="container" style={{ textAlign: 'left', padding: '2rem' }}>
      <h1>⚙️ 펀딩 관리자 설정</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
        <div className="input-group">
          <label>이벤트 이름 (예: 지민이의 생일 펀딩)</label>
          <input name="eventName" value={formData.eventName} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label>갖고 싶은 선물 이름</label>
          <input name="giftName" value={formData.giftName} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label>목표 금액 (원)</label>
          <input type="number" name="targetAmount" value={formData.targetAmount} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label>입금 은행명</label>
          <input name="bankName" value={formData.bankName} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label>입금 계좌번호</label>
          <input name="accountNumber" value={formData.accountNumber} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label>예금주</label>
          <input name="accountHolder" value={formData.accountHolder} onChange={handleChange} required />
        </div>



        <button type="submit" className="btn primary-btn" style={{ marginTop: '1rem' }}>
          저장하기
        </button>
      </form>

      <hr style={{ margin: '3rem 0', border: 'none', borderTop: '2px dashed rgba(255, 107, 149, 0.3)' }} />

      <section className="admin-section">
        <h2 style={{ color: '#ff6b95' }}>💰 전체 펀딩 내역 (관리자용)</h2>
        <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '1rem', textAlign: 'center' }}>
          비공개 내역도 모두 확인 가능합니다.
        </p>
        <ul className="history-list" style={{ marginTop: '1rem' }}>
          {fundingHistory.length === 0 ? (
            <li style={{ textAlign: 'center', color: '#999', padding: '20px' }}>아직 펀딩 내역이 없습니다.</li>
          ) : (
            [...fundingHistory].reverse().map((item: any, index: number) => (
              <li key={index} className="history-item" style={{ background: 'rgba(255, 255, 255, 0.9)' }}>
                <div className="history-nickname">🎉 {item.nickname} {item.hidden && <span style={{ fontSize: '0.8rem', color: '#ff6b95' }}>(비공개)</span>}</div>
                <div className="history-amount" style={{ color: '#111' }}>
                  {item.amount.toLocaleString()}원
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
