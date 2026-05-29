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
    hasMore = false,
    onDelete,
    onLoadMore
  }: {
    messages?: Message[];
    sender: string;
    hasMore?: boolean;
    onDelete: (id: string) => void;
    onLoadMore?: () => void;
  } = $props();

  let viewportRef = $state<HTMLElement | null>(null);
  let scrollTop = $state(0);
  let render = $state<RenderedMessageLayout[]>([]);
  let fullHeight = $state(0);
  let areaTop = $state(0);
  let areaBottom = $state(0);
  let topSentinel = $state<HTMLElement | null>(null);
  let loadingMore = $state(false);

  const preparedMessages: PreparedMessage[] = $derived(prepareMessages(messages));

  $effect(() => {
    if (!viewportRef) return;
    const observer = new ResizeObserver(([entry]) => {
      requestAnimationFrame(() => computeLayout(entry.target.clientWidth));
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

    areaTop = scrollTop;
    areaBottom = areaTop + viewportRef.clientHeight;

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

  $effect(() => {
    const el = topSentinel;
    const container = viewportRef;
    if (!el || !container || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore) {
          loadingMore = true;
          try {
            onLoadMore?.();
          } finally {
            loadingMore = false;
          }
        }
      },
      { root: container, threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  });

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
  style="--top:{areaTop};--bottom:{areaBottom};"
>
  <div class="w-1 shrink-0" style="height:{fullHeight}px;"></div>
  {#each render as msg (msg.id)}
    <MessageBobble {msg} {deleteMessage} />
  {/each}
  <div
    bind:this={topSentinel}
    class="pointer-events-none absolute"
    style="bottom:{fullHeight}px;height:1px;width:1px;"
  ></div>
</div>
