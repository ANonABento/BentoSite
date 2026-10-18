cd "$(dirname "$0")"
for s in 8 377 1597; do mflux-generate-flux2-edit --model flux2-klein-4b --quantize 8 --image-paths ../../vendor/hf/local/k4t3-s1597.png --prompt-file prompt-t3e.txt --seed $s --width 768 --height 1344 --steps 4 --output ../../vendor/hf/local/k4t3e-s$s.png 2>&1 | tail -2; echo t3e $s; done
