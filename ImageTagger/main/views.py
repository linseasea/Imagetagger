from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
import json
import os
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import logging
from . import analyze_vape_image

# Create your views here.
def index(request):
    """主页视图函数"""
    return render(request, 'index.html')

def get_directory_info(directory_path):
    """
    获取目录信息，包括文件列表和数量
    
    Args:
        directory_path (str): 目录路径
        
    Returns:
        dict: 包含文件列表和数量的字典
    """
    try:
        # 确保目录存在
        if not os.path.exists(directory_path):
            return {
                'exists': False,
                'is_dir': False,
                'files': [],
                'count': 0,
                'error': f'路径不存在: {directory_path}'
            }
        
        # 检查是否是目录
        if not os.path.isdir(directory_path):
            return {
                'exists': True,
                'is_dir': False,
                'files': [],
                'count': 0,
                'error': f'路径不是目录: {directory_path}'
            }
        
        # 获取目录中的文件列表
        files = []
        for file_name in os.listdir(directory_path):
            file_path = os.path.join(directory_path, file_name)
            if os.path.isfile(file_path):  # 只包含文件，不包含子目录
                files.append({
                    'name': file_name,
                    'path': file_path,
                    'size': os.path.getsize(file_path),
                    'modified': os.path.getmtime(file_path)
                })
        
        # 返回目录信息
        return {
            'exists': True,
            'is_dir': True,
            'files': files,
            'count': len(files),
            'error': None
        }
    except Exception as e:
        return {
            'exists': False,
            'is_dir': False,
            'files': [],
            'count': 0,
            'error': str(e)
        }

@csrf_exempt
def load_config(request):
    """加载配置文件的视图函数"""
    if request.method == 'POST':
        try:
            # 解析请求体中的JSON数据
            data = json.loads(request.body)
            config_path = data.get('configPath')
            
            # 相对于项目根目录的安全路径处理
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            if not config_path.startswith('/'):  # 如果是相对路径
                config_path = os.path.join(base_dir, '..', config_path)
            
            # 检查配置文件是否存在
            if not os.path.exists(config_path):
                # 尝试创建配置文件目录
                try:
                    os.makedirs(os.path.dirname(config_path), exist_ok=True)
                    # 如果文件不存在但成功创建了目录，返回空配置
                    return JsonResponse({
                        'success': True,
                        'config': {
                            'imagePath': '',
                            'cnFilePath': '',
                            'enFilePath': ''
                        },
                        'message': '配置文件不存在，但已创建目录，将使用默认空配置'
                    })
                except Exception as dir_err:
                    return JsonResponse({
                        'success': False, 
                        'message': f'配置文件不存在且无法创建目录: {str(dir_err)}'
                    })
            
            # 读取配置文件内容
            config = {}
            with open(config_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        try:
                            key, value = line.split('=', 1)
                            config[key.strip()] = value.strip()
                        except ValueError:
                            # 忽略格式不正确的行
                            pass
            
            # 构建返回数据
            return JsonResponse({
                'success': True,
                'config': {
                    'imagePath': config.get('imagePath', ''),
                    'cnFilePath': config.get('cnFilePath', ''),
                    'enFilePath': config.get('enFilePath', '')
                }
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            })
    
    return JsonResponse({'success': False, 'message': '仅支持POST请求'})

@csrf_exempt
def save_config(request):
    """保存配置文件的视图函数，并返回各个路径中的文件信息"""
    if request.method == 'POST':
        try:
            # 解析请求体中的JSON数据
            data = json.loads(request.body)
            config_path = data.get('configPath')
            config = data.get('config', {})
            
            # 相对于项目根目录的安全路径处理
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            if not config_path.startswith('/'):  # 如果是相对路径
                config_path = os.path.join(base_dir, '..', config_path)
            
            # 确保目录存在
            os.makedirs(os.path.dirname(config_path), exist_ok=True)
            
            # 写入配置文件
            with open(config_path, 'w') as f:
                f.write("# ImageTagger Configuration File\n")
                if 'imagePath' in config and config['imagePath']:
                    f.write(f"imagePath={config['imagePath']}\n")
                if 'cnFilePath' in config and config['cnFilePath']:
                    f.write(f"cnFilePath={config['cnFilePath']}\n")
                if 'enFilePath' in config and config['enFilePath']:
                    f.write(f"enFilePath={config['enFilePath']}\n")
            
            # 获取各个路径的目录信息
            directories_info = {}
            
            # 获取图片目录信息
            if 'imagePath' in config and config['imagePath']:
                image_path = config['imagePath']
                # 确保路径是绝对路径
                if not os.path.isabs(image_path):
                    image_path = os.path.join(base_dir, '..', image_path)
                directories_info['images'] = get_directory_info(image_path)
            
            # 获取中文文件目录信息
            if 'cnFilePath' in config and config['cnFilePath']:
                cn_path = config['cnFilePath']
                # 确保路径是绝对路径
                if not os.path.isabs(cn_path):
                    cn_path = os.path.join(base_dir, '..', cn_path)
                directories_info['cnFiles'] = get_directory_info(cn_path)
            
            # 获取英文文件目录信息
            if 'enFilePath' in config and config['enFilePath']:
                en_path = config['enFilePath']
                # 确保路径是绝对路径
                if not os.path.isabs(en_path):
                    en_path = os.path.join(base_dir, '..', en_path)
                directories_info['enFiles'] = get_directory_info(en_path)
            
            # 返回配置保存成功和目录信息
            return JsonResponse({
                'success': True,
                'message': f'配置已成功保存到 {config_path}',
                'directories': directories_info
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            })
    
    return JsonResponse({'success': False, 'message': '仅支持POST请求'})

@csrf_exempt
def read_text_file(request):
    """读取文本文件内容的视图函数"""
    if request.method == 'GET':
        try:
            # 获取文件路径参数
            file_path = request.GET.get('path')
            if not file_path:
                return HttpResponse('未提供文件路径参数', status=400)
            
            # 相对于项目根目录的安全路径处理
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            if not file_path.startswith('/'):  # 如果是相对路径
                file_path = os.path.join(base_dir, '..', file_path)
            
            # 检查文件是否存在
            if not os.path.exists(file_path):
                return HttpResponse(f'文件不存在: {file_path}', status=404)
            
            # 检查是否是文件
            if not os.path.isfile(file_path):
                return HttpResponse(f'路径不是文件: {file_path}', status=400)
            
            # 读取文件内容
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 返回文件内容
            return HttpResponse(content, content_type='text/plain; charset=utf-8')
        except Exception as e:
            return HttpResponse(f'读取文件出错: {str(e)}', status=500)
    
    return HttpResponse('仅支持GET请求', status=405)

@csrf_exempt
def serve_image(request):
    """提供图片文件服务的视图函数"""
    if request.method == 'GET':
        try:
            # 获取图片文件路径参数
            image_path = request.GET.get('path')
            if not image_path:
                return HttpResponse('未提供图片路径参数', status=400)
            
            # 相对于项目根目录的安全路径处理
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            if not image_path.startswith('/'):  # 如果是相对路径
                image_path = os.path.join(base_dir, '..', image_path)
            
            # 检查文件是否存在
            if not os.path.exists(image_path):
                return HttpResponse(f'图片文件不存在: {image_path}', status=404)
            
            # 检查是否是文件
            if not os.path.isfile(image_path):
                return HttpResponse(f'路径不是文件: {image_path}', status=400)
            
            # 获取文件类型
            import mimetypes
            content_type = mimetypes.guess_type(image_path)[0]
            if not content_type:
                content_type = 'application/octet-stream'
            
            # 读取图片文件内容
            with open(image_path, 'rb') as f:
                return HttpResponse(f.read(), content_type=content_type)
        except Exception as e:
            return HttpResponse(f'读取图片文件出错: {str(e)}', status=500)
    
    return HttpResponse('仅支持GET请求', status=405)

@csrf_exempt
def create_text_file(request):
    """创建与图片对应的文本文件"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            image_name = data.get('image_name')
            cn_path = data.get('cn_path')
            en_path = data.get('en_path')
            
            if not image_name:
                return JsonResponse({'success': False, 'message': '缺少图片名称参数'})
            
            # 处理文件名 - 移除扩展名并获取基本名称
            base_name = os.path.splitext(image_name)[0]
            result = {'success': True, 'created_files': []}
            
            # 尝试创建中文文件
            if cn_path:
                cn_file_path = os.path.join(cn_path, f"{base_name}.txt")
                
                # 检查目录是否存在，不存在则创建
                os.makedirs(os.path.dirname(cn_file_path), exist_ok=True)
                
                # 如果文件不存在，则创建空白文件
                if not os.path.exists(cn_file_path):
                    with open(cn_file_path, 'w', encoding='utf-8') as f:
                        # 创建空白文件，不写入任何内容
                        pass
                    result['created_files'].append({'type': 'cn', 'path': cn_file_path})
                else:
                    result['created_files'].append({'type': 'cn', 'path': cn_file_path, 'note': '文件已存在'})
            
            # 尝试创建英文文件
            if en_path:
                en_file_path = os.path.join(en_path, f"{base_name}.txt")
                
                # 检查目录是否存在，不存在则创建
                os.makedirs(os.path.dirname(en_file_path), exist_ok=True)
                
                # 如果文件不存在，则创建空白文件
                if not os.path.exists(en_file_path):
                    with open(en_file_path, 'w', encoding='utf-8') as f:
                        # 创建空白文件，不写入任何内容
                        pass
                    result['created_files'].append({'type': 'en', 'path': en_file_path})
                else:
                    result['created_files'].append({'type': 'en', 'path': en_file_path, 'note': '文件已存在'})
            
            # 如果没有创建任何文件，返回警告
            if not result['created_files']:
                result['success'] = False
                result['message'] = '未指定有效的文件路径，无法创建文件'
            
            return JsonResponse(result)
        except Exception as e:
            return JsonResponse({'success': False, 'message': f'创建文本文件出错: {str(e)}'})
    
    return JsonResponse({'success': False, 'message': '只支持POST请求'}, status=405)

@csrf_exempt
def save_settings(request):
    """
    处理保存设置请求，保存到filepath.conf文件中，
    并将系统提示词单独保存到systemPrompt.txt文件中
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': '方法不允许'}, status=405)

    try:
        # 获取POST请求的JSON数据
        data = json.loads(request.body)
        image_path = data.get('image_path', '')
        cn_file_path = data.get('cn_file_path', '')
        en_file_path = data.get('en_file_path', '')
        base_url = data.get('base_url', '')
        model_name = data.get('model_name', '')
        system_prompt = data.get('system_prompt', '')
        api_key = data.get('api_key', '')
        thread_count = data.get('thread_count', 4)
        
        # 验证线程数范围
        try:
            thread_count = int(thread_count)
            if thread_count < 1:
                thread_count = 1
            elif thread_count > 20:
                thread_count = 20
        except (TypeError, ValueError):
            thread_count = 4  # 转换失败使用默认值
        
        # 使用Django的BASE_DIR确定正确的配置文件路径
        config_path = os.path.join(settings.BASE_DIR, 'main', 'config', 'filepath.conf')
        prompt_path = os.path.join(settings.BASE_DIR, 'main', 'config', 'systemPrompt.txt')
        
        print(f"准备保存配置到: {config_path}")
        print(f"准备保存系统提示词到: {prompt_path}")
        
        # 创建配置目录（如果不存在）
        os.makedirs(os.path.dirname(config_path), exist_ok=True)
        
        # 保存配置到filepath.conf文件（不包含系统提示词）
        with open(config_path, 'w', encoding='utf-8') as f:
            f.write("# ImageTagger Configuration File\n")
            if image_path:
                f.write(f"imagePath={image_path}\n")
            if cn_file_path:
                f.write(f"cnFilePath={cn_file_path}\n")
            if en_file_path:
                f.write(f"enFilePath={en_file_path}\n")
            if base_url:
                f.write(f"baseUrl={base_url}\n")
            if model_name:
                f.write(f"modelName={model_name}\n")
            if api_key:
                f.write(f"Api-key={api_key}\n")
            # 保存线程数
            f.write(f"threadCount={thread_count}\n")
        
        # 单独保存系统提示词到systemPrompt.txt文件
        with open(prompt_path, 'w', encoding='utf-8') as f:
            f.write(system_prompt)
                
        # 打印实际保存路径（调试用）
        print(f"Settings saved to {config_path}")
        print(f"System prompt saved to {prompt_path}")
        
        # 获取各个路径的目录信息
        directories_info = {}
        
        # 获取目录信息
        image_files = []
        cn_files = []
        en_files = []
        
        # 如果存在图片目录，则读取其中的文件
        if image_path and os.path.exists(image_path) and os.path.isdir(image_path):
            for filename in os.listdir(image_path):
                file_path = os.path.join(image_path, filename)
                if os.path.isfile(file_path) and is_image_file(filename):
                    image_files.append({
                        'name': filename,
                        'path': file_path,
                        'is_file': True
                    })
        
        # 如果存在中文文件目录，则读取其中的文件
        if cn_file_path and os.path.exists(cn_file_path) and os.path.isdir(cn_file_path):
            for filename in os.listdir(cn_file_path):
                file_path = os.path.join(cn_file_path, filename)
                if os.path.isfile(file_path) and filename.endswith('.txt'):
                    cn_files.append({
                        'name': filename,
                        'path': file_path,
                        'is_file': True
                    })
        
        # 如果存在英文文件目录，则读取其中的文件
        if en_file_path and os.path.exists(en_file_path) and os.path.isdir(en_file_path):
            for filename in os.listdir(en_file_path):
                file_path = os.path.join(en_file_path, filename)
                if os.path.isfile(file_path) and filename.endswith('.txt'):
                    en_files.append({
                        'name': filename,
                        'path': file_path,
                        'is_file': True
                    })
        
        # 返回保存成功和目录信息
        return JsonResponse({
            'success': True,
            'message': '设置保存成功',
            'image_path': image_path,
            'cn_file_path': cn_file_path,
            'en_file_path': en_file_path,
            'base_url': base_url,
            'model_name': model_name,
            'system_prompt': system_prompt,
            'api_key': api_key,
            'thread_count': thread_count,
            'image_files': image_files,
            'cn_files': cn_files,
            'en_files': en_files
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'设置保存失败: {str(e)}'
        }, status=500)

@csrf_exempt
def get_directories(request):
    """
    获取图片和文本文件目录信息，从filepath.conf文件读取设置
    并从systemPrompt.txt文件读取系统提示词
    """
    try:
        # 尝试读取配置文件 - 使用Django的BASE_DIR确定正确的路径
        config_file = os.path.join(settings.BASE_DIR, 'main', 'config', 'filepath.conf')
        prompt_file = os.path.join(settings.BASE_DIR, 'main', 'config', 'systemPrompt.txt')
        
        print(f"尝试读取配置文件: {config_file}")
        print(f"尝试读取系统提示词文件: {prompt_file}")
        
        settings_data = {}
        system_prompt = ""
        
        # 读取配置文件
        if os.path.exists(config_file):
            print(f"配置文件存在: {config_file}")
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    print(f"成功读取配置文件内容, 长度: {len(content)} 字节")
                    
                    for line in content.splitlines():
                        line = line.strip()
                        if line and not line.startswith('#'):
                            try:
                                key, value = line.split('=', 1)
                                key = key.strip()
                                value = value.strip()
                                settings_data[key] = value
                                print(f"读取配置项: {key}={value[:20]}{'...' if len(value) > 20 else ''}")
                            except ValueError:
                                # 忽略格式不正确的行
                                print(f"忽略格式不正确的行: {line}")
            except Exception as e:
                print(f"读取配置文件时出错: {str(e)}")
                return JsonResponse({'error': f"读取配置文件时出错: {str(e)}"}, status=500)
        else:
            print(f"配置文件不存在: {config_file}")
            # 创建一个空的配置文件
            try:
                os.makedirs(os.path.dirname(config_file), exist_ok=True)
                with open(config_file, 'w', encoding='utf-8') as f:
                    f.write("# 配置文件\n")
                    f.write("imagePath=\n")
                    f.write("cnFilePath=\n")
                    f.write("enFilePath=\n")
                    f.write("baseUrl=\n")
                    f.write("modelName=\n")
                print(f"已创建空的配置文件: {config_file}")
            except Exception as e:
                print(f"创建配置文件时出错: {str(e)}")
        
        # 读取系统提示词文件
        if os.path.exists(prompt_file):
            print(f"系统提示词文件存在: {prompt_file}")
            try:
                with open(prompt_file, 'r', encoding='utf-8') as f:
                    system_prompt = f.read()
                    print(f"成功读取系统提示词, 长度: {len(system_prompt)} 字节")
            except Exception as e:
                print(f"读取系统提示词文件时出错: {str(e)}")
        else:
            print(f"系统提示词文件不存在: {prompt_file}")
            # 创建一个空的系统提示词文件
            try:
                os.makedirs(os.path.dirname(prompt_file), exist_ok=True)
                with open(prompt_file, 'w', encoding='utf-8') as f:
                    f.write("")
                print(f"已创建空的系统提示词文件: {prompt_file}")
            except Exception as e:
                print(f"创建系统提示词文件时出错: {str(e)}")
        
        # 获取配置中的路径
        image_path = settings_data.get('imagePath', '')
        cn_file_path = settings_data.get('cnFilePath', '')
        en_file_path = settings_data.get('enFilePath', '')
        base_url = settings_data.get('baseUrl', '')
        model_name = settings_data.get('modelName', '')
        api_key = settings_data.get('Api-key', '')
        
        # 获取线程数并验证范围
        thread_count = 4  # 默认值
        if 'threadCount' in settings_data:
            try:
                thread_count = int(settings_data['threadCount'])
                if thread_count < 1:
                    thread_count = 1
                elif thread_count > 20:
                    thread_count = 20
            except (ValueError, TypeError):
                thread_count = 4
        
        # 准备响应数据
        response_data = {
            'image_path': image_path,
            'cn_file_path': cn_file_path,
            'en_file_path': en_file_path,
            'base_url': base_url,
            'model_name': model_name,
            'system_prompt': system_prompt,
            'api_key': api_key,
            'thread_count': thread_count,
            'image_files': [],
            'cn_files': [],
            'en_files': []
        }
        
        # 如果存在图片目录，则读取其中的文件
        if image_path and os.path.exists(image_path) and os.path.isdir(image_path):
            image_files = []
            for filename in os.listdir(image_path):
                file_path = os.path.join(image_path, filename)
                if os.path.isfile(file_path) and is_image_file(filename):
                    image_files.append({
                        'name': filename,
                        'path': file_path,
                        'is_file': True
                    })
            response_data['image_files'] = image_files
        
        # 如果存在中文文件目录，则读取其中的文件
        if cn_file_path and os.path.exists(cn_file_path) and os.path.isdir(cn_file_path):
            cn_files = []
            for filename in os.listdir(cn_file_path):
                file_path = os.path.join(cn_file_path, filename)
                if os.path.isfile(file_path) and filename.endswith('.txt'):
                    cn_files.append({
                        'name': filename,
                        'path': file_path,
                        'is_file': True
                    })
            response_data['cn_files'] = cn_files
        
        # 如果存在英文文件目录，则读取其中的文件
        if en_file_path and os.path.exists(en_file_path) and os.path.isdir(en_file_path):
            en_files = []
            for filename in os.listdir(en_file_path):
                file_path = os.path.join(en_file_path, filename)
                if os.path.isfile(file_path) and filename.endswith('.txt'):
                    en_files.append({
                        'name': filename,
                        'path': file_path,
                        'is_file': True
                    })
            response_data['en_files'] = en_files
        
        return JsonResponse(response_data)
    
    except Exception as e:
        print(f"处理目录信息时出错: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)

def is_image_file(filename):
    """判断文件是否为图片文件"""
    image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
    return any(filename.lower().endswith(ext) for ext in image_extensions)

# 添加调试信息查看当前工作目录
print("Current working directory:", os.getcwd())
print("Django BASE_DIR:", settings.BASE_DIR)

@csrf_exempt
def save_text_file(request):
    """保存文本文件内容的视图函数"""
    if request.method == 'POST':
        try:
            # 获取POST请求的JSON数据
            data = json.loads(request.body)
            file_path = data.get('file_path')
            content = data.get('content')
            
            # 验证参数
            if not file_path:
                return JsonResponse({'success': False, 'message': '未提供文件路径'}, status=400)
                
            # 相对于项目根目录的安全路径处理
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            if not file_path.startswith('/'):  # 如果是相对路径
                file_path = os.path.join(base_dir, '..', file_path)
            
            # 检查文件是否存在，如果不存在则创建目录
            if not os.path.exists(file_path):
                os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            # 保存文件内容
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"文本文件已保存: {file_path}")
            return JsonResponse({'success': True, 'message': '文件已成功保存'})
            
        except Exception as e:
            print(f"保存文本文件出错: {str(e)}")
            import traceback
            traceback.print_exc()
            return JsonResponse({'success': False, 'message': f'保存文件出错: {str(e)}'}, status=500)
    
    return JsonResponse({'success': False, 'message': '仅支持POST请求'}, status=405)

@csrf_exempt
def ai_analyze_images(request):
    """
    AI打标功能：分析用户选中的图片，生成中英文描述，并保存到对应文本文件
    支持多线程并行处理
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': '仅支持POST请求'}, status=405)
    
    try:
        # 解析请求数据
        data = json.loads(request.body)
        image_paths = data.get('image_paths', [])
        cn_dir_path = data.get('cn_dir_path', '')
        en_dir_path = data.get('en_dir_path', '')
        thread_count = data.get('thread_count', 4)  # 获取线程数，默认为4
        
        # 验证线程数范围
        try:
            thread_count = int(thread_count)
            if thread_count < 1:
                thread_count = 1
            elif thread_count > 20:
                thread_count = 20
        except (TypeError, ValueError):
            thread_count = 4  # 转换失败使用默认值
        
        if not image_paths:
            return JsonResponse({'success': False, 'message': '未提供图片路径'}, status=400)
        
        if not cn_dir_path or not en_dir_path:
            return JsonResponse({'success': False, 'message': '未提供文本保存路径'}, status=400)
        
        # 确保目录存在
        os.makedirs(cn_dir_path, exist_ok=True)
        os.makedirs(en_dir_path, exist_ok=True)
        
        # 加载配置和系统提示词
        config = analyze_vape_image.read_config()
        if not config:
            return JsonResponse({'success': False, 'message': '无法读取配置文件'}, status=500)
        
        system_prompt = analyze_vape_image.read_system_prompt()
        if not system_prompt:
            return JsonResponse({'success': False, 'message': '无法读取系统提示词'}, status=500)
        
        # 准备结果列表（线程安全）
        from concurrent.futures import ThreadPoolExecutor
        from threading import Lock
        
        results = []
        results_lock = Lock()
        
        # 定义处理单个图片的函数
        def process_image(image_path):
            try:
                # 确保image_path是字符串
                if isinstance(image_path, dict) and 'path' in image_path:
                    image_path = image_path['path']
                elif not isinstance(image_path, str):
                    with results_lock:
                        results.append({
                            'image_path': image_path,
                            'success': False,
                            'message': '图片路径格式不正确'
                        })
                    return
                
                # 获取图片文件名（不含扩展名）
                image_basename = os.path.splitext(os.path.basename(image_path))[0]
                
                # 构建对应的文本文件路径
                cn_file_path = os.path.join(cn_dir_path, f"{image_basename}.txt")
                en_file_path = os.path.join(en_dir_path, f"{image_basename}.txt")
                
                # 调用analyze_vape_image.py中的函数分析图片
                print(f"正在分析图片: {image_path} (线程池中)")
                analysis_result = analyze_vape_image.analyze_image(
                    image_path,
                    config['Api-key'],
                    config['modelName'],
                    config['baseUrl'],
                    system_prompt
                )
                
                if not analysis_result:
                    with results_lock:
                        results.append({
                            'image_path': image_path,
                            'success': False,
                            'message': '分析失败，未获取到结果'
                        })
                    return
                
                # 分割中英文结果
                parts = analysis_result.split('--', 1)
                
                if len(parts) == 2:
                    chinese_text = parts[0].strip()
                    english_text = parts[1].strip()
                else:
                    # 如果没有分隔符，将整个结果作为英文文本
                    chinese_text = "未能提取中文描述"
                    english_text = analysis_result.strip()
                
                # 保存中文结果
                with open(cn_file_path, 'w', encoding='utf-8') as f:
                    f.write(chinese_text)
                
                # 保存英文结果
                with open(en_file_path, 'w', encoding='utf-8') as f:
                    f.write(english_text)
                
                # 添加到结果列表
                with results_lock:
                    results.append({
                        'image_path': image_path,
                        'success': True,
                        'cn_file_path': cn_file_path,
                        'en_file_path': en_file_path
                    })
                
                print(f"已保存分析结果: {cn_file_path}, {en_file_path}")
                
            except Exception as e:
                print(f"处理图片 {image_path} 时出错: {str(e)}")
                import traceback
                traceback.print_exc()
                
                with results_lock:
                    results.append({
                        'image_path': image_path,
                        'success': False,
                        'message': str(e)
                    })
        
        # 使用线程池并行处理图片
        print(f"使用 {thread_count} 个线程处理 {len(image_paths)} 张图片")
        with ThreadPoolExecutor(max_workers=thread_count) as executor:
            # 提交所有任务到线程池
            executor.map(process_image, image_paths)
        
        # 线程池执行完毕后，返回处理结果
        return JsonResponse({
            'success': True,
            'results': results,
            'total': len(image_paths),
            'success_count': sum(1 for r in results if r.get('success', False)),
            'thread_count': thread_count
        })
        
    except Exception as e:
        print(f"AI打标处理出错: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'message': str(e)}, status=500)

