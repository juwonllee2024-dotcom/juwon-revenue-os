import {NextResponse} from 'next/server';
import {companyOsClient} from '../../../../adapters/company-os';

export const GET = async () => {
  const [health, truth] = await Promise.all([
    companyOsClient.getHealth(),
    companyOsClient.getTruth(),
  ]);
  return NextResponse.json({companyOs: health, truth});
};
