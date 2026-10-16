cd "$(dirname "$0")"
for p in f1 f2 f3; do for s in 8 34 377 610; do mflux-generate-flux2 --model flux2-klein-4b --quantize 8 --prompt-file prompt-$p.txt --seed $s --width 1024 --height 1024 --steps 4 --output ../../vendor/hf/local/k4$p-s$s.png >/dev/null 2>&1; echo $p $s; done; done
