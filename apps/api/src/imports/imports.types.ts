export type ImportFormat = 'markdown' | 'pdf' | 'docx';

export type ImportRequest = {
  format?: ImportFormat;
  title?: string;
  parentIds?: string | string[];
};
