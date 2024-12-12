'use cache';

import camelcaseKeys from 'camelcase-keys';

import { createClient } from './server';

export type Article = {
  id: string;
  createdAt: string;
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  tags?: string[];
};

const camelize = (articles: any[]) =>
  articles.map((article) => camelcaseKeys(article));

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

type PageParams = {
  page?: number;
  size?: number;
  search?: string;
  tags?: string[];
};

const getArticles = async (params: PageParams = {}) => {
  const { page = 1, size = 12, search, tags } = params;
  const supabase = await createClient();

  const start = (page - 1) * size;
  const end = start + size - 1;

  let query = supabase
    .from('articles_metadata')
    .select('*', { count: 'exact' });

  if (search) {
    const searchTerm = search.replace(/[%_]/g, '\\$&');
    query = query.or(
      `title.ilike.*${searchTerm}*,description.ilike.*${searchTerm}*`,
    );
  }

  if (tags && tags.length > 0) {
    query = query.contains('tags', tags);
  }

  const {
    data: articles = [],
    count,
    error,
  } = await query.range(start, end).order('created_at', { ascending: false });

  console.log(articles);
  if (error) {
    console.error('Supabase query error:', error);
  }

  const formattedArticles = camelize(articles ?? []).map((article) => ({
    ...article,
    createdAt: formatDate(article.createdAt),
  }));

  return {
    articles: camelize(formattedArticles),
    totalCount: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / size),
    currentPage: page,
  };
};

export default getArticles;
