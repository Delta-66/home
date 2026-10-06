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

// 无 Key 时按访客 IP 定位，再获取所在城市的实时天气
export const getOtherWeather = async () => {
  const locationResponse = await fetch(
    "https://ipwho.is/?lang=zh-CN&fields=success,city,latitude,longitude",
  );
  if (!locationResponse.ok) throw new Error(`地区接口返回 ${locationResponse.status}`);
  const location = await locationResponse.json();
  if (
    !location.success ||
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  ) {
    throw new Error("地区接口没有返回有效坐标");
  }

  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,weather_code,wind_speed_10m,wind_direction_10m",
    timezone: "auto",
  });
  const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!weatherResponse.ok) throw new Error(`天气接口返回 ${weatherResponse.status}`);
  const result = await weatherResponse.json();
  if (
    !result.current ||
    !Number.isFinite(result.current.temperature_2m) ||
    !Number.isFinite(result.current.weather_code) ||
    !Number.isFinite(result.current.wind_speed_10m) ||
    !Number.isFinite(result.current.wind_direction_10m)
  ) {
    throw new Error("天气接口没有返回实时数据");
  }
  return { location, current: result.current };
};
