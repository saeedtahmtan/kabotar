<script lang="ts">
  import * as ContextMenu from '$lib/components/ui/context-menu';
  import { cn } from '$lib/utils';
  import { Bookmark, Check, Trash } from '@lucide/svelte';
  import type { RenderedMessageLayout } from './layout';
  import EmojiRenderer from './renderer.svelte';
  import SlotMachine from './slot-machine.svelte';

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
    'md slide-in in absolute rounded-2xl px-1.5 transition-all',
    msg.isSingleEmoji ? 'bg-transparent!' : 'bg-accent',
    msg.after ? 'rounded-t-none' : '',
    msg.before ? 'rounded-b-none' : '',
    msg.isMine ? 'origin-left self-end rounded-l-2xl!' : 'rounded-r-2xl! bg-bobble',
    msg.isMultiline ? 'origin-right flex-col' : 'items-end'
  )}
  style="width: {msg.maxWidth + 1}px;bottom:{msg.top}px;--y:{msg.top};"
>
  <ContextMenu.Root>
    <ContextMenu.Trigger
      class={cn(
        'flex gap-1',
        msg.isMine && 'flex-row-reverse',
        msg.isMultiline ? 'flex-col' : 'items-end'
      )}
    >
      <div class={msg.isSingleEmoji ? '' : 'unicode'}>
        {#if msg.isSingleEmoji && msg.animatedUrl}
          {#if msg.isSlotMachine && msg.slotMachine}
            <SlotMachine {...msg.slotMachine} />
          {:else}
            <EmojiRenderer src={msg.animatedUrl} randomReplay={true} />
          {/if}
        {:else}
          {@html msg.html}
        {/if}
      </div>
      {#if msg.showTime}
        <span class="flex items-center gap-1 text-xs opacity-50">
          {msg.time}
          {#if msg.isMine}<Check size={16} />{/if}
        </span>
      {/if}
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
    --height: var(--bottom) - var(--top);
    /* opacity: calc((var(--y)) / var(--height)); */
  }
</style>
