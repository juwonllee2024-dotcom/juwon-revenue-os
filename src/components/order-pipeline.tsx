'use client';

import type {Customer, Order} from '../domain/schema';
import {ApprovalPanel} from './approval-panel';
import {DeliverablePreview} from './deliverable-preview';

const stages = [
  ['intake', '주문'],
  ['planned', '기획'],
  ['producing', '제작'],
  ['review', '검수'],
  ['delivered', '납품'],
] as const;
const rank: Record<Order['status'], number> = {intake: 0, planned: 1, producing: 2, review: 3, approved: 3, delivered: 4};

type Props = {
  order: Order;
  customer?: Customer;
  busy: boolean;
  deliveryReady: boolean;
  onProduce: () => Promise<void>;
  onRequest: () => Promise<void>;
  onResolve: (operator: string, decision: 'approved' | 'rejected') => Promise<void>;
  onDeliver: () => Promise<void>;
};

export function OrderPipeline(props: Props) {
  const {order, customer, busy} = props;
  return (
    <section className="pipeline-card">
      <div className="order-title"><div><p>ACTIVE ORDER</p><h2>{customer?.businessName || '고객 주문'}</h2></div><span className="order-id">{order.id.slice(0, 14)}</span></div>
      <ol className="stages">
        {stages.map(([key, label], index) => <li className={rank[order.status] >= index ? 'done' : ''} key={key}><i>{index + 1}</i><span>{label}</span></li>)}
      </ol>
      <DeliverablePreview order={order} />
      <div className="next-action">
        <p>NEXT ACTION</p>
        {['intake', 'planned', 'producing'].includes(order.status) && <button className="primary" disabled={busy} onClick={props.onProduce}>자동 제작 시작</button>}
        {order.status === 'review' && <ApprovalPanel order={order} busy={busy} onRequest={props.onRequest} onResolve={props.onResolve} />}
        {order.status === 'approved' && <><p className="success">승인 완료</p><button className="primary" disabled={busy} onClick={props.onDeliver}>납품 패키지 만들기</button></>}
        {order.status === 'delivered' && <div className="delivery-links"><strong>납품 완료</strong><a href={`/api/artifacts/${order.id}/delivery/case-study.html`} target="_blank">포트폴리오 사례 보기</a><a href={`/api/artifacts/${order.id}/delivery/${order.id}-delivery.zip`}>납품 ZIP 다운로드</a></div>}
      </div>
    </section>
  );
}
