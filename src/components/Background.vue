<template>
  <div :class="store.backgroundShow ? 'cover show' : 'cover'">
    <img
      v-show="store.imgLoadStatus"
      :src="bgUrl"
      class="bg"
      alt="cover"
      @load="imgLoadComplete"
      @error="imgLoadError"
      @animationend="imgAnimationEnd"
    />
    <div :class="store.backgroundShow ? 'gray hidden' : 'gray'" />
    <Transition name="fade" mode="out-in">
      <a v-if="store.backgroundShow" class="down" :href="bgUrl" target="_blank"> 下载壁纸 </a>
    </Transition>
  </div>
</template>

<script setup>
import { mainStore } from "@/store";
import { Error } from "@icon-park/vue-next";
import { listCustomWallpapers, loadCustomWallpaper } from "@/utils/customWallpaper";

const store = mainStore();
const bgUrl = ref(null);
const imgTimeout = ref(null);
const emit = defineEmits(["loadComplete"]);
let customObjectUrl = null;
const staleObjectUrls = [];
let bgChangeToken = 0;

// 壁纸随机数
// 请依据文件夹内的图片个数修改 Math.random() 后面的第一个数字
const bgRandom = Math.floor(Math.random() * 3 + 1);
const defaultBgUrl = `${import.meta.env.BASE_URL}images/background${bgRandom}.jpg`;
// 更换壁纸链接
const changeBg = async (type) => {
  const token = ++bgChangeToken;
  if (type === "custom-random") {
    try {
      const wallpapers = await listCustomWallpapers();
      if (token !== bgChangeToken) return;
      const selected = wallpapers[Math.floor(Math.random() * wallpapers.length)];
      const wallpaper = selected ? await loadCustomWallpaper(selected.id) : null;
      if (token !== bgChangeToken) return;
      if (!wallpaper) {
        store.coverType = "0";
        return;
      }
      const nextUrl = URL.createObjectURL(wallpaper);
      bgUrl.value = nextUrl;
      if (customObjectUrl) staleObjectUrls.push(customObjectUrl);
      customObjectUrl = nextUrl;
    } catch (error) {
      console.error("读取自定义壁纸失败", error);
      if (token === bgChangeToken) store.coverType = "0";
    }
  } else {
    bgUrl.value = defaultBgUrl;
    if (customObjectUrl) staleObjectUrls.push(customObjectUrl);
    customObjectUrl = null;
  }
};

// 图片加载完成
const imgLoadComplete = () => {
  staleObjectUrls.splice(0).forEach((url) => URL.revokeObjectURL(url));
  imgTimeout.value = setTimeout(
    () => {
      store.setImgLoadStatus(true);
    },
    Math.floor(Math.random() * (600 - 300 + 1)) + 300,
  );
};

// 图片动画完成
const imgAnimationEnd = () => {
  console.log("壁纸加载且动画完成");
  // 加载完成事件
  emit("loadComplete");
};

// 图片显示失败
const imgLoadError = () => {
  console.error("壁纸加载失败：", bgUrl.value);
  if (store.coverType !== "custom-random") return;
  ElMessage({
    message: "壁纸加载失败，已切换回默认",
    icon: h(Error, {
      theme: "filled",
      fill: "#efefef",
    }),
  });
  store.coverType = "0";
};

// 监听壁纸切换
watch(
  () => [store.coverType, store.customWallpaperRevision],
  () => {
    changeBg(store.coverType);
  },
);

onMounted(() => {
  // 加载壁纸
  if (store.coverType !== "0" && store.coverType !== "custom-random") {
    store.coverType =
      store.coverType === "custom" || store.coverType.startsWith("custom:") ? "custom-random" : "0";
  } else {
    changeBg(store.coverType);
  }
});

onBeforeUnmount(() => {
  clearTimeout(imgTimeout.value);
  bgChangeToken += 1;
  staleObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  if (customObjectUrl) URL.revokeObjectURL(customObjectUrl);
});
</script>

<style lang="scss" scoped>
.cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: 0.25s;
  z-index: -1;

  &.show {
    z-index: 1;
  }

  .bg {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    backface-visibility: hidden;
    filter: blur(20px) brightness(0.3);
    transition:
      filter 0.3s,
      transform 0.3s;
    animation: fade-blur-in 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    animation-delay: 0.45s;
  }
  .gray {
    opacity: 1;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(rgba(0, 0, 0, 0) 0, rgba(0, 0, 0, 0.5) 100%),
      radial-gradient(rgba(0, 0, 0, 0) 33%, rgba(0, 0, 0, 0.3) 166%);

    transition: 1.5s;
    &.hidden {
      opacity: 0;
      transition: 1.5s;
    }
  }
  .down {
    font-size: 16px;
    color: white;
    position: absolute;
    bottom: 30px;
    left: 0;
    right: 0;
    margin: 0 auto;
    display: block;
    padding: 20px 26px;
    border-radius: 8px;
    background-color: #00000030;
    width: 120px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    &:hover {
      transform: scale(1.05);
      background-color: #00000060;
    }
    &:active {
      transform: scale(1);
    }
  }
}
</style>
