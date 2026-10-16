cd "$(dirname "$0")"
for p in c1 c2 c3; do for s in 8 34 377 610; do mflux-generate-flux2 --model flux2-klein-4b --quantize 8 --prompt-file prompt-$p.txt --seed $s --width 768 --height 1344 --steps 4 --output k4$p-s$s.png >/dev/null 2>&1; echo $p $s; done; done
