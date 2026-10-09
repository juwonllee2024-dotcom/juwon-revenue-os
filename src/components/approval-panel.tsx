'use client';

import {useState} from 'react';
import type {Order} from '../domain/schema';

type Props = {
  order: Order;
  busy: boolean;
  onRequest: () => Promise<void>;
  onResolve: (operator: string, decision: 'approved' | 'rejected') => Promise<void>;
};

export function ApprovalPanel({order, busy, onRequest, onResolve}: Props) {
  const [operator, setOperator] = useState('');
  if (!order.approval) return <button className="primary" onClick={onRequest} disabled={busy}>승인 요청</button>;
  if (order.approval.state === 'approved') return <p className="success">승인 완료</p>;
  if (order.approval.state === 'rejected') return <p className="error">수정 요청됨</p>;
  return (
    <div className="approval-box">
      <label>승인자<input value={operator} onChange={(event) => setOperator(event.target.value)} /></label>
      <div className="button-row">
        <button className="primary" disabled={busy || operator.trim().length < 2} onClick={() => onResolve(operator, 'approved')}>최종 승인</button>
        <button className="ghost" disabled={busy || operator.trim().length < 2} onClick={() => onResolve(operator, 'rejected')}>수정 요청</button>
      </div>
    </div>
  );
}
