import type {RevenueState} from '../domain/schema';

export function RevenueMetrics({state}: {state: RevenueState}) {
  const delivered = state.orders.filter((order) => order.status === 'delivered').length;
  const active = state.orders.length - delivered;
  return <div className="metrics"><article><span>고객</span><strong>{state.customers.length}</strong></article><article><span>진행 중</span><strong>{active}</strong></article><article><span>납품 완료</span><strong>{delivered}</strong></article><article><span>증명된 결과물</span><strong>{state.orders.reduce((sum, order) => sum + order.deliverables.length, 0)}</strong></article></div>;
}
