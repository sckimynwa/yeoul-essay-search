import { YCChunk, YCEssay, YCJSON } from "@/types";
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import { encode } from "gpt-3-encoder";

const BASE_URL = "https://yeoulcoding.tistory.com/";
const CHUNK_SIZE = 200;

const getEssay = async (id: number) => {
  try {
    const url = BASE_URL + id;
    const html = await axios.get(url);
    const $ = cheerio.load(html.data);

    const title = $("title").text();
    const contentArea = $(".area_view");

    const content = contentArea.text();
    const cleanedContent = content.replace(/\s+/g, " ").replace(/\.([a-zA-Z])/g, ". $1").trim();

    let essay: YCEssay = {
      title,
      url,
      date: "",  // Need to figure out how to extract date
      thanks: "",  // I'm not sure if this blog has thanks section, adjust accordingly
      content: cleanedContent,
      length: cleanedContent.length,
      tokens: encode(cleanedContent).length,
      chunks: []
    };

    return essay;
  } catch (err) {
    console.log(`Error fetching ${id}`);
  }
};

const chunkEssay = async (essay: YCEssay) => {
  const { title, url, date, thanks, content, ...chunklessSection } = essay;

  let essayTextChunks = [];

  if (encode(content).length > CHUNK_SIZE) {
    const split = content.split(". ");
    let chunkText = "";

    for (let i = 0; i < split.length; i++) {
      const sentence = split[i];
      const sentenceTokenLength = encode(sentence);
      const chunkTextTokenLength = encode(chunkText).length;

      if (chunkTextTokenLength + sentenceTokenLength.length > CHUNK_SIZE) {
        essayTextChunks.push(chunkText);
        chunkText = "";
      }

      if (sentence[sentence.length - 1]?.match(/[a-z0-9]/i)) {
        chunkText += sentence + ". ";
      } else {
        chunkText += sentence + " ";
      }
    }

    essayTextChunks.push(chunkText.trim());
  } else {
    essayTextChunks.push(content.trim());
  }

  const essayChunks = essayTextChunks.map((text) => {
    const trimmedText = text.trim();

    const chunk: YCChunk = {
      essay_title: title,
      essay_url: url,
      essay_date: date,
      essay_thanks: thanks,
      content: trimmedText,
      content_length: trimmedText.length,
      content_tokens: encode(trimmedText).length,
      embedding: []
    };

    return chunk;
  });

  if (essayChunks.length > 1) {
    for (let i = 0; i < essayChunks.length; i++) {
      const chunk = essayChunks[i];
      const prevChunk = essayChunks[i - 1];

      if (chunk.content_tokens < 100 && prevChunk) {
        prevChunk.content += " " + chunk.content;
        prevChunk.content_length += chunk.content_length;
        prevChunk.content_tokens += chunk.content_tokens;
        essayChunks.splice(i, 1);
        i--;
      }
    }
  }

  const chunkedSection: YCEssay = {
    ...essay,
    chunks: essayChunks
  };

  return chunkedSection;
};


(async () => {
  let essays = [];
  const totalPosts = 392;

  for (let i = 1; i <= totalPosts; i++) {
    const essay = await getEssay(i);
    if (essay) {
      const chunkedEssay = await chunkEssay(essay);
      essays.push(chunkedEssay);
    }
  }

  const json: YCJSON = {
    current_date: "2023-03-01",  // Adjust the date accordingly
    author: "YeoulCoding",
    url: BASE_URL,
    length: essays.reduce((acc, essay) => acc + essay.length, 0),
    tokens: essays.reduce((acc, essay) => acc + essay.tokens, 0),
    essays
  };

  fs.writeFileSync("scripts/yc.json", JSON.stringify(json));
})();