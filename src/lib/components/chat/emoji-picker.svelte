<script lang="ts">
  import * as Popover from '$lib/components/ui/popover';
  import { Smile } from '@lucide/svelte';
  import * as InputGroup from '$lib/components/ui/input-group';
  import { tick } from 'svelte';

  import emojis from '$lib/assets/emojis.json';
  type EmojiEntry = {
    id: string;
    name: string;
    native: string;
    keywords: string[];
    emoticons?: string[];
  };

  let {
    onInsert
  }: {
    onInsert: (emoji: string) => void;
  } = $props();

  let open = $state(false);
  const emojiGroups: Array<{ label: string; items: EmojiEntry[] }> = emojis;
  const allEmojis = emojiGroups.flatMap((g) => g.items);

  let search = $state<HTMLInputElement | undefined>();
  let filteredEmojis = $state(allEmojis);
  let debounceTimer: NodeJS.Timeout;

  function updateFilter() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!search) return;
      const q = search.value.toLowerCase().trim();
      filteredEmojis = q
        ? allEmojis.filter(
            (e) =>
              e.name.toLowerCase().includes(q) ||
              e.keywords.some((k) => k.toLowerCase().includes(q))
          )
        : allEmojis;
    }, 150);
  }

  const CONTAINER_HEIGHT = 320;
  const ITEM_SIZE = 44;
  const COLUMNS = 7;
  const OVERSCAN = 2;

  let container = $state<HTMLDivElement | null>(null);
  let scrollTop = $state(0);

  let totalRows = $derived(Math.ceil(filteredEmojis.length / COLUMNS));
  let startRow = $derived(Math.max(0, Math.floor(scrollTop / ITEM_SIZE) - OVERSCAN));
  let endRow = $derived(
    Math.min(totalRows, Math.ceil((scrollTop + CONTAINER_HEIGHT) / ITEM_SIZE) + OVERSCAN)
  );
  let visibleEmojis = $derived(filteredEmojis.slice(startRow * COLUMNS, endRow * COLUMNS));

  function onScroll(e: Event) {
    scrollTop = (e.target as HTMLDivElement).scrollTop;
  }

  $effect(() => {
    if (open && container) {
      tick().then(() => {
        if (!search) return;
        container!.scrollTop = 0;
        search.value = '';
        filteredEmojis = allEmojis;
      });
    }
  });
</script>

<Popover.Root bind:open={open}>
  <Popover.Trigger>
    <InputGroup.Button>
      <Smile />
    </InputGroup.Button>
  </Popover.Trigger>
  <Popover.Content class="left-1/2 w-70 p-0 sm:w-80" side="top" align="start">
    <div class="border-b px-3 py-2">
      <input
        type="text"
        placeholder="Search emoji..."
        class="w-full bg-transparent text-sm outline-none"
        bind:this={search}
        oninput={updateFilter}
      />
    </div>

    <div
      bind:this={container}
      style="height: {CONTAINER_HEIGHT}px; overflow-y: auto; contain: strict;"
      class="p-1"
      onscroll={onScroll}
    >
      <div style="height: {totalRows * ITEM_SIZE}px; position: relative;">
        {#each visibleEmojis as emoji, index}
          {@const globalIndex = startRow * COLUMNS + index}
          {@const row = Math.floor(globalIndex / COLUMNS)}
          {@const col = globalIndex % COLUMNS}
          <button
            type="button"
            style="position: absolute; left: {col * (100 / COLUMNS)}%; width: {100 /
              COLUMNS}%; top: {row * ITEM_SIZE}px; height: {ITEM_SIZE}px;"
            class="flex items-center justify-center rounded-md text-xl select-none hover:bg-accent focus:bg-accent"
            onclick={() => onInsert(emoji.native)}
            title={emoji.name}
          >
            {emoji.native}
          </button>
        {/each}
      </div>
    </div>
  </Popover.Content>
</Popover.Root>
