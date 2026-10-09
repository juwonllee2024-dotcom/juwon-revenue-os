import {expect, test} from '@playwright/test';

test('operator completes the first customer delivery journey', async ({page}) => {
  await page.goto('/');
  await page.getByLabel('매장명').fill('Glow Studio');
  await page.getByLabel('업종').fill('피부관리');
  await page.getByLabel('대표 서비스').fill('시그니처 페이셜');
  await page.getByLabel('연락처').fill('hello@example.com');
  await page.getByLabel('예약 링크').fill('https://example.com/book');
  await page.getByLabel('포트폴리오 공개 동의').check();
  await page.getByRole('button', {name: '주문 만들기'}).click();

  await expect(page.getByText('Glow Studio', {exact: true})).toBeVisible();
  await page.getByRole('button', {name: '자동 제작 시작'}).click();
  await expect(page.getByText('검수', {exact: true})).toBeVisible();
  await expect(page.getByText('쇼츠 기획 4개')).toBeVisible();

  await page.getByRole('button', {name: '승인 요청'}).click();
  await page.getByLabel('승인자').fill('Juwon');
  await page.getByRole('button', {name: '최종 승인'}).click();
  await expect(page.getByText('승인 완료')).toBeVisible();

  await page.getByRole('button', {name: '납품 패키지 만들기'}).click();
  await expect(page.getByText('납품 완료')).toBeVisible();
  await expect(page.getByRole('link', {name: '포트폴리오 사례 보기'})).toBeVisible();
  await expect(page.getByRole('link', {name: '납품 ZIP 다운로드'})).toBeVisible();
});
