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
  <div class="weather weather-fallback" v-else-if="weatherError">
    <form v-if="selectingCity" @submit.prevent="setCity">
      <input
        v-model="cityInput"
        aria-label="输入城市"
        placeholder="输入城市"
        autocomplete="address-level2"
      />
      <button type="submit">查询</button>
    </form>
    <template v-else>
      <span>{{ weatherErrorMessage }}</span>
      <button type="button" @click="selectingCity = true">选择城市</button>
    </template>
  </div>
  <div class="weather" v-else>
    <span>天气加载中...</span>
  </div>
</template>

<script setup>
import { getAdcode, getReverseGeocode, getWeather } from "@/api";
import { Error } from "@icon-park/vue-next";

// 高德开发者 Key
const mainKey = import.meta.env.VITE_WEATHER_KEY;
const weatherError = ref(false);
const weatherErrorMessage = ref("天气数据获取失败");
const selectingCity = ref(false);
const cityInput = ref("");
const savedCityKey = "weatherCity";

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

// 获取天气数据
const getWeatherData = async (manualCity = "") => {
  weatherError.value = false;
  try {
    if (!mainKey) throw new Error("未配置高德天气 Key");

    let city = manualCity;
    let adcode = manualCity;
    if (!city) {
      try {
        city = localStorage.getItem(savedCityKey) || "";
        adcode = city;
      } catch (error) {
        console.warn("读取保存的城市失败:", error);
      }
    }
    if (!city) {
      try {
        const adCode = await getAdcode(mainKey);
        if (
          adCode.infocode === "10000" &&
          typeof adCode.city === "string" &&
          adCode.city &&
          typeof adCode.adcode === "string" &&
          adCode.adcode
        ) {
          city = adCode.city;
          adcode = adCode.adcode;
        }
      } catch (error) {
        console.warn("IP 定位失败:", error);
      }
    }
    if (!city) {
      if (!navigator.geolocation) throw new Error("无法自动定位");
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
        throw new Error("无法自动定位");
      }
      city = typeof address.city === "string" && address.city ? address.city : address.province;
      adcode = address.adcode;
    }

    // 获取天气信息
    const result = await getWeather(mainKey, adcode);
    if (result.infocode !== "10000" || !result.lives?.[0]) {
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
    selectingCity.value = false;
    if (manualCity) {
      try {
        localStorage.setItem(savedCityKey, manualCity);
      } catch (error) {
        console.warn("保存城市失败:", error);
      }
    }
  } catch (error) {
    weatherError.value = true;
    weatherErrorMessage.value =
      error?.code === 1 || error?.message === "无法自动定位" ? "无法自动定位" : "天气数据获取失败";
    console.error("天气信息获取失败:" + error);
    onError("天气信息获取失败");
  }
};

const setCity = () => {
  const city = cityInput.value.trim();
  if (!city) return;
  getWeatherData(city);
};

// 报错信息
const onError = (message) => {
  ElMessage({
    message,
    icon: h(Error, {
      theme: "filled",
      fill: "#efefef",
    }),
  });
  console.error(message);
};

onMounted(() => {
  // 调用获取天气
  getWeatherData();
});
</script>

<style lang="scss" scoped>
.weather-fallback,
.weather-fallback form {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.weather-fallback input {
  width: 90px;
  min-width: 0;
  padding: 3px 6px;
  border: 1px solid #ffffff80;
  border-radius: 4px;
  background: #ffffff20;
  color: inherit;
}

.weather-fallback input::placeholder {
  color: #ffffffb0;
}

.weather-fallback button {
  padding: 3px 6px;
  border: 1px solid #ffffff80;
  border-radius: 4px;
  background: #ffffff20;
  color: inherit;
  cursor: pointer;
}
</style>
