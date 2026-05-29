<script lang="ts">
  import { File, Image, Music, Trash2, Video, X } from '@lucide/svelte';

  type FileData = { name: string; size: number; mime: string; ext: string; buffer: ArrayBuffer };

  let {
    files,
    onRemove
  }: {
    files: FileData[];
    onRemove: (i: number) => void;
  } = $props();

  let draggedIndex = $state<number | null>(null);
  let showTrash = $state(false);
  let dragPos = $state({ x: 0, y: 0 });
  let trashRef = $state<HTMLElement | null>(null);
  let hoveredTrash = $state(false);

  function startDrag(i: number, e: PointerEvent) {
    e.preventDefault();
    draggedIndex = i;
    showTrash = true;
    dragPos = { x: e.clientX, y: e.clientY };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function onMove(e: PointerEvent) {
    dragPos = { x: e.clientX, y: e.clientY };
    if (!trashRef) { hoveredTrash = false; return; }
    const rect = trashRef.getBoundingClientRect();
    hoveredTrash = e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top && e.clientY <= rect.bottom;
  }

  function onUp() {
    if (hoveredTrash && draggedIndex !== null) {
      onRemove(draggedIndex);
    }
    draggedIndex = null;
    showTrash = false;
    hoveredTrash = false;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  }

  function fileIcon(mime: string) {
    if (mime.startsWith('image/')) return Image;
    if (mime.startsWith('video/')) return Video;
    if (mime.startsWith('audio/')) return Music;
    return File;
  }
</script>

{#if files.length > 0}
  <div class="flex flex-wrap gap-1.5">
    {#each files as file, i}
      {@const Icon = fileIcon(file.mime)}
      <div
        role="button"
        tabindex="-1"
        class="flex cursor-grab items-center rounded-md border bg-accent px-2 py-1 active:cursor-grabbing"
        class:dragging={draggedIndex === i}
        onpointerdown={(e) => startDrag(i, e)}
      >
        <Icon size={20} />
      </div>
    {/each}
  </div>
{/if}

{#if showTrash}
  <div class="absolute inset-0 z-40 bg-black/40"></div>
  <div
    bind:this={trashRef}
    class="absolute inset-0 z-50 m-auto flex h-min w-min justify-center"
  >
    <div
      class="flex w-max flex-col items-center justify-center rounded-xl bg-red-500 p-4 shadow-lg transition-transform"
      class:scale-125={hoveredTrash}
    >
      <Trash2 class="text-white" size={28} />
      <span>Remove the file</span>
    </div>
  </div>
{/if}

{#if draggedIndex !== null}
  {@const file = files[draggedIndex]}
  {@const Icon = fileIcon(file.mime)}
  <div
    class="pointer-events-none fixed z-50"
    style="left: {dragPos.x}px; top: {dragPos.y}px; transform: translate(-50%, -50%);"
  >
    <div class="flex items-center gap-1.5 rounded-md border bg-accent px-2 py-1 text-xs shadow-lg">
      <Icon size={20} />
    </div>
  </div>
{/if}

<style>
  .dragging {
    opacity: 0.3;
  }
</style>
