import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getDynamicPageData } from '@/lib/db-data';
import DynamicPageClient from '@/components/DynamicPageClient';

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

async function DynamicContent({
  slugPromise,
}: {
  slugPromise: Promise<{ slug: string[] }>;
}) {
  const { slug } = await slugPromise;
  const slugKey = slug.join('/');
  const pageData = await getDynamicPageData(slugKey);

  if (!pageData) {
    notFound();
  }

  return <DynamicPageClient page={pageData} />;
}

export default function DynamicDashboardPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 font-medium">
          <i className="bi bi-arrow-repeat animate-spin text-xl mr-2 inline-block" />
          Memuat data...
        </div>
      }
    >
      <DynamicContent slugPromise={params} />
    </Suspense>
  );
}
