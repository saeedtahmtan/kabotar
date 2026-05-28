<script lang="ts">
  import * as ContextMenu from '$lib/components/ui/context-menu';
  import { cn } from '$lib/utils';
  import { Bookmark, Check, Trash } from '@lucide/svelte';
  import type { RenderedMessageLayout } from './layout';

  const {
    msg,
    deleteMessage
  }: {
    msg: RenderedMessageLayout;
    deleteMessage: (id: string) => () => void;
  } = $props();
</script>

<div
  class={cn(
    'md slide-in in absolute  mb-2 rounded-2xl  bg-accent px-1  transition-all',
    msg.isMine ? ' origin-left self-end' : 'bg-bobble',
    msg.isMultiline ? 'origin-right flex-col' : 'items-end'
  )}
  style="width: {msg.maxWidth + 1}px;bottom:{msg.top}px;"
>
  <ContextMenu.Root>
    <ContextMenu.Trigger
      class={cn(
        'flex gap-1',
        msg.isMine && 'flex-row-reverse',
        msg.isMultiline ? 'flex-col' : 'items-end'
      )}
    >
      <div class="unicode">{@html msg.html}</div>
      <span class="flex items-center gap-1 text-xs opacity-50">
        {msg.time}
        {#if msg.isMine}<Check size={16} />{/if}
      </span>
    </ContextMenu.Trigger>
    <ContextMenu.Content>
      {#if msg.isMine}
        <ContextMenu.Item onSelect={deleteMessage(msg.id)}><Trash />Delete message</ContextMenu.Item
        >
      {/if}

      <ContextMenu.Item><Bookmark />Save the message</ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu.Root>
</div>

<style>
  .in {
    animation: fadeIn linear;
    animation-range-start: cover;
    animation-range-end: contain;
    animation-timeline: view();
  }

  .out {
    animation: fadeOut linear;
    animation-range-start: cover;
    animation-range-end: contain;
    animation-timeline: view();
  }
</style>
