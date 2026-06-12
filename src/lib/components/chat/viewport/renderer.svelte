<script lang="ts">
  import { DotLottieSvelte } from '@lottiefiles/dotlottie-svelte';
  import type { DotLottie } from '@lottiefiles/dotlottie-svelte';

  let {
    src,
    loop = false,
    randomReplay = false
  }: {
    src: string;
    loop?: boolean;
    randomReplay?: boolean;
  } = $props();

  let instance: DotLottie | null = $state(null);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  function dotLottieRefCallback(dot: DotLottie) {
    instance = dot;
    dot.addEventListener('complete', () => {
      if (randomReplay) {
        const delay = 5000 + Math.random() * 10000;
        timeoutId = setTimeout(() => {
          dot.play();
        }, delay);
      }
    });
  }

  $effect(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });

  function onclick() {
    if (instance && !instance.isPlaying) {
      instance.play();
    }
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onclick();
    }
  }
</script>

<div class="size-28" role="button" tabindex="0" {onclick} {onkeydown}>
  <DotLottieSvelte {src} autoplay {loop} {dotLottieRefCallback} />
</div>

<style>
  .size-28 {
    width: 112px;
    height: 112px;
  }
</style>
