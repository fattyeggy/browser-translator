#!/usr/bin/env python3
"""
验证双语翻译助手扩展框架是否正确搭建
"""

import os
import json
import sys

REQUIRED_FILES = [
    "manifest.json",
    "background.js",
    "content.js",
    "popup.html",
    "popup.css",
    "popup.js",
    "options.html",
    "options.js",
    "icons/icon16.png",
    "icons/icon32.png",
    "icons/icon48.png",
    "icons/icon128.png"
]

def check_files_exist():
    """检查所有必需文件是否存在"""
    print("检查文件完整性...")
    all_exist = True
    
    for filepath in REQUIRED_FILES:
        full_path = os.path.join(os.path.dirname(__file__), filepath)
        if os.path.exists(full_path):
            print(f"  ✓ {filepath}")
        else:
            print(f"  ✗ {filepath} (缺失)")
            all_exist = False
    
    return all_exist

def validate_manifest():
    """验证 manifest.json 格式"""
    print("\n验证 manifest.json...")
    manifest_path = os.path.join(os.path.dirname(__file__), "manifest.json")
    
    try:
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
        
        # 检查必需字段
        required_fields = ["manifest_version", "name", "version", "permissions", "action", "background", "content_scripts"]
        for field in required_fields:
            if field not in manifest:
                print(f"  ✗ 缺少必需字段: {field}")
                return False
        
        # 检查 manifest_version 应为 3
        if manifest.get("manifest_version") != 3:
            print(f"  ✗ manifest_version 应为 3，实际为 {manifest.get('manifest_version')}")
            return False
        
        # 检查名称和版本
        if manifest.get("name") != "双语翻译助手":
            print(f"  ✗ 扩展名称应为 '双语翻译助手'，实际为 {manifest.get('name')}")
        
        if manifest.get("version") != "1.0.0":
            print(f"  ✗ 版本号应为 '1.0.0'，实际为 {manifest.get('version')}")
        
        # 检查权限
        required_permissions = ["storage", "activeTab", "scripting"]
        permissions = manifest.get("permissions", [])
        for perm in required_permissions:
            if perm not in permissions:
                print(f"  ✗ 缺少权限: {perm}")
                return False
        
        print("  ✓ manifest.json 格式正确")
        return True
        
    except json.JSONDecodeError as e:
        print(f"  ✗ JSON 解析错误: {e}")
        return False
    except Exception as e:
        print(f"  ✗ 验证失败: {e}")
        return False

def check_file_sizes():
    """检查文件大小（非空）"""
    print("\n检查文件大小...")
    
    files_to_check = [
        "background.js",
        "content.js",
        "popup.js",
        "popup.css",
        "popup.html"
    ]
    
    all_good = True
    for filename in files_to_check:
        filepath = os.path.join(os.path.dirname(__file__), filename)
        size = os.path.getsize(filepath)
        if size < 100:  # 小于100字节可能有问题
            print(f"  ⚠ {filename} 文件较小 ({size} 字节)")
            all_good = False
        else:
            print(f"  ✓ {filename} ({size} 字节)")
    
    return all_good

def check_icon_files():
    """检查图标文件"""
    print("\n检查图标文件...")
    
    icon_sizes = [16, 32, 48, 128]
    all_good = True
    
    for size in icon_sizes:
        filename = f"icons/icon{size}.png"
        filepath = os.path.join(os.path.dirname(__file__), filename)
        
        if not os.path.exists(filepath):
            print(f"  ✗ {filename} 不存在")
            all_good = False
            continue
        
        # 简单检查文件大小
        size_bytes = os.path.getsize(filepath)
        if size_bytes < 100:
            print(f"  ⚠ {filename} 可能损坏 ({size_bytes} 字节)")
            all_good = False
        else:
            print(f"  ✓ {filename} ({size_bytes} 字节)")
    
    return all_good

def main():
    """主验证函数"""
    print("=" * 50)
    print("双语翻译助手扩展框架验证")
    print("=" * 50)
    
    results = []
    
    # 检查文件存在性
    results.append(("文件完整性", check_files_exist()))
    
    # 验证 manifest
    results.append(("manifest.json", validate_manifest()))
    
    # 检查文件大小
    results.append(("文件大小", check_file_sizes()))
    
    # 检查图标
    results.append(("图标文件", check_icon_files()))
    
    # 总结
    print("\n" + "=" * 50)
    print("验证结果:")
    print("=" * 50)
    
    all_passed = True
    for name, passed in results:
        status = "✓ 通过" if passed else "✗ 失败"
        print(f"{name}: {status}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("✅ 所有检查通过！扩展框架已正确搭建。")
        print("\n下一步:")
        print("1. 打开 Chrome，访问 chrome://extensions/")
        print("2. 开启开发者模式")
        print("3. 点击'加载已解压的扩展程序'")
        print("4. 选择本项目目录")
        return 0
    else:
        print("❌ 部分检查未通过，请修复上述问题。")
        return 1

if __name__ == "__main__":
    sys.exit(main())