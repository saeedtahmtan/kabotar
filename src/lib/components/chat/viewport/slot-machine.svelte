<script lang="ts">
  import TGSRenderer from './renderer.svelte';
  import type { DotLottie } from '@lottiefiles/dotlottie-svelte';

  let {
    background,
    winningBg,
    handleUrl,
    stickers
  }: {
    background: string;
    winningBg?: string;
    handleUrl: string;
    stickers: [string, string, string];
  } = $props();

  let stickersDone = $state(0);
  let showWinning = $state(false);
  let refs: DotLottie[] = [];

  function collectRef(instance: DotLottie) {
    refs.push(instance);
  }

  function onStickerComplete() {
    stickersDone++;
    if (stickersDone >= 3 && winningBg) {
      showWinning = true;
    }
  }
  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onclick?.();
    }
  }
  function onclick() {
    for (const r of refs) {
      r.stop();
      r.play();
    }
  }
</script>

<div
  class="slot-machine"
  {onclick}
  {onkeydown}
  aria-label="Play animation"
  role="button"
  tabindex="0"
>
  <TGSRenderer src={showWinning && winningBg ? winningBg : background} />

  <div class="handle">
    <TGSRenderer src={handleUrl} loop={false} dotLottieRefCallback={collectRef} />
  </div>

  {#each stickers as url (url)}
    <TGSRenderer
      src={url}
      loop={false}
      autoplay
      onComplete={onStickerComplete}
      dotLottieRefCallback={collectRef}
    />
  {/each}
</div>

<style>
  .slot-machine {
    position: relative;
    width: 112px;
    height: 112px;
  }

  .slot-machine :global(> *) {
    position: absolute;
    inset: 0;
  }

  .handle {
    z-index: 10;
    pointer-events: none;
  }
</style>
