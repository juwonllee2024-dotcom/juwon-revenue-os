'use client';

import {useState, type FormEvent} from 'react';
import type {Order} from '../domain/schema';

export function IntakeForm({onCreated}: {onCreated: (order: Order) => void}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({
          businessName: data.get('businessName'),
          niche: data.get('niche'),
          services: String(data.get('services') || '')
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
          contact: data.get('contact'),
          bookingUrl: data.get('bookingUrl') || undefined,
          tone: '고급스럽고 따뜻함',
          consent: data.get('consent') === 'on',
          demo: false,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      onCreated(result.order);
      event.currentTarget.reset();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="intake-card" onSubmit={submit}>
      <div className="section-heading"><span>01</span><div><p>NEW CLIENT</p><h2>새 매장 주문</h2></div></div>
      <div className="form-grid">
        <label>매장명<input name="businessName" required /></label>
        <label>업종<input name="niche" placeholder="피부관리, 네일, 필라테스" required /></label>
        <label className="wide">대표 서비스<input name="services" placeholder="쉼표로 여러 개 입력" required /></label>
        <label>연락처<input name="contact" required /></label>
        <label>예약 링크<input name="bookingUrl" type="url" placeholder="https://" /></label>
        <label className="consent wide"><input name="consent" type="checkbox" />포트폴리오 공개 동의</label>
      </div>
      {error && <p className="error">{error}</p>}
      <button className="primary" disabled={busy}>{busy ? '접수 중…' : '주문 만들기'}</button>
    </form>
  );
}
