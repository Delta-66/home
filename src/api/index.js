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
  const res = await fetch(url).catch(() => {
    throw new Error("歌单接口连接失败");
  });
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
    let jsonpData;
    try {
      jsonpData = await fetchJsonp(url, { jsonpCallback, timeout: 15000 }).then((res) =>
        res.json(),
      );
    } catch (error) {
      throw new Error(
        error?.message?.includes("timed out")
          ? "QQ 音乐播放地址获取超时"
          : "QQ 音乐播放地址获取失败",
      );
    }
    const sip = jsonpData?.req_0?.data?.sip;
    const midurlinfo = jsonpData?.req_0?.data?.midurlinfo;
    if (!Array.isArray(sip) || !sip.length || !Array.isArray(midurlinfo)) {
      throw new Error("QQ 音乐未返回播放地址");
    }
    const domain = (sip.find((i) => !i.startsWith("http://ws")) || sip[0]).replace(
      "http://",
      "https://",
    );

    const playableSongs = data
      .map((v, i) => {
        const purl = midurlinfo[i]?.purl;
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

// IP 无法定位时，用浏览器提供的坐标查询高德城市编码
export const getReverseGeocode = async (key, longitude, latitude) => {
  const params = new URLSearchParams({
    key,
    location: `${longitude},${latitude}`,
    extensions: "base",
  });
  const res = await fetch(`https://restapi.amap.com/v3/geocode/regeo?${params}`);
  return await res.json();
};

// 获取高德地理天气信息
export const getWeather = async (key, city) => {
  const res = await fetch(
    `https://restapi.amap.com/v3/weather/weatherInfo?key=${key}&city=${city}`,
  );
  return await res.json();
};
