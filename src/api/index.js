// import axios from "axios";
import fetchJsonp from "fetch-jsonp";

/**
 * 音乐播放器
 */

// 获取音乐播放列表
export const getPlayerList = async (server, type, id) => {
  const url = new URL(import.meta.env.VITE_SONG_API);
  url.searchParams.set("server", server);
  url.searchParams.set("type", type);
  url.searchParams.set("id", id);
  if (server === "tencent") url.searchParams.set("playable", "1");
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`音乐接口返回 ${res.status}`);
  }
  const data = await res.json();
  if (!Array.isArray(data) || !data.length || typeof data[0].url !== "string") {
    throw new Error("音乐接口没有返回可用歌单");
  }

  if (data[0].url.startsWith("@")) {
    // eslint-disable-next-line no-unused-vars
    const [handle, jsonpCallback, jsonpCallbackFunction, url] = data[0].url.split("@").slice(1);
    const jsonpData = await fetchJsonp(url).then((res) => res.json());
    const domain = (
      jsonpData.req_0.data.sip.find((i) => !i.startsWith("http://ws")) ||
      jsonpData.req_0.data.sip[0]
    ).replace("http://", "https://");

    const playableSongs = data
      .map((v, i) => {
        const purl = jsonpData.req_0.data.midurlinfo[i]?.purl;
        return purl
          ? {
              name: v.name || v.title,
              artist: v.artist || v.author,
              url: domain + purl,
              cover: v.cover || v.pic,
              lrc: v.lrc,
            }
          : null;
      })
      .filter(Boolean);
    if (!playableSongs.length) throw new Error("音乐接口没有返回可播放歌曲");
    return playableSongs;
  } else {
    return data.map((v) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: v.url,
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  }
};

/**
 * 一言
 */

// 获取一言数据
export const getHitokoto = async () => {
  const res = await fetch("https://v1.hitokoto.cn");
  return await res.json();
};

/**
 * 天气
 */

// 获取高德地理位置信息
export const getAdcode = async (key) => {
  const res = await fetch(`https://restapi.amap.com/v3/ip?key=${key}`);
  return await res.json();
};

// 获取高德地理天气信息
export const getWeather = async (key, city) => {
  const res = await fetch(
    `https://restapi.amap.com/v3/weather/weatherInfo?key=${key}&city=${city}`,
  );
  return await res.json();
};

// 获取教书先生天气 API
// https://api.oioweb.cn/doc/weather/GetWeather
export const getOtherWeather = async () => {
  const res = await fetch("https://api.oioweb.cn/api/weather/GetWeather");
  return await res.json();
};
