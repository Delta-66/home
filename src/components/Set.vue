<template>
  <div class="setting">
    <el-collapse class="collapse" v-model="activeName" accordion>
      <el-collapse-item title="个性壁纸" name="1">
        <div class="bg-set">
          <el-radio-group
            v-model="coverType"
            class="wallpaper-options"
            text-color="#ffffff"
            @change="radioChange"
          >
            <el-radio value="0" size="large" border>默认壁纸</el-radio>
            <el-radio v-if="customWallpapers.length" value="custom-random" size="large" border>
              新增壁纸（{{ customWallpapers.length }}）
            </el-radio>
            <button class="add-wallpaper" type="button" @click="wallpaperInput?.click()">
              <span class="add-wallpaper-icon" aria-hidden="true"></span>
              <span class="add-wallpaper-label">上传壁纸</span>
            </button>
          </el-radio-group>
          <input
            ref="wallpaperInput"
            class="wallpaper-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            @change="addWallpaper"
          />
        </div>
      </el-collapse-item>
      <el-collapse-item title="个性化调整" name="2">
        <div class="item">
          <span class="text">建站日期显示</span>
          <el-switch
            v-model="siteStartShow"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">音乐点击是否打开面板</span>
          <el-switch
            v-model="musicClick"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">底栏歌词显示</span>
          <el-switch
            v-model="playerLrcShow"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">底栏背景模糊</span>
          <el-switch
            v-model="footerBlur"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
      </el-collapse-item>
      <el-collapse-item title="播放器配置" name="3">
        <div class="item">
          <span class="text">自动播放</span>
          <el-switch
            v-model="playerAutoplay"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
        <div class="item">
          <span class="text">随机播放</span>
          <el-switch
            v-model="playerOrder"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
            active-value="random"
            inactive-value="list"
          />
        </div>
        <div class="item">
          <span class="text">循环模式</span>
          <el-radio-group v-model="playerLoop" size="small" text-color="#FFFFFF">
            <el-radio value="all" border>列表</el-radio>
            <el-radio value="one" border>单曲</el-radio>
            <el-radio value="none" border>不循环</el-radio>
          </el-radio-group>
        </div>
      </el-collapse-item>
      <el-collapse-item title="其他设置" name="4">
        <div>设置内容待增加</div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
import { CheckSmall, CloseSmall, SuccessPicture } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import { storeToRefs } from "pinia";
import { listCustomWallpapers, saveCustomWallpapers } from "@/utils/customWallpaper";

const store = mainStore();
const {
  coverType,
  siteStartShow,
  musicClick,
  playerLrcShow,
  footerBlur,
  playerAutoplay,
  playerOrder,
  playerLoop,
} = storeToRefs(store);

// 默认选中项
const activeName = ref("1");
const wallpaperInput = ref(null);
const customWallpapers = ref([]);

onMounted(async () => {
  try {
    customWallpapers.value = await listCustomWallpapers();
  } catch (error) {
    console.error("读取自定义壁纸列表失败", error);
    ElMessage.error("已添加的壁纸读取失败");
  }
});

const addWallpaper = async (event) => {
  const files = Array.from(event.target.files || []);
  event.target.value = "";
  if (!files.length) return;

  if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
    ElMessage.error("请选择 JPG、PNG 或 WebP 图片");
    return;
  }

  try {
    for (const file of files) {
      const previewUrl = URL.createObjectURL(file);
      try {
        await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = resolve;
          image.onerror = () => reject(new Error("图片无法解码"));
          image.src = previewUrl;
        });
      } finally {
        URL.revokeObjectURL(previewUrl);
      }
    }
    await saveCustomWallpapers(files);
    customWallpapers.value = await listCustomWallpapers();
    if (coverType.value === "custom-random") {
      store.customWallpaperRevision += 1;
    } else {
      coverType.value = "custom-random";
    }
    ElMessage.success(`已新增 ${files.length} 张壁纸`);
  } catch (error) {
    console.error("保存自定义壁纸失败", error);
    ElMessage.error("壁纸保存失败，请换一张图片重试");
  }
};

// 壁纸切换
const radioChange = () => {
  ElMessage({
    message: "壁纸更换成功",
    icon: h(SuccessPicture, {
      theme: "filled",
      fill: "#efefef",
    }),
  });
};
</script>

<style lang="scss" scoped>
.setting {
  .bg-set {
    display: flex;
    align-items: center;
    flex-wrap: wrap;

    .add-wallpaper {
      display: inline-flex;
      align-items: center;
      box-sizing: border-box;
      height: 40px;
      margin: 10px 16px;
      padding: 0 19px 0 11px;
      color: #fff;
      font-family: inherit;
      font-size: 14px;
      font-weight: var(--el-font-weight-primary);
      background: #ffffff26;
      border: 2px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      white-space: nowrap;

      .add-wallpaper-icon {
        position: relative;
        display: inline-block;
        flex: none;
        box-sizing: border-box;
        width: 14px;
        height: 14px;
        border: 2px solid #eeeeee;
        border-radius: 50%;

        &::before,
        &::after {
          position: absolute;
          top: 50%;
          left: 50%;
          content: "";
          background: #fff;
          border-radius: 1px;
          transform: translate(-50%, -50%);
        }

        &::before {
          width: 6px;
          height: 1px;
        }

        &::after {
          width: 1px;
          height: 6px;
        }
      }

      .add-wallpaper-label {
        padding-left: 8px;
      }

      &:hover,
      &:focus-visible {
        background: #ffffff06;
        border-color: #eeeeee;
      }
    }

    .wallpaper-input {
      display: none;
    }
  }

  .collapse {
    border-radius: 8px;
    --el-collapse-content-bg-color: #ffffff10;
    border-color: transparent;
    overflow: hidden;

    :deep(.el-collapse-item__header) {
      background-color: #ffffff30;
      color: #fff;
      font-size: 15px;
      padding-left: 18px;
      border-color: transparent;
    }

    :deep(.el-collapse-item__wrap) {
      border-color: transparent;

      .el-collapse-item__content {
        padding: 20px;
        .item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          font-size: 14px;
          .el-switch__core {
            border-color: transparent;
            background-color: #ffffff30;
          }
          .el-radio-group {
            .el-radio {
              margin: 2px 10px 2px 0;
              border-radius: 5px;

              &:last-child {
                margin-right: 0;
              }
            }
          }
        }
        .el-radio-group {
          justify-content: space-between;

          &.wallpaper-options {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-start;
            width: 100%;
          }

          .el-radio {
            margin: 10px 16px;
            background: #ffffff26;
            border: 2px solid transparent;
            border-radius: 8px;

            .el-radio__label {
              color: #fff;
            }

            .el-radio__inner {
              background: #ffffff06 !important;
              border: 2px solid #eeeeee !important;
            }

            &.is-checked {
              background: #ffffff06 !important;
              border: 2px solid #eeeeee !important;
            }

            .is-checked {
              .el-radio__inner {
                background-color: #ffffff30 !important;
                border-color: #fff !important;
              }

              & + .el-radio__label {
                color: #fff !important;
              }
            }
          }
        }
      }
    }
  }
}
</style>
