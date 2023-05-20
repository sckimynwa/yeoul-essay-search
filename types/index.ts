export enum OpenAIModel {
  DAVINCI_TURBO = "gpt-3.5-turbo"
}

export type YCEssay = {
  title: string;
  url: string;
  date: string;
  thanks: string;
  content: string;
  length: number;
  tokens: number;
  chunks: YCChunk[];
};

export type YCChunk = {
  essay_title: string;
  essay_url: string;
  essay_date: string;
  essay_thanks: string;
  content: string;
  content_length: number;
  content_tokens: number;
  embedding: number[];
};

export type YCJSON = {
  current_date: string;
  author: string;
  url: string;
  length: number;
  tokens: number;
  essays: YCEssay[];
};
