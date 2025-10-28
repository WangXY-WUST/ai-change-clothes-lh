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
      // 这里应该调用实际的AI换衣API
      // 目前返回模拟数据
      return await this.simulateChangeClothes(request);
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
