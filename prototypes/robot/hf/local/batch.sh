cd "$(dirname "$0")"
for s in 3 21 34 55 89 144; do mflux-generate-flux2 --model flux2-klein-4b --quantize 8 --prompt-file prompt-b.txt --seed $s --width 768 --height 1344 --steps 4 --output k4-s$s.png >/dev/null 2>&1; echo a $s; done
for s in 8 21 34 55 89 144 233 377; do mflux-generate-flux2 --model flux2-klein-4b --quantize 8 --prompt-file prompt-b2.txt --seed $s --width 768 --height 1344 --steps 4 --output k4b2-s$s.png >/dev/null 2>&1; echo b $s; done
