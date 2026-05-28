<script lang="ts">
  import type { InferSelectModel } from 'drizzle-orm';

  import type { message } from '$lib/server/db/schema';
  import { prepareMessages, type PreparedMessage } from './viewport/prepare';
  import {
    computeAllMessagesLayout,
    defaultConfig,
    type RenderedMessageLayout
  } from './viewport/layout';
  import MessageBobble from './viewport/message.svelte';

  type Message = InferSelectModel<typeof message>;

  let {
    messages = [],
    sender,
    onDelete
  }: {
    messages?: Message[];
    sender: string;
    onDelete: (id: string) => void;
  } = $props();

  let viewportRef = $state<HTMLElement | null>(null);
  let scrollTop = $state(0);
  let render = $state<RenderedMessageLayout[]>([]);
  let fullHeight = $state(0);

  const preparedMessages: PreparedMessage[] = $derived(prepareMessages(messages));

  $effect(() => {
    if (!viewportRef) return;
    const observer = new ResizeObserver(([entry]) => {
      requestAnimationFrame(() => computeLayout(entry.contentRect.width));
    });

    function onscroll() {
      if (!viewportRef) return;
      scrollTop = Math.abs(viewportRef.scrollTop);
      requestAnimationFrame(() => computeLayout(viewportRef!.clientWidth));
    }

    viewportRef.scrollTo({ top: viewportRef.scrollHeight });
    viewportRef.addEventListener('scroll', onscroll);
    observer.observe(viewportRef);
  });

  $effect(() => {
    if (viewportRef) {
      computeLayout(viewportRef.clientWidth);
    }
  });

  let oldClientWidth = 0;
  let oldScrollTop = 0;
  let oldPreparedMessagesLength = 0;

  function computeLayout(maxWidth: number) {
    if (!viewportRef) return;
    if (typeof OffscreenCanvas === 'undefined') return;
    if (
      maxWidth === oldClientWidth &&
      scrollTop === oldScrollTop &&
      preparedMessages.length === oldPreparedMessagesLength
    )
      return;

    const result = computeAllMessagesLayout(
      preparedMessages,
      sender,
      maxWidth,
      scrollTop,
      viewportRef.clientHeight,
      defaultConfig
    );

    oldClientWidth = maxWidth;
    oldScrollTop = scrollTop;
    oldPreparedMessagesLength = preparedMessages.length;
    fullHeight = result.fullHeight;
    render = result.messages.filter((m) => m.visible);
  }

  function deleteMessage(messageId: string) {
    return () => {
      onDelete(messageId);
      requestAnimationFrame(() => computeLayout(viewportRef!.clientWidth));
    };
  }
</script>

<div
  class="relative mx-auto flex h-0 w-full max-w-3xl grow flex-col-reverse overflow-y-auto scroll-smooth px-3 transition-transform duration-500"
  bind:this={viewportRef}
>
  <div class="w-1 shrink-0" style="height:{fullHeight}px"></div>
  {#each render as msg (msg.id)}
    <MessageBobble {msg} {deleteMessage} />
  {/each}
</div>
