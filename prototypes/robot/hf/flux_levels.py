import sys, shutil
from gradio_client import Client
from huggingface_hub import get_token
out = sys.argv[1]
c = Client('black-forest-labs/FLUX.1-dev', token=get_token(), verbose=False)
common = ("full body 3D anime character render of an original android maid girl, normal anime proportions about 7 heads tall, slim, "
          "standing in a relaxed A-pose, front view, whole figure from head to feet in frame, cute anime face with big expressive eyes, "
          "glossy black hair with blunt bangs, white frilled maid headband, black and white maid dress with white apron and ruffled collar, black thigh-high stockings, "
          "toon shaded like a VRoid or Genshin-style model, clean cel shading, plain light grey background, even studio lighting, centered")
v = {
 'lvl-a': (common + ", she looks almost human: subtle robot tells only, thin panel seam lines on her cheeks and neck, small ball joints at elbows and wrists, softly glowing orange irises, small cute smile", 3),
 'lvl-b-mouth': (common + ", half human half machine: human-looking anime face and hair, but clearly mechanical arms and hands in white plastic with black ball joints, visible finger segments and servo knuckles, segmented mechanical neck, glowing orange irises, tiny cute mouth", 8),
 'lvl-b-nomouth': (common + ", half human half machine: anime face with NO mouth and no nose, smooth porcelain lower face, glowing orange eyes, clearly mechanical arms and hands in white plastic with black ball joints, visible finger segments and servo knuckles, segmented mechanical neck", 8),
 'lvl-c': (common + ", armoured robot: glossy white ceramic faceplate with large glowing orange screen eyes and no mouth, plated white armour limbs with black joints and orange glowing rings, hard-surface mechanical hands, hair sculpted as glossy black lacquer shell", 12),
}
for k, (p, seed) in v.items():
    try:
        res, _ = c.predict(prompt=p, seed=seed, randomize_seed=False, width=768, height=1344, guidance_scale=3.5, num_inference_steps=28, api_name='/infer')
        shutil.copy(res['path'] if isinstance(res, dict) else res, f'{out}/concept-{k}.webp'); print(k, 'ok', flush=True)
    except Exception as e:
        print(k, 'ERR', str(e)[:300], flush=True)
