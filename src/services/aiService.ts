// AI换衣服务模块
export interface ChangeClothesRequest {
  personImage: string; // base64编码的人物图像
  clothesImage: string; // base64编码的服装图像
  aspectRatio: string; // 风格选择 (original, sketch, chibi, cartoon, etc.)
  parts?: string[]; // 需要处理的部位
}

export interface ChangeClothesResponse {
  success: boolean;
  resultImage?: string; // base64编码的结果图像
  error?: string;
}

export class AIChangeClothesService {
  private apiUrl: string;

  constructor(apiUrl: string = "") {
    this.apiUrl = apiUrl;
  }

  // 调用AI换衣API
  async changeClothes(request: ChangeClothesRequest): Promise<ChangeClothesResponse> {
    try {
      const personCheck = this.validateImage(request.personImage);
      if (!personCheck.valid) {
        return { success: false, error: personCheck.error };
      }
      const clothesCheck = this.validateImage(request.clothesImage);
      if (!clothesCheck.valid) {
        return { success: false, error: clothesCheck.error };
      }

      // 根据风格生成不同的提示词
      const getStylePrompt = (style: string) => {
        const basePrompt = `将第一张图片（人物图像）中的人物替换为第二张图片（服装图像）中的服饰，注意：必须保持第一张图片人物的发型、脸型、身材比例不变，只能更换服装部分`;

        switch (style) {
          case "sketch":
            return `${basePrompt}，并将结果转换为手绘素描风格，黑白线条，简洁明快`;
          case "original":
          default:
            return `${basePrompt}，保持原图风格和质感`;
        }
      };

      const resp = await generateSeedreamImageDirect({
        prompt: getStylePrompt(request.aspectRatio),
        size: "2K",
        response_format: "b64_json",
        sequential_image_generation: "disabled",
        stream: false,
        watermark: false,
        image: [request.personImage, request.clothesImage],
      });

      const first = resp?.data?.[0];
      if (!first?.b64_json) {
        return { success: false, error: "生成失败，返回数据为空" };
      }
      const dataUrl = `data:image/png;base64,${first.b64_json}`;
      return { success: true, resultImage: dataUrl };
    } catch (error) {
      console.error("AI换衣服务错误:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  // 模拟换衣处理（实际项目中应该替换为真实的API调用）
  private async simulateChangeClothes(
    request: ChangeClothesRequest
  ): Promise<ChangeClothesResponse> {
    // 模拟处理时间（根据风格不同，处理时间略有差异）
    const processingTime = request.aspectRatio === "original" ? 2000 : 3000;
    await new Promise((resolve) => setTimeout(resolve, processingTime));

    // 模拟成功返回人物图像（实际应该是AI处理后的结果）
    // 注意：这里只是模拟，实际的AI服务应该根据aspectRatio参数应用不同的风格
    return {
      success: true,
      resultImage: request.personImage,
    };
  }

  // 验证图像格式和大小
  validateImage(imageData: string): { valid: boolean; error?: string } {
    if (!imageData) {
      return { valid: false, error: "图像数据为空" };
    }

    // 检查是否为有效的base64图像
    if (!imageData.startsWith("data:image/")) {
      return { valid: false, error: "无效的图像格式" };
    }

    // 检查图像大小（base64编码会增加约33%的大小）
    const sizeInBytes = (imageData.length * 3) / 4;
    const maxSizeInMB = 10; // 最大10MB

    if (sizeInBytes > maxSizeInMB * 1024 * 1024) {
      return { valid: false, error: `图像大小超过${maxSizeInMB}MB限制` };
    }

    return { valid: true };
  }

  // 压缩图像（可选功能）
  async compressImage(imageData: string, quality: number = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("无法创建画布上下文"));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("图像压缩失败"));
              return;
            }

            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("读取压缩图像失败"));
            reader.readAsDataURL(blob);
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => reject(new Error("加载图像失败"));
      img.src = imageData;
    });
  }
}

// 导出单例实例
export const aiChangeClothesService = new AIChangeClothesService();

// ===== Doubao Seedream 图像生成（前端直连）=====
export type SeedreamSize = "2K" | "1024x1024" | "512x512";

export interface GenerateSeedreamParams {
  prompt: string;
  size?: SeedreamSize;
  model?: string;
  sequential_image_generation?: "disabled" | "enabled";
  response_format?: "url" | "b64_json";
  stream?: boolean;
  watermark?: boolean;
  image?: string | string[];
}

export async function generateSeedreamImageDirect(params: GenerateSeedreamParams): Promise<{
  model: string;
  created: number;
  data: { url?: string; b64_json?: string; size?: string }[];
}> {
  const body = {
    model: params.model ?? "doubao-seedream-4-0-250828",
    prompt: params.prompt,
    size: params.size ?? "2K",
    sequential_image_generation: params.sequential_image_generation ?? "disabled",
    response_format: params.response_format ?? "url",
    stream: params.stream ?? false,
    watermark: params.watermark ?? true,
    image: params.image,
  } as any;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 100000);
  try {
    const r = await fetch("/api/seedream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(`生成失败: ${r.status}`);
    return (await r.json()) as any;
  } finally {
    clearTimeout(timer);
  }
}
