import sys, shutil
from gradio_client import Client
from huggingface_hub import get_token
out = sys.argv[1]
c = Client('black-forest-labs/FLUX.1-dev', token=get_token(), verbose=False)
base = ("cute full body 3D anime character render of an original small robot maid, chibi-leaning proportions with a large round head and short body, "
        "standing in a relaxed A-pose, front view, whole figure from head to feet in frame, "
        "her face is a smooth glossy white faceplate with NO nose and NO mouth, only two big round glowing orange screen eyes with bright white highlights, "
        "kawaii and friendly, glossy black lacquered sculpted bob hair with blunt straight bangs and side locks, white frilled maid headband, "
        "rounded white plastic ball-jointed limbs with dark joints and small orange glowing rings, simple round mechanical hands, "
        "glossy black maid dress with puffed sleeves, white ruffled collar and white apron, black boots, "
        "toon shaded, soft rounded shapes, Nintendo-like appeal, plain light grey background, even studio lighting, centered")
variants = {'cute-a': (base, 5), 'cute-b': (base + ", eyes shaped like soft glowing ovals, slightly tilted head", 41), 'cute-c': (base.replace('chibi-leaning proportions with a large round head and short body', 'anime figure proportions with a slightly large head'), 77)}
for k, (p, seed) in variants.items():
    try:
        res, _ = c.predict(prompt=p, seed=seed, randomize_seed=False, width=768, height=1344, guidance_scale=3.5, num_inference_steps=28, api_name='/infer')
        shutil.copy(res['path'] if isinstance(res, dict) else res, f'{out}/concept-{k}.webp'); print(k, 'ok', flush=True)
    except Exception as e:
        print(k, 'ERR', str(e)[:300], flush=True)
