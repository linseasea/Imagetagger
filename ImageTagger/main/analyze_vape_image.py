#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
电子烟图片分析工具
从配置文件读取API密钥和模型信息，从系统提示词文件读取提示词，
分析指定的电子烟图片并生成标准化描述
"""

import os
import sys
import base64
from pathlib import Path
from openai import OpenAI

def read_config():
    """
    从配置文件读取API密钥、模型名称和baseUrl
    """
    try:
        # 配置文件路径
        config_path = Path(__file__).resolve().parent / "config" / "filepath.conf"
        
        if not config_path.exists():
            print(f"错误: 配置文件不存在: {config_path}")
            return None
        
        # 读取配置
        config = {}
        with open(config_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    try:
                        key, value = line.split('=', 1)
                        config[key.strip()] = value.strip()
                    except ValueError:
                        continue
        
        # 检查必要的配置
        required_keys = ['Api-key', 'modelName', 'baseUrl']
        for key in required_keys:
            if key not in config:
                print(f"错误: 配置文件缺少必要的配置项: {key}")
                return None
        
        print(f"已读取配置: API Key = {config['Api-key'][:5]}..., 模型 = {config['modelName']}, baseUrl = {config['baseUrl']}")
        return config
    
    except Exception as e:
        print(f"读取配置文件时出错: {e}")
        return None

def read_system_prompt():
    """
    读取系统提示词文件
    """
    try:
        # 系统提示词文件路径
        prompt_path = Path(__file__).resolve().parent / "config" / "systemPrompt.txt"
        
        if not prompt_path.exists():
            print(f"错误: 系统提示词文件不存在: {prompt_path}")
            return None
        
        # 读取内容
        with open(prompt_path, 'r', encoding='utf-8') as f:
            system_prompt = f.read().strip()
        
        print(f"已读取系统提示词 ({len(system_prompt)} 字符)")
        return system_prompt
    
    except Exception as e:
        print(f"读取系统提示词文件时出错: {e}")
        return None

def encode_image(image_path):
    """
    将图片转换为base64编码
    """
    try:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")
    except Exception as e:
        print(f"转换图片时出错: {e}")
        return None

def analyze_image(image_path, api_key, model_name, base_url, system_prompt):
    """
    分析图片并返回中英双语描述，用--分隔
    """
    try:
        # 检查图片是否存在
        if not os.path.exists(image_path):
            print(f"错误: 图片不存在: {image_path}")
            return None
        
        # 获取图片格式
        image_extension = os.path.splitext(image_path)[1].lower()
        # 默认设置为jpg，如果是其他格式则相应调整
        image_format = "jpeg" if image_extension in ['.jpg', '.jpeg'] else "png"
        
        # 转换图片为base64
        import threading
        thread_id = threading.get_ident()
        print(f"正在处理图片 [线程 {thread_id}]: {image_path}")
        base64_image = encode_image(image_path)
        if not base64_image:
            return None
        
        # 创建OpenAI客户端
        client = OpenAI(
            api_key=api_key,
            base_url=base_url
        )
        
        # 创建请求
        print(f"正在发送请求到模型 [线程 {thread_id}]: {model_name}")
        completion = client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "system",
                    "content": [{"type": "text", "text": system_prompt}]
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/{image_format};base64,{base64_image}"}
                        },
                        {"type": "text", "text": "分析这个电子烟产品图片并生成中英双语标准化描述"}
                    ]
                }
            ]
        )
        
        # 解析响应
        result = completion.choices[0].message.content
        print(f"AI分析完成 [线程 {thread_id}]: {image_path}")
        
        # 检查结果是否包含分隔符
        if "--" not in result:
            # 如果模型没有遵循指令，尝试自动添加分隔符和翻译
            print("警告: AI返回结果没有包含中英文分隔符，尝试添加...")
            # 判断返回的是中文还是英文(简单判断)
            if any(u'\u4e00' <= c <= u'\u9fff' for c in result):
                # 如果包含中文字符，假设是中文结果
                translated_prompt = f"请将以下中文描述翻译成英文，保持相同的格式和风格:\n\n{result}"
                try:
                    translation = client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {"role": "system", "content": "你是一个专业翻译。"},
                            {"role": "user", "content": translated_prompt}
                        ]
                    )
                    english_result = translation.choices[0].message.content
                    result = f"{result}\n--\n{english_result}"
                except Exception as e:
                    print(f"翻译失败: {e}")
                    result = f"{result}\n--\n[English translation unavailable]"
            else:
                # 如果不包含中文字符，假设是英文结果
                translated_prompt = f"请将以下英文描述翻译成中文，保持相同的格式和风格:\n\n{result}"
                try:
                    translation = client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {"role": "system", "content": "你是一个专业翻译。"},
                            {"role": "user", "content": translated_prompt}
                        ]
                    )
                    chinese_result = translation.choices[0].message.content
                    result = f"{chinese_result}\n--\n{result}"
                except Exception as e:
                    print(f"翻译失败: {e}")
                    result = f"[中文翻译不可用]\n--\n{result}"
                    
        return result
    
    except Exception as e:
        print(f"分析图片时出错: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """
    主函数
    """
    # 检查命令行参数
    if len(sys.argv) < 2:
        print("\n电子烟图片分析工具")
        print("=====================================================")
        print("用法: python analyze_vape_image.py <图片路径> [线程数]")
        print("例如: python analyze_vape_image.py /path/to/vape.jpg")
        print("     python analyze_vape_image.py /path/to/vape.jpg 4")
        print("=====================================================")
        print("线程数参数只对批处理有效，单张图片分析忽略此参数")
        print("=====================================================")
        return
    
    # 获取图片路径
    image_path = sys.argv[1]
    
    # 获取线程数参数（如果提供）
    thread_count = 4  # 默认线程数
    if len(sys.argv) > 2:
        try:
            thread_count = int(sys.argv[2])
            if thread_count < 1:
                thread_count = 1
            elif thread_count > 20:
                thread_count = 20
            print(f"设置线程数为: {thread_count}")
        except:
            print(f"无效的线程数参数，使用默认值: {thread_count}")
    
    # 读取配置和系统提示词
    config = read_config()
    if not config:
        return
    
    system_prompt = read_system_prompt()
    if not system_prompt:
        return
    
    # 分析图片
    result = analyze_image(
        image_path, 
        config['Api-key'], 
        config['modelName'], 
        config['baseUrl'], 
        system_prompt
    )
    
    # 输出结果
    if result:
        print("\n分析结果:")
        print("=====================================================")
        print(result)
        print("=====================================================")
        
        # 保存结果到文件
        output_dir = Path("results")
        output_dir.mkdir(exist_ok=True)
        
        image_name = os.path.basename(image_path).split('.')[0]
        output_file = output_dir / f"{image_name}_analysis.txt"
        
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(result)
        
        print(f"\n结果已保存到: {output_file}")

if __name__ == "__main__":
    main() 