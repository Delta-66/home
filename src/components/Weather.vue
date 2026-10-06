<template>
  <div class="weather" v-if="weatherData.adCode.city && weatherData.weather.weather">
    <span>{{ weatherData.adCode.city }}&nbsp;</span>
    <span>{{ weatherData.weather.weather }}&nbsp;</span>
    <span>{{ weatherData.weather.temperature }}℃</span>
    <span class="sm-hidden">
      &nbsp;{{
        weatherData.weather.winddirection?.endsWith("风")
          ? weatherData.weather.winddirection
          : weatherData.weather.winddirection + "风"
      }}&nbsp;
    </span>
    <span class="sm-hidden">{{ weatherData.weather.windpower }}&nbsp;级</span>
  </div>
  <div class="weather weather-fallback" v-else-if="weatherError && !weatherHidden">
    <span>天气不可用，允许定位？</span>
    <button type="button" @click="requestLocation">允许定位</button>
    <button type="button" @click="weatherHidden = true">跳过</button>
  </div>
  <div class="weather" v-else-if="!weatherHidden">
    <span>天气加载中...</span>
  </div>
</template>

<script setup>
import { getAdcode, getReverseGeocode, getWeather } from "@/api";

// 高德开发者 Key
const mainKey = import.meta.env.VITE_WEATHER_KEY;
const weatherError = ref(false);
const weatherHidden = ref(false);

// 天气数据
const weatherData = reactive({
  adCode: {
    city: null, // 城市
    adcode: null, // 城市编码
  },
  weather: {
    weather: null, // 天气现象
    temperature: null, // 实时气温
    winddirection: null, // 风向描述
    windpower: null, // 风力级别
  },
});

// 获取天气信息
const loadWeather = async (city, adcode) => {
  const result = await getWeather(mainKey, adcode);
  if (result.infocode !== "10000" || !result.lives?.[0]?.weather) {
    throw new Error("天气数据不可用");
  }
  weatherData.adCode = {
    city: result.lives[0].city || city,
    adcode: result.lives[0].adcode || adcode,
  };
  weatherData.weather = {
    weather: result.lives[0].weather,
    temperature: result.lives[0].temperature,
    winddirection: result.lives[0].winddirection,
    windpower: result.lives[0].windpower,
  };
  weatherError.value = false;
};

// 先用 IP 查询天气；失败时询问是否使用浏览器定位
const getWeatherData = async () => {
  try {
    if (!mainKey) throw new Error("未配置高德天气 Key");
    const adCode = await getAdcode(mainKey);
    if (
      adCode.infocode !== "10000" ||
      typeof adCode.city !== "string" ||
      !adCode.city ||
      typeof adCode.adcode !== "string" ||
      !adCode.adcode
    ) {
      throw new Error("IP 定位失败");
    }
    await loadWeather(adCode.city, adCode.adcode);
  } catch (error) {
    console.warn("自动获取天气失败:", error);
    weatherError.value = true;
  }
};

// 用户同意后再向浏览器请求定位；失败则隐藏天气
const requestLocation = async () => {
  weatherError.value = false;
  try {
    if (!mainKey || !navigator.geolocation) throw new Error("无法定位");
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 600000,
      });
    });
    const location = await getReverseGeocode(
      mainKey,
      position.coords.longitude,
      position.coords.latitude,
    );
    const address = location.regeocode?.addressComponent;
    if (location.infocode !== "10000" || !address?.adcode) {
      throw new Error("无法定位");
    }
    const city = typeof address.city === "string" && address.city ? address.city : address.province;
    if (typeof city !== "string" || !city) throw new Error("无法定位");
    await loadWeather(city, address.adcode);
  } catch (error) {
    console.warn("定位后仍无法获取天气:", error);
    weatherHidden.value = true;
  }
};

onMounted(() => {
  // 调用获取天气
  getWeatherData();
});
</script>

<style lang="scss" scoped>
.weather-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
}

.weather-fallback button {
  padding: 3px 6px;
  border: 1px solid #ffffff80;
  border-radius: 4px;
  background: #ffffff20;
  color: inherit;
  cursor: pointer;
  font: inherit;
}
</style>
