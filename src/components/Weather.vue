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
    <a
      v-if="weatherSource"
      class="weather-source"
      href="https://open-meteo.com/"
      target="_blank"
      rel="noopener noreferrer"
    >
      Open-Meteo
    </a>
  </div>
  <div class="weather" v-else>
    <span>{{ weatherError ? "天气数据获取失败" : "天气加载中..." }}</span>
  </div>
</template>

<script setup>
import { getAdcode, getWeather, getOtherWeather } from "@/api";
import { Error } from "@icon-park/vue-next";

// 高德开发者 Key
const mainKey = import.meta.env.VITE_WEATHER_KEY;
const weatherSource = ref("");
const weatherError = ref(false);

const weatherNames = {
  0: "晴", 1: "晴间多云", 2: "多云", 3: "阴",
  45: "雾", 48: "冻雾",
  51: "小毛毛雨", 53: "毛毛雨", 55: "浓毛毛雨",
  56: "冻毛毛雨", 57: "冻毛毛雨",
  61: "小雨", 63: "中雨", 65: "大雨",
  66: "冻雨", 67: "冻雨",
  71: "小雪", 73: "中雪", 75: "大雪", 77: "米雪",
  80: "小阵雨", 81: "阵雨", 82: "强阵雨",
  85: "小阵雪", 86: "强阵雪",
  95: "雷阵雨", 96: "雷阵雨伴冰雹", 97: "强雷暴", 99: "强雷暴伴冰雹",
};
const windDirectionNames = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
const windPowerThresholds = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118];

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

// 单个温度取整；传入最高和最低温度时取平均值
const getTemperature = (min, max = min) => {
  try {
    // 计算平均值并四舍五入
    const average = (Number(min) + Number(max)) / 2;
    return Math.round(average);
  } catch (error) {
    console.error("计算温度出现错误：", error);
    return "NaN";
  }
};

// 获取天气数据
const getWeatherData = async () => {
  try {
    // 获取地理位置信息
    if (!mainKey) {
      const result = await getOtherWeather();
      const data = result.current;
      const directionIndex = Math.round(data.wind_direction_10m / 45) % 8;
      const windPower = windPowerThresholds.findIndex((limit) => data.wind_speed_10m < limit);
      weatherData.adCode = {
        city: result.location.city || "未知地区",
      };
      weatherData.weather = {
        weather: weatherNames[data.weather_code] || "未知天气",
        temperature: getTemperature(data.temperature_2m),
        winddirection: windDirectionNames[directionIndex] || "未知",
        windpower: windPower < 0 ? 12 : windPower,
      };
      weatherSource.value = "Open-Meteo";
    } else {
      // 获取 Adcode
      const adCode = await getAdcode(mainKey);
      console.log(adCode);
      if (adCode.infocode !== "10000") {
        throw "地区查询失败";
      }
      weatherData.adCode = {
        city: adCode.city,
        adcode: adCode.adcode,
      };
      // 获取天气信息
      const result = await getWeather(mainKey, weatherData.adCode.adcode);
      weatherData.weather = {
        weather: result.lives[0].weather,
        temperature: result.lives[0].temperature,
        winddirection: result.lives[0].winddirection,
        windpower: result.lives[0].windpower,
      };
    }
    weatherError.value = false;
  } catch (error) {
    weatherError.value = true;
    console.error("天气信息获取失败:" + error);
    onError("天气信息获取失败");
  }
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
.weather-source {
  margin-left: 8px;
  color: inherit;
  font-size: 0.75em;
  opacity: 0.75;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
</style>
