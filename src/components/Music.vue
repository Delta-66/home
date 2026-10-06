<template>
  <!-- 音乐控制面板 -->
  <div
    class="music"
    @mouseenter="volumeShow = true"
    @mouseleave="volumeShow = false"
    v-show="store.musicOpenState"
  >
    <div class="btns">
      <span @click="openMusicList()">{{ playerData.server === "tencent" ? "可播放歌曲" : "音乐列表" }}</span>
      <span @click="store.musicOpenState = false">回到一言</span>
    </div>
    <div class="control">
      <go-start theme="filled" size="30" fill="#efefef" @click="changeMusicIndex(0)" />
      <Transition name="fade" mode="out-in">
        <div :key="store.playerState" class="state" @click="changePlayState">
          <play-one theme="filled" size="50" fill="#efefef" v-show="!store.playerState" />
          <pause theme="filled" size="50" fill="#efefef" v-show="store.playerState" />
        </div>
      </Transition>
      <go-end theme="filled" size="30" fill="#efefef" @click="changeMusicIndex(1)" />
    </div>
    <div class="menu">
      <div class="name" v-show="!volumeShow">
        <span>{{
          store.getPlayerData.name
            ? store.getPlayerData.name + " - " + store.getPlayerData.artist
            : "未播放音乐"
        }}</span>
      </div>
      <div class="volume" v-show="volumeShow">
        <div class="icon">
          <volume-mute theme="filled" size="24" fill="#efefef" v-if="volumeNum == 0" />
          <volume-small
            theme="filled"
            size="24"
            fill="#efefef"
            v-else-if="volumeNum > 0 && volumeNum < 0.7"
          />
          <volume-notice theme="filled" size="24" fill="#efefef" v-else />
        </div>
        <el-slider v-model="volumeNum" :show-tooltip="false" :min="0" :max="1" :step="0.01" />
      </div>
    </div>
  </div>
  <!-- 音乐列表弹窗 -->
  <Teleport to="body">
    <Transition name="fade" mode="out-in">
      <div
        class="music-list"
        v-show="musicListShow"
        role="dialog"
        aria-modal="true"
        aria-label="音乐列表"
        @click="closeMusicList()"
      >
      <Transition name="zoom">
        <div class="list" v-show="musicListShow" @click.stop>
          <close-one
            class="close"
            theme="filled"
            size="28"
            fill="#ffffff60"
            @click="closeMusicList()"
          />
          <div class="playlist-heading">
            <span>当前歌单</span>
            <strong>{{ playlistOptions[activePlaylistIndex]?.name }}</strong>
          </div>
          <Player
            ref="playerRef"
            :key="`${playerData.server}-${playerData.type}-${playerData.id}`"
            :songServer="playerData.server"
            :songType="playerData.type"
            :songId="playerData.id"
            :volume="volumeNum"
            :listFolded="musicListShow"
            :listMaxHeight="360"
          />
          <button class="choose-playlist" type="button" @click="playlistPickerShow = true">
            <span>选择歌单</span>
            <span aria-hidden="true">›</span>
          </button>
          <Transition name="fade">
            <div v-if="playlistPickerShow" class="playlist-picker" role="dialog" aria-label="选择歌单">
              <div class="picker-heading">
                <div><span>PLAYLISTS</span><h2>选择歌单</h2></div>
                <button type="button" aria-label="返回歌曲列表" @click="playlistPickerShow = false">×</button>
              </div>
              <div class="playlist-options">
                <button
                  v-for="(playlist, index) in playlistOptions"
                  :key="`${playlist.server}-${playlist.id}-${index}`"
                  class="playlist-option"
                  :class="{ active: index === activePlaylistIndex }"
                  type="button"
                  :aria-current="index === activePlaylistIndex ? 'true' : undefined"
                  @click="selectPlaylist(index)"
                >
                  <span class="playlist-index">{{ String(index + 1).padStart(2, "0") }}</span>
                  <span class="playlist-info"><strong>{{ playlist.name }}</strong><small>{{ playlist.server === "tencent" ? "QQ 音乐" : "网易云音乐" }}</small></span>
                  <span class="playlist-arrow" aria-hidden="true">{{ index === activePlaylistIndex ? "✓" : "↗" }}</span>
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import {
  GoStart,
  PlayOne,
  Pause,
  GoEnd,
  CloseOne,
  VolumeMute,
  VolumeSmall,
  VolumeNotice,
} from "@icon-park/vue-next";
import Player from "@/components/Player.vue";
import { mainStore } from "@/store";
import additionalPlaylists from "@/assets/playlists.json";
const store = mainStore();

// 音量条数据
const volumeShow = ref(false);
const volumeNum = ref(store.musicVolume ? store.musicVolume : 0.7);

// 播放列表数据
const musicListShow = ref(false);
const playlistPickerShow = ref(false);
const playerRef = ref(null);
const playerData = reactive({
  server: import.meta.env.VITE_SONG_SERVER,
  type: import.meta.env.VITE_SONG_TYPE,
  id: import.meta.env.VITE_SONG_ID,
});
const playlistOptions = [
  ...(playerData.id ? [{ name: import.meta.env.VITE_SONG_NAME || "默认歌单", ...playerData }] : []),
  ...additionalPlaylists
    .filter((playlist) => playlist.name && playlist.id && playlist.server)
    .map((playlist) => ({ ...playlist, type: "playlist" })),
];
const activePlaylistIndex = ref(0);

if (!playerData.id && playlistOptions.length) {
  Object.assign(playerData, playlistOptions[0]);
}

const selectPlaylist = (index) => {
  if (!playlistOptions[index]) return;
  playlistPickerShow.value = false;
  if (index === activePlaylistIndex.value) return;
  activePlaylistIndex.value = index;
  store.musicIsOk = false;
  store.setPlayerState(true);
  store.setPlayerData(null, null);
  store.setPlayerLrc("歌词加载中");
  Object.assign(playerData, playlistOptions[index]);
};

// 开启播放列表
const openMusicList = () => {
  musicListShow.value = true;
  playlistPickerShow.value = false;
  playerRef.value?.toggleList();
};

// 关闭播放列表
const closeMusicList = () => {
  musicListShow.value = false;
  playlistPickerShow.value = false;
  playerRef.value?.toggleList();
};

// 音乐播放暂停
const changePlayState = () => {
  playerRef.value?.playToggle();
};

// 音乐上下曲
const changeMusicIndex = (type) => {
  playerRef.value?.changeSong(type);
};

onMounted(() => {
  // 空格键事件
  window.addEventListener("keydown", (e) => {
    if (!store.musicIsOk) {
      return;
    }
    if (e.code == "Space") {
      changePlayState();
    }
  });
  // 挂载方法至 window
  window.$openList = openMusicList;
});

// 监听音量变化
watch(
  () => volumeNum.value,
  (value) => {
    store.musicVolume = value;
    playerRef.value?.changeVolume(store.musicVolume);
  },
);
</script>

<style lang="scss" scoped>
.music {
  width: 100%;
  height: 100%;
  background: #00000040;
  backdrop-filter: blur(10px);
  border-radius: 6px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: column;
  animation: fade 0.5s;
  .btns {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
    span {
      background: #ffffff26;
      padding: 2px 8px;
      border-radius: 6px;
      margin: 0px 6px;
      text-overflow: ellipsis;
      overflow-x: hidden;
      white-space: nowrap;
      &:hover {
        background: #ffffff4d;
      }
    }
  }
  .control {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-evenly;
    width: 100%;
    .state {
      transition: opacity 0.1s;
      .i-icon {
        width: 50px;
        height: 50px;
        display: block;
      }
    }
    .i-icon {
      width: 36px;
      height: 36px;
      display: flex;
      border-radius: 6px;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transform: scale(1);
      &:hover {
        background: #ffffff33;
      }
      &:active {
        transform: scale(0.95);
      }
    }
  }
  .menu {
    height: 26px;
    width: 100%;
    line-height: 26px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    .name {
      width: 100%;
      text-align: center;
      text-overflow: ellipsis;
      overflow-x: hidden;
      white-space: nowrap;
      animation: fade 0.3s;
    }
    .volume {
      width: 100%;
      padding: 0 12px;
      display: flex;
      align-items: center;
      flex-direction: row;
      animation: fade 0.3s;
      .icon {
        margin-right: 12px;
        span {
          width: 24px;
          height: 24px;
          display: block;
        }
      }
      :deep(*) {
        transition: none;
      }
      :deep(.el-slider__button) {
        transition: 0.3s;
      }
      .el-slider {
        margin-right: 12px;
        --el-slider-main-bg-color: #efefef;
        --el-slider-runway-bg-color: #ffffff40;
        --el-slider-button-size: 16px;
      }
    }
  }
}
.music-list {
  position: fixed;
  top: 0;
  left: 0;
  margin: auto;
  width: 100%;
  height: 100%;
  background-color: #00000080;
  backdrop-filter: blur(20px);
  z-index: 1000;
  .list {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    top: calc(50% - 320px);
    left: calc(50% - 320px);
    width: 640px;
    height: 640px;
    background-color: #ffffff66;
    border-radius: 6px;
    z-index: 999;
    @media (max-width: 720px) {
      left: calc(50% - 45%);
      width: 90%;
    }
    .close {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 28px;
      height: 28px;
      display: block;
      &:hover {
        transform: scale(1.2);
      }
      &:active {
        transform: scale(0.95);
      }
    }
    .playlist-heading {
      display: flex;
      flex-direction: column;
      gap: 5px;
      width: 80%;
      margin-bottom: 14px;
      color: #fff;
      span {
        color: #ffffffb3;
        font-size: 12px;
      }
      strong {
        font-size: 18px;
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    .choose-playlist {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 80%;
      margin-top: 16px;
      padding: 10px 16px;
      border: 1px solid #ffffff66;
      border-radius: 6px;
      background: #ffffff26;
      color: #fff;
      font: inherit;
      cursor: pointer;
      &:hover { background: #ffffff40; }
      span:last-child { font-size: 22px; line-height: 1; }
    }
    .playlist-picker {
      position: absolute;
      inset: 0;
      z-index: 2;
      padding: 44px 52px;
      border-radius: 6px;
      background: #536657ed;
      backdrop-filter: blur(22px);
      color: #fff;
      display: flex;
      flex-direction: column;
      .picker-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 24px;
        span { font-size: 11px; letter-spacing: 0.14em; color: #ffffffa8; }
        h2 { margin: 5px 0 0; font-size: 24px; font-weight: 600; }
        button {
          width: 30px;
          height: 30px;
          border: 1px solid #ffffff80;
          border-radius: 50%;
          background: #ffffff26;
          color: #fff;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
        }
      }
      .playlist-options { min-height: 0; overflow-y: auto; display: grid; gap: 10px; align-content: start; }
      .playlist-option {
        display: flex;
        align-items: center;
        gap: 16px;
        width: 100%;
        padding: 16px 18px;
        border: 1px solid #ffffff38;
        border-radius: 6px;
        background: #ffffff1f;
        color: #fff;
        text-align: left;
        cursor: pointer;
        &:hover, &.active { background: #ffffff38; border-color: #ffffff66; }
        .playlist-index { color: #ffffffa8; font-size: 12px; }
        .playlist-info {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
          strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 15px; }
          small { color: #ffffffa8; font-size: 11px; }
        }
        .playlist-arrow { font-size: 20px; }
      }
    }
    @media (max-width: 720px) {
      top: 50%;
      transform: translateY(-50%);
      height: min(640px, calc(100vh - 32px));
      .playlist-picker { padding: 38px 24px; }
    }
  }
}

// 弹窗动画
.zoom-enter-active {
  animation: zoom 0.4s ease-in-out;
}
.zoom-leave-active {
  animation: zoom 0.3s ease-in-out reverse;
}
@keyframes zoom {
  0% {
    opacity: 0;
    transform: scale(0) translateY(-600px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
