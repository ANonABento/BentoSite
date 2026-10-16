import sys, shutil
from gradio_client import Client
from huggingface_hub import get_token
out = sys.argv[1]
c = Client('black-forest-labs/FLUX.1-dev', token=get_token(), verbose=False)
base = ("full body 3D character render of an original robot maid android, standing in a relaxed A-pose, front view, whole figure from head to feet in frame, "
        "smooth glossy warm off-white porcelain doll face with no mouth and no nose, two large round glowing orange screen eyes, "
        "glossy black lacquered sculpted hair with blunt straight bangs and long straight side locks, small white frilled maid headband, "
        "slim segmented robot body, ball-jointed doll limbs of glossy off-white plastic with dark gunmetal joints and thin orange glowing rings at the shoulders, elbows and knees, "
        "mechanical hands with segmented fingers, high-gloss black latex maid dress with short puffed sleeves, white ruffled collar, short white apron, black thigh-high boots, "
        "toon-shaded game asset, clean hard surface, subtle panel lines, plain neutral grey background, even studio lighting, centered, Blender render, high detail")
variants = {'full-a': base, 'full-b': base.replace('relaxed A-pose', 'relaxed A-pose, arms slightly away from the body')}
seeds = {'full-a': 11, 'full-b': 29}
for k, p in variants.items():
    try:
        res, seed = c.predict(prompt=p, seed=seeds[k], randomize_seed=False, width=768, height=1344, guidance_scale=3.5, num_inference_steps=28, api_name='/infer')
        path = res['path'] if isinstance(res, dict) else res
        shutil.copy(path, f'{out}/concept-{k}.webp'); print(k, 'ok', flush=True)
    except Exception as e:
        print(k, 'ERR', e, flush=True)
