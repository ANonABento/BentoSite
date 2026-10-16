import sys, shutil
from gradio_client import Client, handle_file
from huggingface_hub import get_token
img, out = sys.argv[1], sys.argv[2]
c = Client('microsoft/TRELLIS.2', token=get_token(), verbose=False)
info = c.view_api(print_info=False, return_format='dict')
print({k: [p['parameter_name'] for p in v['parameters']] for k, v in info['named_endpoints'].items() if 'extract' in k}, flush=True)
c.predict(api_name='/start_session')
pre = c.predict(input=handle_file(img), api_name='/preprocess_image')
print('pre', pre, flush=True)
html = c.predict(image=handle_file(pre['path'] if isinstance(pre, dict) else pre), seed=3, resolution='1024', api_name='/image_to_3d')
print('3d done', str(html)[:200], flush=True)
r = c.predict(decimation_target=300000, texture_size=2048, api_name='/extract_glb')
print('glb', r, flush=True)
p = r[0] if isinstance(r, (list, tuple)) else r
p = p['path'] if isinstance(p, dict) else p
shutil.copy(p, out); print('saved', out)
