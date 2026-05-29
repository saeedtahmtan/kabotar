<script lang="ts">
  import { Mic, Paperclip, SendHorizontal, X } from '@lucide/svelte';
  import * as InputGroup from '$lib/components/ui/input-group';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { onMount } from 'svelte';
  import { prepareWithSegments, walkLineRanges } from '@chenglou/pretext';
  import { fileTypeFromBuffer } from 'file-type';

  import EmojiPicker from './emoji-picker.svelte';
  import FileChips from './file-chips.svelte';

  const padding = 4.8 * 2;

  let action_buttons = $state<HTMLDivElement | null>(null);
  let textarea = $state<HTMLTextAreaElement | null>(null);
  let value = $state<string>('');
  let has_value = $derived(value.length > 0);
  let fileInputRef = $state<HTMLInputElement | null>(null);
  let width = $state(0);
  let widthSizeMin = $state(0);
  let widthSizeMax = $state(0);
  let files = $state<
    { name: string; size: number; mime: string; ext: string; buffer: ArrayBuffer }[]
  >([]);

  let pendingFileType: 'image' | 'video' | 'file' | null = null;

  let isRecording = $state(false);
  let mediaRecorder: MediaRecorder | null = null;
  let audioContext: AudioContext | null = null;
  let analyserNode: AnalyserNode | null = null;
  let mediaStream: MediaStream | null = null;
  let audioChunks: Blob[] = [];
  let animationFrameId: number | null = null;
  let shouldSave = $state(true);
  let recordingStart = $state(0);
  let elapsed = $state(0);
  let visualizerWidth = $state(0);
  const BAR_WIDTH = 5;
  const BAR_GAP = 2;
  let numBars = $derived(
    visualizerWidth > 0 ? Math.max(1, Math.floor(visualizerWidth / (BAR_WIDTH + BAR_GAP))) : 0
  );

  let phase = $state(0);
  let lastTimestamp = 0;
  const BASE_SPEED = 1.5;
  const SPEED_MULTIPLIER = 50;
  const BAR_SPACING = 0.5;

  let bars = $derived(
    numBars
      ? Array.from({ length: numBars }, (_, i) => {
          const center = (numBars - 1) / 2;
          const sigma = numBars / 4;
          const gaussian = Math.exp(-0.5 * ((i - center) / sigma) ** 2);
          const sine = Math.sin(phase + (i - center) * BAR_SPACING);
          return Math.max(5, (sine * 0.5 + 0.5) * gaussian * 100);
        })
      : []
  );

  function startRecording() {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaStream = stream;
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 128;
        source.connect(analyserNode);
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunks.push(e.data);
        };
        mediaRecorder.onstop = async () => {
          if (shouldSave && audioChunks.length) {
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            const buffer = await blob.arrayBuffer();
            files = [
              { name: 'Voice message.webm', size: blob.size, mime: 'audio/webm', ext: 'webm', buffer }
            ];
          }
          cleanupRecording();
        };
        mediaRecorder.start();
        recordingStart = Date.now();
        isRecording = true;
        function tick(timestamp: number) {
          if (!analyserNode) return;
          const dt = lastTimestamp ? (timestamp - lastTimestamp) / 1000 : 0.016;
          lastTimestamp = timestamp;

          elapsed = Date.now() - recordingStart;
          if (elapsed >= 300000) {
            shouldSave = true;
            mediaRecorder?.stop();
            return;
          }

          const buf = new Uint8Array(analyserNode.fftSize);
          analyserNode.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const d = (buf[i] - 128) / 128;
            sum += d * d;
          }
          const rms = Math.sqrt(sum / buf.length);
          const speed = BASE_SPEED + rms * SPEED_MULTIPLIER;
          phase = (phase + dt * speed) % (2 * Math.PI);

          animationFrameId = requestAnimationFrame(tick);
        }
        tick(0);
      })
      .catch(() => {});
  }

  function stopRecording() {
    shouldSave = true;
    mediaRecorder?.stop();
  }

  function cancelRecording() {
    shouldSave = false;
    mediaRecorder?.stop();
  }

  function cleanupRecording() {
    if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
    mediaStream?.getTracks().forEach((t) => t.stop());
    audioContext?.close();
    audioContext = null;
    analyserNode = null;
    mediaRecorder = null;
    mediaStream = null;
    animationFrameId = null;
    isRecording = false;
    lastTimestamp = 0;
    recordingStart = 0;
  }

  let fontFamily = $derived(
    textarea
      ? `${getComputedStyle(textarea).fontSize} ${getComputedStyle(textarea).fontFamily}`
      : '16px system-ui'
  );

  let lineHeight = 24;

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
    onSubmit(trimmedValue, files.map(f => f.buffer));
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
    const tempFiles = [];
    for (const file of input.files) {
      const buffer = await file.arrayBuffer();
      const detected = await fileTypeFromBuffer(new Uint8Array(buffer));
      const mime = detected?.mime || 'application/octet-stream';
      const ext = detected?.ext || 'bin';
      tempFiles.push({ name: file.name, size: file.size, mime, ext, buffer });
    }
    files = tempFiles;
    pendingFileType = null;
  }
</script>

<div class="flex w-full flex-col gap-1">
  <FileChips {files} onRemove={(i) => files = files.filter((_, j) => j !== i)} />
  <InputGroup.Root class="items-end bg-sidebar shadow-sm backdrop-blur-md [--spacing:0.3rem]">
    {#if isRecording}
      <div
        bind:clientWidth={visualizerWidth}
        class="flex h-full w-0 grow items-center justify-center p-2"
      >
        <div class="flex h-full w-full items-center gap-0.5">
          {#each bars as bar}
            <div class="w-1.25 rounded-full bg-accent-foreground/80" style="height: {bar}%"></div>
          {/each}
        </div>
      </div>
    {:else}
      <InputGroup.Textarea
        rows={1}
        class="self-top my-1 min-h-0 resize-none overflow-hidden p-1"
        placeholder="Write your message"
        onkeydown={onKeydown}
        bind:ref={textarea}
        bind:value
        dir="auto"
      />
    {/if}

    <InputGroup.Addon class="flex-wrap gap-0" bind:ref={action_buttons}>
      {#if isRecording}
        <InputGroup.Button onclick={cancelRecording}>
          <X />
        </InputGroup.Button>
        <span class="px-2 text-sm text-foreground tabular-nums"
          >{Math.floor(elapsed / 60000)}:{String(Math.floor((elapsed % 60000) / 1000)).padStart(
            2,
            '0'
          )}</span
        >
      {:else}
        <EmojiPicker onInsert={insertEmoji} />

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
            <DropdownMenu.Item onSelect={() => handleFileSelection('video')}
              >Video</DropdownMenu.Item
            >
            <DropdownMenu.Item onSelect={() => handleFileSelection('file')}
              >Normal file</DropdownMenu.Item
            >
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}
    </InputGroup.Addon>

    <InputGroup.Addon align="inline-end">
      {#if isRecording}
        <InputGroup.Button onclick={stopRecording}>
          <span class="relative flex">
            <span class="relative inline-flex text-red-500"
              ><Mic />
              <span
                class="absolute h-full w-full animate-ping rounded-full bg-red-400 text-red-500 opacity-75"
              ></span>
            </span>
          </span>
        </InputGroup.Button>
      {:else}
        <InputGroup.Button
          class="group"
          data-has-value={has_value}
          onclick={has_value ? submit : startRecording}
        >
          <SendHorizontal class="absolute transition group-data-[has-value=false]:scale-0" />
          <Mic class="transition group-data-[has-value=true]:scale-0" />
        </InputGroup.Button>
      {/if}
    </InputGroup.Addon>
  </InputGroup.Root>
</div>

<input type="file" bind:this={fileInputRef} class="hidden" onchange={onFileSelected} />
