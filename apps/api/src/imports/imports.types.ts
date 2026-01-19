export type ImportFormat = 'markdown' | 'pdf';

export type ImportRequest = {
  format?: ImportFormat;
  title?: string;
  parentIds?: string | string[];
};
