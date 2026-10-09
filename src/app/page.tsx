'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import type {Order, RevenueState} from '../domain/schema';
import {IntakeForm} from '../components/intake-form';
import {OrderPipeline} from '../components/order-pipeline';
import {RevenueMetrics} from '../components/revenue-metrics';

const emptyState: RevenueState = {version: 1, customers: [], orders: []};

export default function Home() {
  const [state, setState] = useState<RevenueState>(emptyState);
  const [selectedId, setSelectedId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    const response = await fetch('/api/orders', {cache: 'no-store'});
    const next = await response.json();
    setState(next);
    setSelectedId((current) => current || next.orders.at(-1)?.id || '');
  }, []);
  useEffect(() => {void refresh();}, [refresh]);

  const order = useMemo(() => state.orders.find((item) => item.id === selectedId) || state.orders.at(-1), [state, selectedId]);
  const customer = order ? state.customers.find((item) => item.id === order.customerId) : undefined;

  const act = async (action: () => Promise<Response>) => {
    setBusy(true); setError('');
    try {
      const response = await action();
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await refresh();
    } catch (caught) { setError((caught as Error).message); }
    finally { setBusy(false); }
  };

  const resolveApproval = async (operator: string, decision: 'approved' | 'rejected') => {
    if (!order?.approval) return;
    await act(() => fetch(`/api/orders/${order.id}/approval`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({operator, decision, note: decision === 'approved' ? '최종 검수 완료' : '수정 필요', manifestHash: order.approval?.manifestHash})}));
  };

  return (
    <main className="shell">
      <header className="topbar"><div className="logo-mark">J</div><div><strong>JUWON REVENUE OS</strong><span>Beauty & Wellness Growth Studio</span></div><div className="live"><i /> LOCAL · SAFE</div></header>
      <section className="hero-copy"><p>ORDER → CREATE → PROVE</p><h1>매장의 성장을<br/><em>결과물로 증명합니다.</em></h1><span>웹사이트, 쇼츠 4개, 검수, 납품, 포트폴리오까지 하나의 운영 흐름.</span></section>
      <RevenueMetrics state={state} />
      <div className="workspace">
        <IntakeForm onCreated={(created: Order) => {setSelectedId(created.id); void refresh();}} />
        {order ? <OrderPipeline order={order} customer={customer} busy={busy} deliveryReady={order.status === 'delivered'} onProduce={() => act(() => fetch(`/api/orders/${order.id}/produce`, {method: 'POST'}))} onRequest={() => act(() => fetch(`/api/orders/${order.id}/approval`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({action: 'request'})}))} onResolve={resolveApproval} onDeliver={() => act(() => fetch(`/api/orders/${order.id}/delivery`, {method: 'POST'}))} /> : <section className="empty"><span>01</span><h2>첫 고객 주문을 등록하세요.</h2><p>입력한 정보는 이 컴퓨터 안에서만 처리됩니다.</p></section>}
      </div>
      {error && <div className="toast error">{error}</div>}
    </main>
  );
}
