import type { ArticleDetail, ArticlePayload } from '@/api/types';

export function articleToPayload(d: ArticleDetail): ArticlePayload {
  return {
    topicId: d.topicId,
    tag: d.tag,
    isFeatured: d.isFeatured,
    heroImageUrl: d.heroImageUrl ?? null,
    reviewedBy: d.reviewedBy && d.reviewedBy.name ? d.reviewedBy : null,
    title: { en: d.title?.en ?? '', sw: d.title?.sw ?? '' },
    summary: { en: d.summary?.en ?? '', sw: d.summary?.sw ?? '' },
    bodyHtml: { en: d.bodyHtml?.en ?? '', sw: d.bodyHtml?.sw ?? '' },
  };
}
