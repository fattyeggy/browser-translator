#!/usr/bin/env python3
"""
生成双语翻译助手的图标文件
"""

from PIL import Image, ImageDraw, ImageFont
import os

# 图标尺寸
SIZES = [16, 32, 48, 128]

# 颜色
PRIMARY_COLOR = (102, 126, 234)  # #667eea
SECONDARY_COLOR = (118, 75, 162)  # #764ba2
WHITE = (255, 255, 255)

def create_icon(size):
    """创建指定尺寸的图标"""
    # 创建图像
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 绘制背景（圆角矩形）
    radius = size // 5
    draw.rounded_rectangle([(0, 0), (size-1, size-1)], radius=radius, fill=PRIMARY_COLOR)
    
    # 绘制装饰圆点
    dot_size = max(2, size // 32)
    if size >= 32:
        # 左上角圆点
        draw.ellipse([(size//8, size//8), (size//8 + dot_size*2, size//8 + dot_size*2)], fill=WHITE + (200,))
        # 右下角圆点
        draw.ellipse([(size - size//8 - dot_size*2, size - size//8 - dot_size*2), 
                     (size - size//8, size - size//8)], fill=WHITE + (200,))
    
    # 绘制文字和箭头（仅在尺寸足够大时）
    if size >= 32:
        try:
            # 尝试加载字体
            font_size = max(12, size // 4)
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
            
            # 上方文字
            text = "文"
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            text_x = (size - text_width) // 2
            text_y = size // 3 - text_height // 2
            draw.text((text_x, text_y), text, fill=WHITE, font=font)
            
            # 下方文字
            text = "A"
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            text_x = (size - text_width) // 2
            text_y = size * 2 // 3 - text_height // 2
            draw.text((text_x, text_y), text, fill=WHITE, font=font)
            
            # 绘制箭头（简单三角形）
            arrow_size = max(4, size // 16)
            arrow_y = size // 2
            points = [
                (size//2 - arrow_size, arrow_y - arrow_size//2),
                (size//2 + arrow_size, arrow_y - arrow_size//2),
                (size//2, arrow_y + arrow_size//2)
            ]
            draw.polygon(points, fill=WHITE)
            
        except Exception as e:
            print(f"字体加载失败，使用简单图形: {e}")
            # 绘制简单的图形
            center = size // 2
            draw.ellipse([(center - size//8, center - size//8), 
                         (center + size//8, center + size//8)], fill=WHITE)
    elif size == 16:
        # 16x16 小图标：只绘制一个简单的翻译符号
        center = size // 2
        draw.ellipse([(center - 3, center - 3), (center + 3, center + 3)], fill=WHITE)
    
    return img

def main():
    """生成所有尺寸的图标"""
    print("正在生成双语翻译助手图标...")
    
    for size in SIZES:
        filename = f"icon{size}.png"
        filepath = os.path.join(os.path.dirname(__file__), filename)
        
        try:
            icon = create_icon(size)
            icon.save(filepath, "PNG")
            print(f"  ✓ 生成 {filename} ({size}x{size})")
        except Exception as e:
            print(f"  ✗ 生成 {filename} 失败: {e}")
    
    print("图标生成完成！")

if __name__ == "__main__":
    main()