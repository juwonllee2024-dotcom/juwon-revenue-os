import type {Order} from '../domain/schema';

export function DeliverablePreview({order}: {order: Order}) {
  const shorts = order.deliverables.filter((item) => item.kind === 'short-brief');
  const hasWebsite = order.deliverables.some((item) => item.kind === 'website');
  const hasSocial = order.deliverables.some((item) => item.kind === 'social-copy');
  return (
    <div className="deliverables">
      <article><span>{hasWebsite ? 'READY' : 'WAIT'}</span><strong>랜딩 웹사이트</strong><p>예약 CTA와 서비스 소개</p></article>
      <article><span>{shorts.length === 4 ? 'READY' : 'WAIT'}</span><strong>쇼츠 기획 4개</strong><p>변화·전문성·오퍼·고객 이야기</p></article>
      <article><span>{hasSocial ? 'READY' : 'WAIT'}</span><strong>SNS 문구</strong><p>캡션과 해시태그</p></article>
    </div>
  );
}
