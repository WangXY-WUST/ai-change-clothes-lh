<template>
  <div id="app">
    <header class="header">
      <div class="header-content">
        <div style="display: flex; align-items: center; gap: 1rem">
          <img src="/logo.svg" alt="logo" class="logo" />
          <h1 class="title">AI 换衣空间</h1>
        </div>
        <div class="header-controls">
          <button
            class="clear-btn"
            @click="clearAll"
            :disabled="!personImage && !clothesImage && !resultImage"
          >
            <X class="icon" />
            清除
          </button>
          <button class="theme-toggle" @click="toggleTheme">
            <Sun v-if="isDark" class="icon" />
            <Moon v-else class="icon" />
          </button>
        </div>
      </div>
    </header>

    <main class="main">
      <div class="container">
        <div class="content-layout">
          <!-- 左侧标语区域 -->
          <div class="slogan-section">
            <div class="slogan-card">
              <div class="slogan-content">
                <h2 class="slogan-title">AI 换衣助手</h2>
                <div class="slogan-text">
                  <p class="slogan-line">是嫌衣柜太挤，还是嫌钱包太鼓？</p>
                  <p class="slogan-line">是怕卖家秀太美，还是怕买家秀太雷？</p>
                  <p class="slogan-line highlight">管不住想买的手？先让AI替你瞅一瞅！</p>
                </div>
                <div class="slogan-decoration">
                  <div class="decoration-dot"></div>
                  <div class="decoration-dot"></div>
                  <div class="decoration-dot"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 中间上传区域 -->
          <div class="upload-section">
            <div class="upload-card">
              <h2 class="card-title">上传人物图像</h2>
              <div
                class="upload-area"
                @click="triggerUpload('person')"
                @drop="handleDrop($event, 'person')"
                @dragover.prevent
                @dragenter.prevent
              >
                <div v-if="!personImage" class="upload-placeholder">
                  <Upload class="upload-icon" />
                  <p>拖拽图片到此处，或点击选择</p>
                  <p class="upload-hint">支持 JPG、PNG 格式</p>
                </div>
                <div v-else class="image-preview">
                  <img :src="personImage" alt="人物图像" style="object-fit: contain" />
                  <button class="remove-btn" @click.stop="removeImage('person')">
                    <X class="icon" />
                  </button>
                </div>
              </div>
              <input
                ref="personInput"
                type="file"
                accept="image/*"
                @change="handleFileSelect($event, 'person')"
                style="display: none"
              />
            </div>

            <div class="upload-card">
              <h2 class="card-title">上传服装图像</h2>
              <div
                class="upload-area"
                @click="triggerUpload('clothes')"
                @drop="handleDrop($event, 'clothes')"
                @dragover.prevent
                @dragenter.prevent
              >
                <div v-if="!clothesImage" class="upload-placeholder">
                  <Upload class="upload-icon" />
                  <p>拖拽图片到此处，或点击选择</p>
                  <p class="upload-hint">支持 JPG、PNG 格式</p>
                </div>
                <div v-else class="image-preview">
                  <img :src="clothesImage" alt="服装图像" style="object-fit: contain" />
                  <button class="remove-btn" @click.stop="removeImage('clothes')">
                    <X class="icon" />
                  </button>
                </div>
              </div>
              <input
                ref="clothesInput"
                type="file"
                accept="image/*"
                @change="handleFileSelect($event, 'clothes')"
                style="display: none"
              />
            </div>
          </div>
        </div>

        <div class="controls-section">
          <div class="style-controls">
            <span class="control-label">风格选择</span>
            <div class="style-buttons">
              <button
                v-for="style in styles"
                :key="style.value"
                :class="['style-btn', { active: selectedStyle === style.value }]"
                @click="selectedStyle = style.value"
              >
                {{ style.label }}
              </button>
            </div>
          </div>

          <button class="generate-btn" :disabled="!canGenerate" @click="generateImage">
            <Loader2 v-if="isGenerating" class="icon spinning" />
            <Sparkles v-else class="icon" />
            {{ isGenerating ? "生成中..." : "开始换衣" }}
          </button>
        </div>

        <!-- 消息提示 -->
        <div v-if="errorMessage || successMessage" class="message-section">
          <div :class="['message-card', errorMessage ? 'error' : 'success']">
            <AlertCircle v-if="errorMessage" class="message-icon" />
            <Sparkles v-else class="message-icon" />
            <span>{{ errorMessage || successMessage }}</span>
            <button
              class="close-btn"
              @click="
                errorMessage = null;
                successMessage = null;
              "
            >
              <X class="icon" />
            </button>
          </div>
        </div>

        <div class="result-section" v-if="resultImage">
          <div class="result-card">
            <h2 class="card-title">换衣结果</h2>
            <div class="result-image">
              <img :src="resultImage" alt="换衣结果" />
              <div class="result-overlay">
                <button class="download-btn" @click="downloadImage">
                  <Download class="icon" />
                  下载图片
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Upload, X, Sun, Moon, Sparkles, Loader2, Download, AlertCircle } from "lucide-vue-next";
import { aiChangeClothesService, type ChangeClothesRequest } from "./services/aiService";

const isDark = ref(false);
const personImage = ref<string | null>(null);
const clothesImage = ref<string | null>(null);
const resultImage = ref<string | null>(null);
const isGenerating = ref(false);
const selectedStyle = ref("original");
const selectedParts = ref<string[]>(["upper"]);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const personInput = ref<HTMLInputElement>();
const clothesInput = ref<HTMLInputElement>();

const styles = [
  { label: "原图", value: "original", description: "保持原图风格" },
  { label: "素描", value: "sketch", description: "手绘素描风格" },
];

const parts = [
  { label: "上半身", value: "upper" },
  { label: "下半身", value: "lower" },
  { label: "帽子", value: "hat" },
  { label: "鞋子", value: "shoes" },
];

const togglePart = (value: string) => {
  const exists = selectedParts.value.includes(value);
  selectedParts.value = exists
    ? selectedParts.value.filter((v) => v !== value)
    : [...selectedParts.value, value];
};

const canGenerate = computed(() => {
  return personImage.value && clothesImage.value && !isGenerating.value;
});

const toggleTheme = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle("dark", isDark.value);
};

const triggerUpload = (type: "person" | "clothes") => {
  if (type === "person") {
    personInput.value?.click();
  } else {
    clothesInput.value?.click();
  }
};

const handleFileSelect = (event: Event, type: "person" | "clothes") => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === "person") {
        personImage.value = result;
      } else {
        clothesImage.value = result;
      }
    };
    reader.readAsDataURL(file);
  }
};

const handleDrop = (event: DragEvent, type: "person" | "clothes") => {
  event.preventDefault();
  const files = event.dataTransfer?.files;
  if (files && files[0]) {
    const file = files[0];
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === "person") {
          personImage.value = result;
        } else {
          clothesImage.value = result;
        }
      };
      reader.readAsDataURL(file);
    }
  }
};

const removeImage = (type: "person" | "clothes") => {
  if (type === "person") {
    personImage.value = null;
    if (personInput.value) personInput.value.value = "";
  } else {
    clothesImage.value = null;
    if (clothesInput.value) clothesInput.value.value = "";
  }
};

const generateImage = async () => {
  if (!canGenerate.value) return;

  isGenerating.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    // 验证图像
    const personValidation = aiChangeClothesService.validateImage(personImage.value!);
    const clothesValidation = aiChangeClothesService.validateImage(clothesImage.value!);

    if (!personValidation.valid) {
      errorMessage.value = `人物图像验证失败: ${personValidation.error}`;
      return;
    }

    if (!clothesValidation.valid) {
      errorMessage.value = `服装图像验证失败: ${clothesValidation.error}`;
      return;
    }

    // 构建请求
    const request: ChangeClothesRequest = {
      personImage: personImage.value!,
      clothesImage: clothesImage.value!,
      aspectRatio: selectedStyle.value,
      // 部位选择交给AI服务使用
      parts: selectedParts.value,
    };

    // 调用AI换衣服务
    const response = await aiChangeClothesService.changeClothes(request);

    if (response.success && response.resultImage) {
      resultImage.value = response.resultImage;
      successMessage.value = "换衣成功！";
    } else {
      errorMessage.value = response.error || "换衣失败，请重试";
    }
  } catch (error) {
    console.error("生成失败:", error);
    errorMessage.value = error instanceof Error ? error.message : "未知错误";
  } finally {
    isGenerating.value = false;
  }
};

const downloadImage = () => {
  if (!resultImage.value) return;

  const link = document.createElement("a");
  link.href = resultImage.value;
  link.download = `ai-change-clothes-${Date.now()}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 清除所有数据
const clearAll = () => {
  personImage.value = null;
  clothesImage.value = null;
  resultImage.value = null;
  errorMessage.value = null;
  successMessage.value = null;

  if (personInput.value) personInput.value.value = "";
  if (clothesInput.value) clothesInput.value.value = "";
};
</script>

<style scoped>
#app {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  transition: all 0.3s ease;
}

.dark #app {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.dark .header {
  background: rgba(26, 26, 46, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  width: 32px;
  height: 32px;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #20dca1 0%, #14b8a6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.dark .title {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.clear-btn {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.clear-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-1px);
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dark .clear-btn {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.dark .clear-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.3);
}

.theme-toggle {
  background: rgba(32, 220, 161, 0.1);
  border: 1px solid rgba(32, 220, 161, 0.2);
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.theme-toggle:hover {
  background: rgba(32, 220, 161, 0.2);
  transform: scale(1.05);
}

.icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #20dca1;
}

.dark .icon {
  color: #a8edea;
}

.main {
  padding: 2rem 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.content-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.slogan-section {
  position: sticky;
  top: 2rem;
  height: fit-content;
}

.slogan-card {
  background: linear-gradient(135deg, rgba(32, 220, 161, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%);
  backdrop-filter: blur(10px);
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(32, 220, 161, 0.15);
  border: 1px solid rgba(32, 220, 161, 0.2);
  position: relative;
  overflow: hidden;
}

.slogan-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #20dca1 0%, #14b8a6 100%);
}

.dark .slogan-card {
  background: linear-gradient(135deg, rgba(168, 237, 234, 0.1) 0%, rgba(254, 214, 227, 0.1) 100%);
  border: 1px solid rgba(168, 237, 234, 0.2);
  box-shadow: 0 8px 32px rgba(168, 237, 234, 0.15);
}

.dark .slogan-card::before {
  background: linear-gradient(90deg, #a8edea 0%, #fed6e3 100%);
}

.slogan-content {
  position: relative;
  z-index: 1;
}

.slogan-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1.5rem 0;
  background: linear-gradient(135deg, #20dca1 0%, #14b8a6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
}

.dark .slogan-title {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.slogan-text {
  margin-bottom: 1.5rem;
}

.slogan-line {
  font-size: 1rem;
  line-height: 1.6;
  margin: 0.75rem 0;
  color: #4a5568;
  font-weight: 500;
  text-align: center;
}

.slogan-line.highlight {
  color: #e89d3c;
  font-weight: 700;
  font-size: 1.1rem;
  margin-top: 1rem;
}

.dark .slogan-line {
  color: #a0aec0;
}

.dark .slogan-line.highlight {
  color: #a8edea;
}

.slogan-decoration {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.decoration-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #20dca1 0%, #14b8a6 100%);
  animation: pulse 2s infinite;
}

.decoration-dot:nth-child(2) {
  animation-delay: 0.3s;
}

.decoration-dot:nth-child(3) {
  animation-delay: 0.6s;
}

.dark .decoration-dot {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.upload-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.upload-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dark .upload-card {
  background: rgba(26, 26, 46, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: #333;
}

.dark .card-title {
  color: #fff;
}

.upload-area {
  border: 2px dashed #20dca1;
  border-radius: 0.75rem;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover {
  border-color: #14b8a6;
  background: rgba(32, 220, 161, 0.05);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.upload-icon {
  width: 3rem;
  height: 3rem;
  color: #20dca1;
  opacity: 0.7;
}

.upload-hint {
  font-size: 0.875rem;
  color: #666;
  margin: 0;
}

.dark .upload-hint {
  color: #ccc;
}

.image-preview {
  position: relative;
  width: 100%;
  height: 200px;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.5rem;
}

.remove-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(255, 0, 0, 0.8);
  border: none;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.remove-btn:hover {
  background: rgba(255, 0, 0, 1);
  transform: scale(1.1);
}

.remove-btn .icon {
  color: white;
  width: 1rem;
  height: 1rem;
}

.controls-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.dark .controls-section {
  background: rgba(26, 26, 46, 0.9);
}

.style-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.part-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.control-label {
  font-weight: 600;
  color: #333;
}

.dark .control-label {
  color: #fff;
}

.style-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.part-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.style-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #20dca1;
  background: transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #20dca1;
  font-size: 0.875rem;
  position: relative;
}

.style-btn:hover {
  background: rgba(32, 220, 161, 0.1);
  transform: translateY(-1px);
}

.style-btn.active {
  background: linear-gradient(135deg, #20dca1 0%, #14b8a6 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(32, 220, 161, 0.3);
}

.part-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #22c55e;
  background: transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #16a34a;
  font-size: 0.875rem;
}

.part-btn:hover {
  background: rgba(34, 197, 94, 0.1);
}

.part-btn.active {
  background: #22c55e;
  color: white;
  border-color: transparent;
}

.dark .style-btn {
  border-color: #a8edea;
  color: #a8edea;
}

.dark .style-btn:hover {
  background: rgba(168, 237, 234, 0.1);
}

.dark .style-btn.active {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #0f172a;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(168, 237, 234, 0.3);
}

.generate-btn {
  background: linear-gradient(135deg, #20dca1 0%, #14b8a6 100%);
  border: none;
  border-radius: 0.75rem;
  padding: 1rem 2rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(32, 220, 161, 0.3);
}

.generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.generate-btn .icon {
  color: white;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.message-section {
  margin: 1rem 0;
}

.message-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 500;
  animation: slideIn 0.3s ease-out;
}

.message-card.success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: #059669;
}

.message-card.error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #dc2626;
}

.dark .message-card.success {
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #10b981;
}

.dark .message-card.error {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.message-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  margin-left: auto;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.dark .close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.close-btn .icon {
  width: 1rem;
  height: 1rem;
}

.result-section {
  margin-top: 2rem;
}

.result-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dark .result-card {
  background: rgba(26, 26, 46, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.result-image {
  position: relative;
  border-radius: 0.75rem;
  overflow: hidden;
}

.result-image img {
  width: 100%;
  height: auto;
  display: block;
}

.result-overlay {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.download-btn {
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.download-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(1.05);
}

.download-btn .icon {
  color: white;
  width: 1rem;
  height: 1rem;
}

@media (max-width: 768px) {
  .content-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .slogan-section {
    position: static;
    order: -1;
  }

  .slogan-card {
    padding: 1.5rem;
  }

  .slogan-title {
    font-size: 1.25rem;
  }

  .slogan-line {
    font-size: 0.9rem;
  }

  .slogan-line.highlight {
    font-size: 1rem;
  }

  .upload-section {
    grid-template-columns: 1fr;
  }

  .controls-section {
    flex-direction: column;
    gap: 1rem;
  }

  .style-controls {
    flex-direction: column;
    align-items: flex-start;
  }

  .style-buttons {
    width: 100%;
    justify-content: space-between;
  }

  .style-btn {
    flex: 1;
    min-width: calc(50% - 0.25rem);
  }

  .header-content {
    padding: 0 1rem;
  }

  .container {
    padding: 0 1rem;
  }

  .title {
    font-size: 1.5rem;
  }
}
</style>
