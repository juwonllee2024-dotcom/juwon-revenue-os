import type {Customer} from '../domain/schema';

export const shortAngles = ['transformation', 'expertise', 'offer', 'customer-story'] as const;
export type ShortAngle = (typeof shortAngles)[number];

const angleCopy: Record<ShortAngle, {hook: string; voiceover: string; cta: string}> = {
  transformation: {
    hook: '30분 전과 후, 분위기가 달라지는 순간',
    voiceover: '과한 변화보다 나에게 어울리는 빛을 찾습니다. 섬세한 상담부터 맞춤 케어까지.',
    cta: '나만의 변화 예약하기',
  },
  expertise: {
    hook: '전문가는 이 한 가지부터 확인합니다',
    voiceover: '모두에게 같은 관리는 없습니다. 현재 상태와 목표를 먼저 확인하고 가장 필요한 과정만 설계합니다.',
    cta: '전문 상담 받아보기',
  },
  offer: {
    hook: '이번 달, 처음 방문하는 분을 위한 제안',
    voiceover: '첫 방문 상담과 시그니처 케어를 한 번에 경험하세요. 편안함과 결과를 함께 준비했습니다.',
    cta: '한정 일정 확인하기',
  },
  'customer-story': {
    hook: '거울 보는 시간이 좋아졌다는 한마디',
    voiceover: '고객이 원하는 건 정해진 유행이 아니라 자기다운 자신감입니다. 그 변화의 과정을 함께합니다.',
    cta: '내 이야기 시작하기',
  },
};

export const createShortBrief = (customer: Customer, angle: ShortAngle, index: number) => ({
  id: `short-${index + 1}`,
  angle,
  hook: angleCopy[angle].hook,
  durationSeconds: 24,
  aspectRatio: '9:16' as const,
  scenes: [
    {from: 0, to: 3, visual: '결과 중심 클로즈업과 강한 첫 문장'},
    {from: 3, to: 10, visual: `${customer.services[0]} 과정 디테일`},
    {from: 10, to: 19, visual: '전문가 손길, 공간, 고객 경험의 빠른 몽타주'},
    {from: 19, to: 24, visual: `${customer.businessName} 로고와 예약 CTA`},
  ],
  voiceover: angleCopy[angle].voiceover,
  captions: [angleCopy[angle].hook, angleCopy[angle].voiceover, angleCopy[angle].cta],
  cta: angleCopy[angle].cta,
  assetRefs: customer.sourceMedia,
});
