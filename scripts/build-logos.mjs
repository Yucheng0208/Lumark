// 從 simple-icons（CC0）產生手機與 AI 品牌 Logo 到 public/logo/
// 用法：node scripts/build-logos.mjs
import * as si from 'simple-icons';
import { writeFileSync } from 'node:fs';

const OUT = new URL('../public/logo/', import.meta.url);

// [檔名, simple-icons 名稱, 顏色（不填用品牌色）]
const ICONS = [
  ['Apple', 'siApple'],
  ['Samsung', 'siSamsung'],
  ['Google', 'siGoogle'],
  ['Huawei', 'siHuawei'],
  ['Honor', 'siHonor'],
  ['Xiaomi', 'siXiaomi'],
  ['vivo', 'siVivo'],
  ['OPPO', 'siOppo'],
  ['OnePlus', 'siOneplus'],
  ['ASUS', 'siAsus'],
  ['Motorola', 'siMotorola'],
  ['Nokia', 'siNokia'],
  ['LG', 'siLg'],
  ['HTC', 'siHtc'],
  ['Sharp', 'siSharp'],
  ['DJI', 'siDji'],
  ['Insta360', 'siInsta360', '1A1A1A'],
  ['Kodak', 'siKodak'],
  // 影音平台
  ['YouTube', 'siYoutube'],
  ['YouTubeMusic', 'siYoutubemusic'],
  ['Spotify', 'siSpotify'],
  ['AppleMusic', 'siApplemusic'],
  ['ApplePodcasts', 'siApplepodcasts'],
  ['TikTok', 'siTiktok'],
  ['Instagram', 'siInstagram'],
  ['Facebook', 'siFacebook'],
  ['Threads', 'siThreads'],
  ['X', 'siX'],
  ['Netflix', 'siNetflix'],
  ['Twitch', 'siTwitch'],
  ['Vimeo', 'siVimeo'],
  ['Bilibili', 'siBilibili'],
  ['SoundCloud', 'siSoundcloud'],
  ['LINE', 'siLine'],
  ['Xiaohongshu', 'siXiaohongshu'],
  ['Deezer', 'siDeezer'],
  ['TIDAL', 'siTidal'],
  // AI
  ['Gemini', 'siGooglegemini'],
  ['Claude', 'siClaude'],
  ['Anthropic', 'siAnthropic'],
  ['DeepSeek', 'siDeepseek'],
  ['Meta', 'siMeta'],
  ['MistralAI', 'siMistralai'],
  ['Perplexity', 'siPerplexity'],
  ['Qwen', 'siQwen'],
];

for (const [file, name, color] of ICONS) {
  const icon = si[name];
  const fill = `#${color || icon.hex}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="480" height="480"><path fill="${fill}" d="${icon.path}"/></svg>\n`;
  writeFileSync(new URL(`${file}.svg`, OUT), svg);
}

// Microsoft 四色方塊（simple-icons 未收錄）
writeFileSync(new URL('Microsoft.svg', OUT), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" width="460" height="460">
<rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="12" y="1" width="10" height="10" fill="#7FBA00"/>
<rect x="1" y="12" width="10" height="10" fill="#00A4EF"/><rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
</svg>\n`);

console.log(`wrote ${ICONS.length + 1} logos`);
