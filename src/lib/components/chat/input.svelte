<script lang="ts">
  import { Paperclip, SendHorizontal, Smile } from '@lucide/svelte';
  import * as InputGroup from '$lib/components/ui/input-group';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { onMount, tick } from 'svelte';
  import * as Popover from '$lib/components/ui/popover';
  import { prepareWithSegments, walkLineRanges } from '@chenglou/pretext';

  import emojis from '$lib/assets/emojis.json';
  type EmojiEntry = {
    id: string;
    name: string;
    native: string;
    keywords: string[];
    emoticons?: string[];
  };

  // ---------- emoji picker state & virtual scroll ----------
  let emojiPickerOpen = $state(false);
  const emojiGroups: Array<{ label: string; items: EmojiEntry[] }> = emojis;
  // flatten all emojis for easy filtering
  const allEmojis = emojiGroups.flatMap((g) => g.items);

  let emojiSearch = $state<HTMLInputElement | undefined>();
  let filteredEmojis = $state(allEmojis);
  let debounceTimer: NodeJS.Timeout;

  function updateEmojiFilter() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!emojiSearch) return;
      const q = emojiSearch.value.toLowerCase().trim();
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
  const ITEM_SIZE = 44; // height of one emoji button (px)
  const COLUMNS = 7; // number of emojis per row
  const OVERSCAN = 2; // extra rows rendered above/below

  let emojiContainer = $state<HTMLDivElement | null>(null);
  let emojiScrollTop = $state(0);

  let totalRows = $derived(Math.ceil(filteredEmojis.length / COLUMNS));
  let startRow = $derived(Math.max(0, Math.floor(emojiScrollTop / ITEM_SIZE) - OVERSCAN));
  let endRow = $derived(
    Math.min(totalRows, Math.ceil((emojiScrollTop + CONTAINER_HEIGHT) / ITEM_SIZE) + OVERSCAN)
  );
  let visibleEmojis = $derived(filteredEmojis.slice(startRow * COLUMNS, endRow * COLUMNS));

  function onEmojiScroll(e: Event) {
    emojiScrollTop = (e.target as HTMLElement).scrollTop;
  }

  // reset scroll & search when picker opens
  $effect(() => {
    if (emojiPickerOpen && emojiContainer) {
      tick().then(() => {
        if (!emojiSearch) return;
        emojiContainer!.scrollTop = 0;
        emojiSearch.value = '';
        filteredEmojis = allEmojis;
      });
    }
  });

  // original emoji insertion logic
  function insertEmoji(emoji: string) {
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.slice(0, start) + emoji + value.slice(end);
    value = newValue;
    setTimeout(() => {
      if (!textarea) return;
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    }, 0);
  }
  // --------------------------------------------------------

  const padding = 4.8 * 2;

  let action_buttons = $state<HTMLDivElement | null>(null);
  let textarea = $state<HTMLTextAreaElement | null>(null);
  let value = $state<string>('');
  let has_value = $derived(value.length > 0);
  let fileInputRef = $state<HTMLInputElement | null>(null);
  let width = $state(0);
  let widthSizeMin = $state(0);
  let widthSizeMax = $state(0);
  let files = $state<ArrayBuffer[]>([]);

  let pendingFileType: 'image' | 'video' | 'file' | null = null;
  let fontFamily = $derived(
    textarea
      ? `${getComputedStyle(textarea).fontSize} ${getComputedStyle(textarea).fontFamily}`
      : '16px system-ui'
  );

  let lineHeight = 24;
  let fileCount = $state(0);

  const {
    onSubmit
  }: {
    onSubmit: (input: string, files: ArrayBuffer[]) => any;
  } = $props();

  function setInitialSizes() {
    if (!textarea) return;
    if (!action_buttons) return;

    const value = textarea.value;
    textarea.value = ' ';
    action_buttons.style.width = 'max-content';
    widthSizeMin = textarea.clientWidth - padding;
    action_buttons.style.width = 'min-content';
    widthSizeMax = textarea.clientWidth - padding;
    textarea.value = value;
  }

  onMount(() => {
    const resizeObserver = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === width) return;
      width = entry.contentRect.width;
      setInitialSizes();
    });
    if (textarea?.parentElement) resizeObserver.observe(textarea.parentElement);

    return () => resizeObserver.disconnect();
  });

  $effect(() => {
    if (!textarea) return;

    let preparedText = prepareWithSegments(value, fontFamily, { whiteSpace: 'pre-wrap' });

    let lineCount = walkLineRanges(preparedText, widthSizeMin, () => {});
    let isMultiLine = lineCount > 1;

    if (lineCount > 1) {
      lineCount = Math.min(
        walkLineRanges(preparedText, widthSizeMax, () => {}),
        10
      );
    }
    if (value.at(-1) === '\n') {
      lineCount++;
      isMultiLine = true;
    }

    const height = (lineCount ? lineCount * lineHeight : lineHeight) + padding;
    textarea.style.height = `${height}px`;

    if (action_buttons) {
      action_buttons.style.width = isMultiLine ? 'min-content' : 'max-content';
    }
  });

  function submit() {
    if (!textarea) return;
    const trimmedValue = textarea.value.trim();
    if (trimmedValue.length === 0) return;
    onSubmit(trimmedValue, files);
    fileCount = 0;
    files = [];
    value = '';

    if (action_buttons) action_buttons.style.width = 'max-content';
  }

  function onKeydown(event: KeyboardEvent & { currentTarget: HTMLTextAreaElement }) {
    if (event.key !== 'Enter') return;
    if (event.shiftKey) {
      if (event.currentTarget.value.length == 0) event.preventDefault();
      return;
    }
    event.preventDefault();
    submit();
  }

  // File handling with shadcn-svelte dropdown
  function handleFileSelection(type: 'image' | 'video' | 'file') {
    if (!fileInputRef) return;
    pendingFileType = type;
    if (type === 'image') fileInputRef.accept = 'image/*';
    else if (type === 'video') fileInputRef.accept = 'video/*';
    else fileInputRef.accept = '*/*';
    fileInputRef.value = '';
    fileInputRef.click();
  }

  async function onFileSelected(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    if (!input.files) return;
    fileCount = input.files.length;
    const tempFiles = [];
    for (let i = 0; i < fileCount; i++) {
      tempFiles.push(await input.files[i].arrayBuffer()); // fixed: use files[i], not files[0]
    }
    files = tempFiles;
    pendingFileType = null;
  }
</script>

<div class="flex w-full flex-col gap-1">
  {#if fileCount != 0}
    <p>{fileCount} file selected</p>
  {/if}
  <InputGroup.Root class="items-end bg-sidebar shadow-sm backdrop-blur-md [--spacing:0.3rem]">
    <InputGroup.Textarea
      rows={1}
      class="self-top my-1 min-h-0 resize-none overflow-hidden p-1"
      placeholder="Write your message"
      onkeydown={onKeydown}
      bind:ref={textarea}
      bind:value
      dir="auto"
    />

    <InputGroup.Addon class="flex-wrap gap-0" bind:ref={action_buttons}>
      <!-- ====== Virtual scrolled emoji picker ====== -->
      <Popover.Root bind:open={emojiPickerOpen}>
        <Popover.Trigger>
          <InputGroup.Button>
            <Smile />
          </InputGroup.Button>
        </Popover.Trigger>
        <Popover.Content class="w-70 sm:w-80 p-0 left-1/2" side="top" align="start">
          <!-- Search input -->
          <div class="border-b px-3 py-2">
            <input
              type="text"
              placeholder="Search emoji..."
              class="w-full bg-transparent text-sm outline-none"
              bind:this={emojiSearch}
              oninput={updateEmojiFilter}
            />
          </div>

          <!-- Virtual scroll container -->
          <div
            bind:this={emojiContainer}
            style="height: {CONTAINER_HEIGHT}px; overflow-y: auto; contain: strict;"
            class="p-1"
            onscroll={onEmojiScroll}
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
                  onclick={() => insertEmoji(emoji.native)}
                  title={emoji.name}
                >
                  {emoji.native}
                </button>
              {/each}
            </div>
          </div>
        </Popover.Content>
      </Popover.Root>

      <!-- File attachment dropdown (unchanged) -->
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <InputGroup.Button>
            <Paperclip />
          </InputGroup.Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content class="min-w-35">
          <DropdownMenu.Item onSelect={() => handleFileSelection('image')}
            >Picture</DropdownMenu.Item
          >
          <DropdownMenu.Item onSelect={() => handleFileSelection('video')}>Video</DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => handleFileSelection('file')}
            >Normal file</DropdownMenu.Item
          >
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </InputGroup.Addon>

    <InputGroup.Addon align="inline-end">
      <InputGroup.Button class="group" onclick={submit}>
        <SendHorizontal class="absolute transition group-data-[has-value=false]:scale-0" />
      </InputGroup.Button>
    </InputGroup.Addon>
  </InputGroup.Root>
</div>

<input type="file" bind:this={fileInputRef} class="hidden" onchange={onFileSelected} />
